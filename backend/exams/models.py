"""Exams app: exams, questions, choices, attempts, answers, and results."""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models

from accounts.models import Student, Teacher
from core.models import SoftDeleteModel, TimestampedModel


class Exam(SoftDeleteModel):
    """An assessment authored by a teacher.

    The exam owns an ordered set of questions. Settings control availability,
    timing, and how results are presented to students.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    course = models.CharField(max_length=160, blank=True, help_text="Course name, e.g. Algebra I")
    course_code = models.CharField(max_length=32, blank=True, help_text="e.g. MATH-101")

    created_by = models.ForeignKey(
        Teacher,
        on_delete=models.PROTECT,
        related_name="exams",
        help_text="Teacher who authored the exam.",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    duration_minutes = models.PositiveIntegerField(default=60, help_text="Time limit in minutes")
    total_marks = models.PositiveIntegerField(default=0, help_text="Sum of question marks")
    passing_marks = models.PositiveIntegerField(default=0, help_text="Minimum marks to pass")

    available_from = models.DateTimeField(null=True, blank=True)
    available_to = models.DateTimeField(null=True, blank=True)
    shuffle_questions = models.BooleanField(default=False)
    shuffle_answers = models.BooleanField(default=False)
    show_result = models.BooleanField(default=True, help_text="Reveal score to student after submission")
    allow_review = models.BooleanField(default=True, help_text="Allow student to review answers")

    class Meta:
        db_table = "exams_exam"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self) -> str:
        return self.title


class Question(TimestampedModel):
    """A single question belonging to an exam.

    Questions carry their own ``marks`` so the exam total can be aggregated.
    ``order`` preserves the authored sequence (and supports shuffling at
    delivery time without mutating stored order).
    """

    QUESTION_TYPES = [
        ("single_choice", "Single choice"),
        ("multiple_choice", "Multiple choice"),
        ("true_false", "True / False"),
    ]

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    order = models.PositiveIntegerField(default=0, db_index=True)
    text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES, default="single_choice")
    marks = models.PositiveIntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Shown after submission if review is allowed")

    class Meta:
        db_table = "exams_question"
        ordering = ["order", "created_at"]
        unique_together = [("exam", "order")]

    def __str__(self) -> str:
        return f"Q{self.order}: {self.text[:50]}"


class Choice(TimestampedModel):
    """A selectable answer option for a question.

    Exactly one choice per single-choice question is flagged ``is_correct``.
    Storing choices as their own rows (rather than a JSON blob) keeps the data
    normalized, queryable, and filterable, and prevents leaking the correct
    answer position to the client when shuffled.
    """

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name="choices",
    )
    label = models.CharField(max_length=8, blank=True, help_text="Display label, e.g. A, B, C")
    text = models.CharField(max_length=512)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = "exams_choice"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.label or ''}. {self.text[:40]}"


class Attempt(SoftDeleteModel):
    """A student's attempt at taking an exam.

    One attempt represents a single sitting. Linking to both the student and the
    exam lets us compute per-student and per-exam analytics, enforce one active
    attempt at a time, and attribute results even after the exam is archived.
    """

    STATUS_CHOICES = [
        ("in_progress", "In progress"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
        ("abandoned", "Abandoned"),
    ]

    exam = models.ForeignKey(
        Exam,
        on_delete=models.PROTECT,
        related_name="attempts",
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="attempts",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_progress")

    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0, help_text="Time spent on the attempt")

    class Meta:
        db_table = "exams_attempt"
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["exam", "student"])]

    def __str__(self) -> str:
        return f"{self.student} → {self.exam} ({self.status})"


class AttemptAnswer(TimestampedModel):
    """A student's selected choice for one question within an attempt.

    Recording answers at the attempt level (not on the question) preserves a
    historical, immutable record of what the student actually chose, independent
    of later edits to the question or its choices.
    """

    attempt = models.ForeignKey(
        Attempt,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
        related_name="answers",
    )
    selected_choice = models.ForeignKey(
        Choice,
        on_delete=models.PROTECT,
        related_name="attempt_answers",
        null=True,
        blank=True,
        help_text="Null when the question was left unanswered.",
    )
    is_correct = models.BooleanField(default=False)
    awarded_marks = models.FloatField(default=0.0)

    class Meta:
        db_table = "exams_attempt_answer"
        ordering = ["question__order"]
        unique_together = [("attempt", "question")]

    def __str__(self) -> str:
        return f"{self.attempt_id} / Q{self.question.order}"


class Result(SoftDeleteModel):
    """Aggregated outcome of a completed attempt.

    Stored separately from the attempt so the headline score, pass/fail, and
    percentage are cheap to read and query without re-aggregating answers. The
    detailed breakdown remains available through the attempt's answers.
    """

    attempt = models.OneToOneField(
        Attempt,
        on_delete=models.CASCADE,
        related_name="result",
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.PROTECT,
        related_name="results",
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="results",
    )

    score = models.FloatField(default=0.0, help_text="Marks obtained")
    total_marks = models.FloatField(default=0.0, help_text="Max marks for the exam")
    percentage = models.FloatField(default=0.0)
    passed = models.BooleanField(default=False)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    unanswered_count = models.PositiveIntegerField(default=0)

    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "exams_result"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["exam", "passed"])]

    def __str__(self) -> str:
        return f"{self.student} — {self.percentage:.1f}% ({'PASS' if self.passed else 'FAIL'})"
