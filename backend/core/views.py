"""Reusable view mixins for the API."""
from __future__ import annotations

from rest_framework import viewsets


class SchoolScopedViewSetMixin:
    """Mixin that filters queryset by ``request.school``."""

    school_field = "school"

    def get_queryset(self):
        qs = super().get_queryset()
        school = getattr(self.request, "school", None)
        if school is None:
            return qs.none()
        return qs.filter(**{self.school_field: school})
