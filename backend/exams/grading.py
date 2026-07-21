"""Automatic grading service.

Centralizes the answer-comparison and result-storage logic that was previously
duplicated across the authenticated and public submit views. Grading is
idempotent: calling it on an already-submitted attempt recomputes and updates
the existing ``Result`` rather than creating a second one.
"""
from __future__ import annotations

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from .models import Attempt, AttemptAnswer, Result


def grade_attempt(attempt: Attempt) -> Result:
    """Grade a submitted attempt, persist ``AttemptAnswer`` correctness, and store the ``Result``.

    ``total_marks`` is computed from the exam's actual questions so it is
    accurate even when the teacher did not set ``Exam.total_marks`` manually.
    ``duration_seconds`` is backfilled from ``started_at`` / ``submitted_at``
    if the client did not send it.
    """
    exam = attempt.exam
    total_marks = sum(exam.questions.values_list("marks", flat=True)) or 0

    correct = incorrect = unanswered = 0
    earned = 0.0

    answers = list(attempt.answers.select_related("question", "selected_choice").all())
    for ans in answers:
        question = ans.question
        choice = ans.selected_choice
        is_correct = bool(choice and choice.is_correct)
        awarded = float(question.marks) if is_correct else 0.0
        ans.is_correct = is_correct
        ans.awarded_marks = awarded
        ans.save(update_fields=["is_correct", "awarded_marks", "updated_at"])
        if choice is None:
            unanswered += 1
        elif is_correct:
            correct += 1
            earned += awarded
        else:
            incorrect += 1

    percentage = round((earned / total_marks) * 100, 2) if total_marks else 0.0
    passed = earned >= exam.passing_marks

    if attempt.duration_seconds == 0 and attempt.started_at and attempt.submitted_at:
        attempt.duration_seconds = int((attempt.submitted_at - attempt.started_at).total_seconds())
        attempt.save(update_fields=["duration_seconds", "updated_at"])

    result, _ = Result.objects.update_or_create(
        attempt=attempt,
        defaults={
            "exam": exam,
            "student": attempt.student,
            "score": earned,
            "total_marks": total_marks,
            "percentage": percentage,
            "passed": passed,
            "correct_count": correct,
            "incorrect_count": incorrect,
            "unanswered_count": unanswered,
            "graded_at": timezone.now(),
        },
    )
    return result


@transaction.atomic
def submit_and_grade(attempt: Attempt) -> Result:
    """Mark the attempt submitted and grade it in a single transaction."""
    if attempt.status == "submitted":
        # Idempotent: re-grade without erroring so retries are safe.
        return grade_attempt(attempt)
    attempt.status = "submitted"
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["status", "submitted_at", "updated_at"])
    return grade_attempt(attempt)


def question_statistics(exam) -> list[dict]:
    """Per-question statistics across all submitted attempts for an exam.

    Each entry reports how many students answered and how many answered
    correctly, plus the resulting correctness rate — useful for spotting
    ambiguous or too-hard questions. Computed with a single grouped aggregate
    query to avoid N+1 lookups.
    """
    attempts = Attempt.objects.filter(exam=exam, status="submitted", is_deleted=False)
    answers = (
        AttemptAnswer.objects.filter(attempt__in=attempts)
        .values("question")
        .annotate(
            total=Count("id"),
            correct=Count("id", filter=Q(is_correct=True)),
        )
    )
    stats_by_question = {row["question"]: row for row in answers}

    out = []
    for question in exam.questions.order_by("order").select_related("exam"):
        row = stats_by_question.get(question.id)
        total = row["total"] if row else 0
        correct = row["correct"] if row else 0
        rate = round((correct / total) * 100, 2) if total else 0.0
        out.append(
            {
                "question_id": str(question.id),
                "number": question.order,
                "text": question.text,
                "type": question.type,
                "marks": question.marks,
                "responses": total,
                "correct_responses": correct,
                "correct_rate": rate,
            }
        )
    return out
