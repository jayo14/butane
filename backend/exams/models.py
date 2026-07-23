"""Exams app: exams, questions, choices, attempts, answers, and results."""
from __future__ import annotations

import hashlib
import hmac
import uuid

from django.conf import settings
from django.db import models
from django.db.models import UniqueConstraint

from accounts.models import Student, Teacher
from core.models import SoftDeleteModel, TimestampedModel


def _hash_token(raw: str) -> str:
    secret = getattr(settings, "TOKEN_HASH_SECRET", settings.JWT_SECRET).encode("utf-8")
    return hashlib.sha256(secret + raw.encode("utf-8")).hexdigest()


class Subject(TimestampedModel):
    """A subject/course that exams can be categorised under."""

    name = models.CharField(max_length=160, unique=True)
    code = models.CharField(max_length=32, unique=True, blank=True, help_text="e.g. MATH")
    description = models.TextField(blank=True)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="subjects",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "exams_subject"
        ordering = ["name"]
        verbose_name = "subject"
        verbose_name_plural = "subjects"

    def __str__(self) -> str:
        return self.name


class GradeLevel(TimestampedModel):
    """A grade/class level (e.g. JSS1, JSS2, SSS3)."""

    name = models.CharField(max_length=40, unique=True, help_text="e.g. JSS1")
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Sort order")
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="grade_levels",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "exams_grade_level"
        ordering = ["display_order", "name"]
        verbose_name = "grade level"
        verbose_name_plural = "grade levels"

    def __str__(self) -> str:
        return self.name


class Term(TimestampedModel):
    """An academic term (e.g. First Term, Second Term, Third Term)."""

    name = models.CharField(max_length=40, help_text="e.g. First Term")
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Sort order")
    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.PROTECT,
        related_name="terms",
        null=True,
    )

    class Meta:
        db_table = "exams_term"
        ordering = ["display_order", "name"]
        constraints = [
            UniqueConstraint(fields=["name", "session"], name="uq_term_name_per_session"),
        ]

    def __str__(self) -> str:
        return self.name


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
    instructions = models.TextField(blank=True, help_text="Shown to students before the exam starts.")
    course = models.CharField(max_length=160, blank=True, help_text="Course name, e.g. Algebra I")
    course_code = models.CharField(max_length=32, blank=True, help_text="e.g. MATH-101")

    # Frontend-aligned categorical fields used by the exam wizard.
    subject = models.CharField(max_length=80, blank=True)
    class_group = models.CharField(max_length=40, blank=True, help_text="e.g. Grade 10")
    term = models.CharField(max_length=40, blank=True, help_text="e.g. First Term")

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
    passing_percentage = models.PositiveIntegerField(
        default=50, help_text="Pass mark as a percentage of total marks (frontend passMark)."
    )

    available_from = models.DateTimeField(null=True, blank=True)
    available_to = models.DateTimeField(null=True, blank=True)
    shuffle_questions = models.BooleanField(default=False)
    shuffle_answers = models.BooleanField(default=False)
    show_result = models.BooleanField(default=True, help_text="Reveal score to student after submission")
    allow_review = models.BooleanField(default=True, help_text="Allow student to review answers")

    # Public sharing: a signed token lets students open the exam without auth.
    # Only the SHA-256 hash is stored; the raw token is returned once on creation.
    public_token_hash = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    is_public = models.BooleanField(default=False, help_text="Whether the exam is reachable via its public link.")
    published_at = models.DateTimeField(null=True, blank=True, help_text="When the exam was published.")
    archived_at = models.DateTimeField(null=True, blank=True, help_text="When the exam was archived.")

    # Short shareable code (8-char alphanumeric) for easy student access.
    short_code = models.CharField(
        max_length=8, unique=True, null=True, blank=True, db_index=True,
        help_text="Short 8-char code for quick exam lookup.",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="exams",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "exams_exam"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["public_token_hash"]),
        ]

    def __str__(self) -> str:
        return self.title

    def generate_public_token(self) -> str:
        """Create (or regenerate) the signed public token and return it."""
        from django.utils.crypto import get_random_string

        raw = get_random_string(48)
        self.public_token_hash = _hash_token(raw)
        self.is_public = True
        return raw

    def public_url(self, raw_token: str | None = None) -> str | None:
        """Build the shareable URL given the raw token (not stored)."""
        token = raw_token
        if not token:
            return None
        from django.conf import settings

        site = settings.SITE_URL.rstrip("/") if getattr(settings, "SITE_URL", "") else ""
        path = f"/exam/{self.id}?token={token}"
        return f"{site}{path}" if site else path

    def generate_short_code(self) -> str:
        """Generate an 8-char unambiguous alphanumeric short code."""
        from django.utils.crypto import get_random_string

        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        for _ in range(100):
            code = get_random_string(8, allowed_chars=chars)
            if not Exam.objects.filter(short_code=code, is_deleted=False).exists():
                return code
        return get_random_string(8, allowed_chars=chars)

    def publish(self) -> tuple[str | None, str | None]:
        """Move a draft/scheduled exam to published (ongoing) state.
        Returns (public_url, short_code)."""
        from django.utils import timezone

        self.status = "ongoing"
        self.published_at = timezone.now()
        raw_token = None
        if not self.public_token_hash:
            raw_token = self.generate_public_token()
        if not self.short_code:
            self.short_code = self.generate_short_code()
        self.save(update_fields=["status", "published_at", "public_token_hash", "is_public", "short_code", "updated_at"])
        public_url = self.public_url(raw_token) if raw_token else None
        return (public_url, self.short_code)

    def archive(self) -> None:
        """Archive a published exam; archived exams are hidden from active lists."""
        from django.utils import timezone

        self.status = "completed"
        self.archived_at = timezone.now()
        self.is_public = False
        self.save(update_fields=["status", "archived_at", "is_public", "updated_at"])

    @classmethod
    def verify_public_token(cls, token: str) -> "Exam | None":
        token_hash = _hash_token(token)
        return cls.objects.filter(public_token_hash=token_hash, is_deleted=False).first()

    def duplicate(self, created_by: Teacher | None = None) -> "Exam":
        """Return a deep copy of this exam (questions + choices), as a new draft."""
        from django.utils import timezone

        new_exam = Exam.objects.create(
            title=f"{self.title} (Copy)",
            description=self.description,
            instructions=self.instructions,
            course=self.course,
            course_code=self.course_code,
            subject=self.subject,
            class_group=self.class_group,
            term=self.term,
            created_by=created_by or self.created_by,
            status="draft",
            duration_minutes=self.duration_minutes,
            total_marks=self.total_marks,
            passing_marks=self.passing_marks,
            passing_percentage=self.passing_percentage,
            available_from=self.available_from,
            available_to=self.available_to,
            shuffle_questions=self.shuffle_questions,
            shuffle_answers=self.shuffle_answers,
            show_result=self.show_result,
            allow_review=self.allow_review,
        )
        for index, question in enumerate(self.questions.all().order_by("order"), start=1):
            new_q = Question.objects.create(
                exam=new_exam,
                order=index,
                text=question.text,
                type=question.type,
                marks=question.marks,
                explanation=question.explanation,
            )
            for choice in question.choices.all():
                Choice.objects.create(
                    question=new_q,
                    label=choice.label,
                    text=choice.text,
                    is_correct=choice.is_correct,
                )
        return new_exam


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
    image = models.URLField(max_length=500, null=True, blank=True, help_text="Cloudinary image URL for the question")
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

    For the public (unauthenticated) flow the student may be anonymous: the
    identity snapshot (name, admission number, class, term) is captured directly
    on the attempt and the ``student`` FK is optional. An ``access_token`` guards
    the unauthenticated save/resume/submit endpoints so only the holder of an
    attempt can mutate it.
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
        null=True,
        blank=True,
        help_text="Optional link to a known student account (public attempts may be anonymous).",
    )

    # Identity snapshot captured at start time for the public flow.
    student_name = models.CharField(max_length=160, blank=True)
    admission_number = models.CharField(max_length=64, blank=True, db_index=True)
    class_group = models.CharField(max_length=40, blank=True)
    term = models.CharField(max_length=40, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_progress")

    # Guard token for unauthenticated save/resume/submit endpoints.
    # Only the SHA-256 hash is stored; the raw token is returned once on creation.
    access_token_hash = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)

    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0, help_text="Time spent on the attempt")
    client_meta = models.JSONField(default=dict, blank=True, help_text="Free-form client metadata (e.g. device, timing).")

    class Meta:
        db_table = "exams_attempt"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["exam", "admission_number"]),
            models.Index(fields=["student", "status"]),
            models.Index(fields=["exam", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.student_name or self.admission_number or self.student} → {self.exam} ({self.status})"

    def generate_access_token(self) -> str:
        from django.utils.crypto import get_random_string

        raw = get_random_string(48)
        self.access_token_hash = _hash_token(raw)
        return raw

    @classmethod
    def verify_access_token(cls, token: str) -> "Attempt | None":
        token_hash = _hash_token(token)
        return cls.objects.filter(access_token_hash=token_hash, is_deleted=False).first()


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
        null=True,
        blank=True,
        help_text="Optional link to a known student (public attempts may be anonymous).",
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
        indexes = [
            models.Index(fields=["exam", "passed"]),
            models.Index(fields=["student", "percentage"]),
            models.Index(fields=["exam", "student"]),
        ]

    def __str__(self) -> str:
        return f"{self.student} — {self.percentage:.1f}% ({'PASS' if self.passed else 'FAIL'})"
