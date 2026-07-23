"""In-app notification model."""
from __future__ import annotations

from django.db import models

from core.models import SchoolScopedModel


class Notification(SchoolScopedModel):
    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient.email}: {self.message[:60]}"
