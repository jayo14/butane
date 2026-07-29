"""Academics-specific permission checks."""
from __future__ import annotations

from rest_framework import permissions

from .models import TeachingAssignment


class CanEnterScoresForComponent(permissions.BasePermission):
    """Allows score entry only for teachers assigned to the component's subject/class/session."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "admin":
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
        if user.role == "admin":
            return True
        classroom = getattr(obj, "classroom", obj)
        return classroom.class_teacher_id == user.teacher_profile.id
