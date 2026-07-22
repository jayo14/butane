"""Accounts app: authentication, users, and teacher/student profiles."""
from __future__ import annotations

import hashlib
import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from core.models import SoftDeleteModel, TimestampedModel


def _hash_invite_token(raw: str) -> str:
    secret = getattr(settings, "TOKEN_HASH_SECRET", settings.JWT_SECRET).encode("utf-8")
    return hashlib.sha256(secret + raw.encode("utf-8")).hexdigest()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if extra.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Email-based user account.

    The login credential is the email address (the frontend login form posts an
    ``email`` field). A single ``role`` field drives authorization for the
    teacher-facing exam platform (admin / teacher / student).
    """

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("teacher", "Teacher"),
        ("student", "Student"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "accounts_user"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email


class Teacher(SoftDeleteModel):
    """Teacher profile linked one-to-one to a user account.

    Teachers author exams. A dedicated profile table stores teacher-specific
    attributes (department) separately from auth concerns so the profile can be
    soft-deleted without touching the login identity.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    employee_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    department = models.CharField(max_length=120, blank=True)
    title = models.CharField(max_length=80, blank=True, help_text="e.g. Mr., Ms., Dr.")
    phone = models.CharField(max_length=32, blank=True)
    avatar = models.ImageField(upload_to="teachers/avatars/", null=True, blank=True)
    bio = models.TextField(blank=True)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="teachers",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "accounts_teacher"
        ordering = ["user__last_name", "user__first_name"]

    def __str__(self) -> str:
        return self.user.full_name or self.employee_id or str(self.id)

    def save(self, *args, **kwargs):
        if not self.employee_id:
            short = str(self.id).replace("-", "")[:12].upper()
            self.employee_id = f"TCH-{short}"
        super().save(*args, **kwargs)


class Student(SoftDeleteModel):
    """Student profile linked one-to-one to a user account.

    Students take exams. Keeping student data on a profile table lets a student
    account be deactivated (soft delete) while preserving their historical
    attempts and results for reporting.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("suspended", "Suspended"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    student_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    grade = models.CharField(max_length=32, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    enrollment_date = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to="students/avatars/", null=True, blank=True)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="students",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "accounts_student"
        ordering = ["user__last_name", "user__first_name"]

    def __str__(self) -> str:
        return self.user.full_name or self.student_id or str(self.id)

    def save(self, *args, **kwargs):
        if not self.student_id:
            short = str(self.id).replace("-", "")[:12].upper()
            self.student_id = f"STU-{short}"
        super().save(*args, **kwargs)


class Invitation(TimestampedModel):
    """Email invitation to join a school as a teacher or admin."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("expired", "Expired"),
    ]

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES, default="teacher")
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
    )

    class Meta:
        db_table = "accounts_invitation"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.email} → {self.school} ({self.role})"

    @staticmethod
    def generate_token() -> tuple[str, str]:
        """Return (raw_token, token_hash)."""
        from django.utils.crypto import get_random_string

        raw = get_random_string(48)
        return raw, _hash_invite_token(raw)

