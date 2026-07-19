"""Reusable abstract base models shared across all apps."""
from __future__ import annotations

import uuid

from django.db import models


class UUIDModel(models.Model):
    """Abstract base providing a UUID primary key.

    UUIDs are used as public identifiers instead of sequential integers so that
    object counts and internal ordering are not leaked through API URLs.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampedModel(UUIDModel):
    """Abstract base adding creation and update timestamps (UTC)."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteModel(TimestampedModel):
    """Abstract base adding reversible (soft) deletion.

    Soft deletion keeps historical records for auditing and reporting while
    excluding them from normal queries via the custom manager.
    """

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        from django.utils import timezone

        if self.is_deleted:
            return (0, {})
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
        return (1, {type(self)._meta.label: 1})
