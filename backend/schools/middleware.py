"""Middleware that resolves the current school from the authenticated user."""
from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin


class CurrentSchoolMiddleware(MiddlewareMixin):
    """Set ``request.school`` from the authenticated user's profile.

    For authenticated teachers/students, the school is read from their
    profile. For unauthenticated requests (public exam flow), the view
    is responsible for resolving the school from the exam/attempt.
    """

    def process_request(self, request):
        request.school = None
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated):
            return
        try:
            if hasattr(user, "teacher_profile"):
                tp = user.teacher_profile
                if tp.school_id is not None:
                    request.school = tp.school
                    return
        except Exception:
            pass
        try:
            if hasattr(user, "student_profile"):
                sp = user.student_profile
                if sp.school_id is not None:
                    request.school = sp.school
                    return
        except Exception:
            pass
