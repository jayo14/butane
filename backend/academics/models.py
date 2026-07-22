"""Academic structures: sessions, classrooms, student enrollments, and assessment components/scores."""
from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models

from core.models import SoftDeleteModel, TimestampedModel


class AcademicSession(TimestampedModel):
    """A named academic session (e.g. "2025/2026")."""

    name = models.CharField(max_length=20, unique=True, help_text='e.g. "2025/2026"')
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False, help_text="Only one session should be current at a time.")

    class Meta:
        db_table = "academics_session"
        ordering = ["-start_date"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicSession.objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class ClassRoom(TimestampedModel):
    """A named classroom tied to a grade level."""

    name = models.CharField(max_length=80, help_text='e.g. "JSS2A"')
    grade_level = models.ForeignKey(
        "exams.GradeLevel",
        on_delete=models.PROTECT,
        related_name="classrooms",
    )

    class Meta:
        db_table = "academics_classroom"
        ordering = ["grade_level__display_order", "name"]
        unique_together = [("name", "grade_level")]

    def __str__(self) -> str:
        return self.name


class Enrollment(TimestampedModel):
    """Links a student to a classroom for a specific academic session."""

    student = models.ForeignKey(
        "accounts.Student",
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )

    class Meta:
        db_table = "academics_enrollment"
        ordering = ["-session__start_date", "classroom__name"]
        unique_together = [("student", "session")]

    def __str__(self) -> str:
        return f"{self.student} → {self.classroom} ({self.session})"


class AssessmentComponent(TimestampedModel):
    """A named assessment component within a subject/class/term."""

    COMPONENT_TYPES = [
        ("ca", "CA"),
        ("assignment", "Assignment"),
        ("practical", "Practical"),
        ("exam", "Exam"),
        ("project", "Project"),
    ]

    subject = models.ForeignKey(
        "exams.Subject",
        on_delete=models.PROTECT,
        related_name="assessment_components",
    )
    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.PROTECT,
        related_name="assessment_components",
    )
    term = models.ForeignKey(
        "exams.Term",
        on_delete=models.PROTECT,
        related_name="assessment_components",
    )
    name = models.CharField(max_length=80, help_text='e.g. "CA1", "Exam"')
    max_score = models.PositiveIntegerField(default=100, help_text="Maximum attainable score for this component.")
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES, default="ca")

    class Meta:
        db_table = "academics_assessment_component"
        ordering = ["term__display_order", "subject__name", "name"]
        unique_together = [("subject", "classroom", "term", "name")]

    def __str__(self) -> str:
        return f"{self.subject} / {self.classroom} / {self.term} / {self.name}"

    def clean(self):
        total = (
            AssessmentComponent.objects.filter(
                subject=self.subject,
                classroom=self.classroom,
                term=self.term,
            ).exclude(pk=self.pk)
            .exclude(is_deleted=True)
            .values_list("max_score", flat=True)
        )
        if sum(total) + self.max_score > 100:
            raise ValidationError(
                {"max_score": "Total component scores for this subject/class/term exceed 100."}
            )


class AssessmentScore(TimestampedModel):
    """A student's score for a specific assessment component."""

    component = models.ForeignKey(
        AssessmentComponent,
        on_delete=models.PROTECT,
        related_name="scores",
    )
    student = models.ForeignKey(
        "accounts.Student",
        on_delete=models.PROTECT,
        related_name="assessment_scores",
    )
    score = models.FloatField(default=0.0, help_text="Score obtained by the student.")
    entered_by = models.ForeignKey(
        "accounts.Teacher",
        on_delete=models.PROTECT,
        related_name="entered_scores",
    )

    class Meta:
        db_table = "academics_assessment_score"
        ordering = ["component__term__display_order", "student__user__last_name"]
        unique_together = [("component", "student")]

    def __str__(self) -> str:
        return f"{self.student} — {self.component}: {self.score}"


class GradeScale(TimestampedModel):
    """Global grading scale (e.g. A, B, C)."""

    min_score = models.FloatField(help_text="Minimum score for this grade (inclusive).")
    max_score = models.FloatField(help_text="Maximum score for this grade (inclusive).")
    grade = models.CharField(max_length=8, help_text='e.g. "A", "B2"')
    remark = models.CharField(max_length=80, help_text='e.g. "Excellent", "Good"')

    class Meta:
        db_table = "academics_grade_scale"
        ordering = ["-min_score"]

    def __str__(self) -> str:
        return f"{self.grade} ({self.min_score}-{self.max_score})"


class ReportCard(SoftDeleteModel):
    """Generated report card for a student in a classroom/term."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("approved", "Approved"),
    ]

    student = models.ForeignKey(
        "accounts.Student",
        on_delete=models.PROTECT,
        related_name="report_cards",
    )
    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.PROTECT,
        related_name="report_cards",
    )
    term = models.ForeignKey(
        "exams.Term",
        on_delete=models.PROTECT,
        related_name="report_cards",
    )
    total_score = models.FloatField(default=0.0, help_text="Sum of all assessment scores.")
    average_score = models.FloatField(default=0.0, help_text="Average across subjects.")
    position = models.PositiveIntegerField(null=True, blank=True, help_text="Computed rank in class.")
    class_size = models.PositiveIntegerField(default=0, help_text="Snapshot of class size at generation time.")
    teacher_remark = models.TextField(blank=True)
    principal_remark = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    approved_by = models.ForeignKey(
        "accounts.Teacher",
        on_delete=models.PROTECT,
        related_name="approved_report_cards",
        null=True,
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "academics_report_card"
        ordering = ["-created_at"]
        unique_together = [("student", "classroom", "term")]

    def __str__(self) -> str:
        return f"{self.student} — {self.classroom} ({self.term})"


class SchoolProfile(TimestampedModel):
    """Singleton school profile used for branding."""

    name = models.CharField(max_length=160, default="Dee Soar School")
    logo = models.ImageField(upload_to="school/logo/", null=True, blank=True)
    motto = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    principal_name = models.CharField(max_length=160, blank=True)
    principal_signature = models.ImageField(upload_to="school/signatures/", null=True, blank=True)
    vice_principal_name = models.CharField(max_length=160, blank=True)
    vice_principal_signature = models.ImageField(upload_to="school/signatures/", null=True, blank=True)
    primary_color = models.CharField(max_length=7, default="#006c49", help_text="Hex color, e.g. #006c49")
    secondary_color = models.CharField(max_length=7, default="#3c4a42", help_text="Hex color, e.g. #3c4a42")

    class Meta:
        db_table = "academics_school_profile"
        verbose_name = "school profile"
        verbose_name_plural = "school profiles"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

