"""Academics-specific permission checks."""
from __future__ import annotations

from rest_framework import permissions

from .models import TeachingAssignment


class CanEnterScoresForComponent(permissions.BasePermission):
    """Allows score entry only for teachers assigned to the component's subject/class/session."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role == "admin":
            return True
        component = getattr(obj, "component", obj)
        return TeachingAssignment.objects.filter(
            teacher=user.teacher_profile,
            classroom=component.classroom,
            subject=component.subject,
            session=component.term.session,
        ).exists()


class IsClassTeacherOrAdmin(permissions.BasePermission):
    """Allows the classroom's assigned class_teacher, or any admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role == "admin":
            return True
        classroom = getattr(obj, "classroom", obj)
        return classroom.class_teacher_id == user.teacher_profile.id


class CanApproveReportCards(permissions.BasePermission):
    """Allows report-card approval only for users with the can_approve_report_cards capability.

    Admin/superuser still bypasses. For other users, the permission checks the
    user's primary Role via SchoolMembership. Falls back to the legacy
    user.role == "admin" check for backward compatibility.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role == "admin":
            return True

        school = getattr(request, "school", None)
        if school:
            role = user.primary_role_for_school(school)
            if role is not None:
                return role.can_approve_report_cards

        # Fallback: check any membership
        membership = user.school_memberships.select_related("role").first()
        if membership:
            return membership.role.can_approve_report_cards

        return False
