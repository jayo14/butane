"""Public (unauthenticated) student examination flow.

Endpoints are reached via the exam's ``public_token`` and, for attempt
mutations, a per-attempt ``access_token``. Correct answers are never served.
"""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Student, User

from .models import Attempt, AttemptAnswer, Choice, Exam, Question, Result
from .public_serializers import (
    PublicAttemptSerializer,
    PublicExamSerializer,
    SaveAttemptRequestSerializer,
    StartExamRequestSerializer,
)
from .serializers import ResultSerializer


def _get_public_exam(token: str) -> Exam:
    exam = Exam.objects.filter(public_token=token, is_deleted=False).first()
    if exam is None:
        raise NotFound("Exam not found.")
    return exam


def _validate_available(exam: Exam) -> None:
    """Ensure the exam is published, within its availability window, and not expired."""
    if exam.status not in {"ongoing", "completed"}:
        raise ValidationError("This exam is not available yet.")
    now = timezone.now()
    if exam.available_from and now < exam.available_from:
        raise ValidationError("This exam is not open yet.")
    if exam.available_to and now > exam.available_to:
        raise ValidationError("This exam has closed.")


def _resolve_student(name: str, admission_number: str, exam: Exam) -> Student | None:
    """Create a student account if one with this admission number does not exist."""
    if not admission_number:
        return None
    user, _ = User.objects.get_or_create(
        email__iexact=f"{admission_number}@exam.local",
        defaults={
            "email": f"{admission_number}@exam.local",
            "first_name": name,
            "role": "student",
        },
    )
    student, _ = Student.objects.get_or_create(user=user, defaults={"grade": exam.class_group})
    return student


class PublicExamDetailView(APIView):
    """GET /api/public/exams/{token}/ — safe, public exam details."""

    permission_classes = [AllowAny]

    def get(self, request, token: str):
        exam = _get_public_exam(token)
        _validate_available(exam)
        # Never expose the public_token back to the client.
        data = PublicExamSerializer(exam).data
        return Response(data)


class StartAttemptView(APIView):
    """POST /api/public/exams/{token}/start/ — create student + attempt (resume if exists)."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, token: str):
        exam = _get_public_exam(token)
        _validate_available(exam)

        serializer = StartExamRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = _resolve_student(data["student_name"], data["admission_number"], exam)

        # Resume an in-progress attempt for the same exam + admission number.
        existing = Attempt.objects.filter(
            exam=exam, admission_number=data["admission_number"], status="in_progress"
        ).first()
        if existing:
            existing.student_name = data["student_name"]
            existing.class_group = data.get("class_group") or exam.class_group
            existing.term = data.get("term") or exam.term
            existing.client_meta = data.get("client_meta") or {}
            existing.save(update_fields=["student_name", "class_group", "term", "client_meta", "updated_at"])
            return Response(PublicAttemptSerializer(existing).data, status=status.HTTP_200_OK)

        attempt = Attempt.objects.create(
            exam=exam,
            student=student,
            student_name=data["student_name"],
            admission_number=data["admission_number"],
            class_group=data.get("class_group") or exam.class_group,
            term=data.get("term") or exam.term,
            client_meta=data.get("client_meta") or {},
        )
        attempt.generate_access_token()
        attempt.save(update_fields=["access_token", "updated_at"])
        return Response(PublicAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class ResumeAttemptView(APIView):
    """GET /api/public/attempts/{attempt_id}/ — return an attempt + saved answers."""

    permission_classes = [AllowAny]

    def get(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt.access_token or attempt.access_token != request.query_params.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        return Response(PublicAttemptSerializer(attempt).data)


class SaveAttemptView(APIView):
    """POST /api/public/attempts/{attempt_id}/save/ — autosave answers."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt.access_token or attempt.access_token != request.data.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        if attempt.status == "submitted":
            raise ValidationError("This attempt has already been submitted.")

        serializer = SaveAttemptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        valid_questions = {str(q.id): q for q in attempt.exam.questions.all()}
        for ans in payload["answers"]:
            question = valid_questions.get(str(ans["question"]))
            if not question:
                continue
            selected_id = ans.get("selected_choice")
            choice = None
            if selected_id:
                choice = question.choices.filter(id=selected_id).first()
            AttemptAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={"selected_choice": choice},
            )

        if payload.get("duration_seconds") is not None:
            attempt.duration_seconds = payload["duration_seconds"]
        if payload.get("client_meta"):
            attempt.client_meta = payload["client_meta"]
        attempt.save(update_fields=["duration_seconds", "client_meta", "updated_at"])

        return Response(PublicAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class SubmitAttemptView(APIView):
    """POST /api/public/attempts/{attempt_id}/submit/ — grade and finalize."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt.access_token or attempt.access_token != request.data.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        if attempt.status == "submitted":
            raise ValidationError("This attempt has already been submitted.")

        # Persist any final answers sent with the submission.
        answers = (request.data.get("answers") or []) if isinstance(request.data, dict) else []
        valid_questions = {str(q.id): q for q in attempt.exam.questions.all()}
        for ans in answers:
            question = valid_questions.get(str(ans.get("question"))) if isinstance(ans, dict) else None
            if not question:
                continue
            selected_id = ans.get("selected_choice")
            choice = question.choices.filter(id=selected_id).first() if selected_id else None
            AttemptAnswer.objects.update_or_create(
                attempt=attempt, question=question,
                defaults={"selected_choice": choice},
            )

        total_marks = attempt.exam.total_marks or 0
        correct = incorrect = unanswered = 0
        earned = 0.0
        for ans in attempt.answers.select_related("question", "selected_choice").all():
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

        attempt.status = "submitted"
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=["status", "submitted_at", "updated_at"])

        percentage = round((earned / total_marks) * 100, 2) if total_marks else 0.0
        passed = earned >= attempt.exam.passing_marks
        result = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                "exam": attempt.exam,
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
        )[0]

        # Return the safe result; explanations only if review is allowed.
        data = ResultSerializer(result).data
        data["allow_review"] = attempt.exam.allow_review
        if attempt.exam.allow_review:
            data["answers"] = [
                {
                    "question": str(a.question_id),
                    "selected_choice": str(a.selected_choice_id) if a.selected_choice_id else None,
                    "is_correct": a.is_correct,
                }
                for a in attempt.answers.all()
            ]
        return Response(data, status=status.HTTP_201_CREATED)
