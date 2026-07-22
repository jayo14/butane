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
        if hasattr(user, "teacher_profile") and user.teacher_profile.school_id:
            request.school = user.teacher_profile.school
        elif hasattr(user, "student_profile") and user.student_profile.school_id:
            request.school = user.student_profile.school
