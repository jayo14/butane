"""Academic structures: sessions, classrooms, and student enrollments."""
from __future__ import annotations

from django.db import models

from core.models import TimestampedModel


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
