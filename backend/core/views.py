"""Reusable view mixins for the API."""
from __future__ import annotations

from rest_framework import viewsets


def _resolve_school(request):
    school = getattr(request, "school", None)
    if school is not None:
        return school
    user = getattr(request, "user", None)
    if not (user and user.is_authenticated):
        return None
    try:
        if hasattr(user, "teacher_profile"):
            tp = user.teacher_profile
            if tp.school_id is not None:
                return tp.school
    except Exception:
        pass
    try:
        if hasattr(user, "student_profile"):
            sp = user.student_profile
            if sp.school_id is not None:
                return sp.school
    except Exception:
        pass
    return None


class SchoolScopedViewSetMixin:
    """Mixin that filters queryset by the user's school."""

    school_field = "school"

    def get_queryset(self):
        qs = super().get_queryset()
        school = _resolve_school(self.request)
        if school is None:
            return qs.none()
        return qs.filter(**{self.school_field: school})
