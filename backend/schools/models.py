"""Schools app: tenant school profiles."""
from __future__ import annotations

from django.db import models

from core.models import TimestampedModel


class School(TimestampedModel):
    """A tenant school."""

    STATUS_CHOICES = [
        ("pending_verification", "Pending Verification"),
        ("active", "Active"),
        ("suspended", "Suspended"),
    ]

    name = models.CharField(max_length=160)
    slug = models.CharField(max_length=80, unique=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="active")

    class Meta:
        db_table = "schools_school"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
