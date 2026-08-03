"""Permission policies for the API.

Authorization is role-based and layered on top of DRF's authentication. The
platform has three roles (admin / teacher / student) defined on the custom
:class:`accounts.models.User`.
"""
from __future__ import annotations

from rest_framework import permissions


class IsTeacher(permissions.BasePermission):
    """Allows access only to users with teacher-level capabilities.

    Checks the ``can_enter_scores`` capability, falling back to legacy
    ``user.role in {"teacher", "admin"}`` for backward compatibility.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        school = getattr(request, "school", None)
        return user.has_capability("can_enter_scores", school=school)


class IsStudent(permissions.BasePermission):
    """Allows access only to student users.

    Checks for a student profile (new system) or legacy ``user.role == "student"``.
    Admin users are also allowed.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if hasattr(user, "student_profile"):
            return True
        school = getattr(request, "school", None)
        return user.has_capability("can_manage_students", school=school)


class IsAdmin(permissions.BasePermission):
    """Allows access only to admin users.

    Checks the ``can_manage_school`` capability, falling back to legacy
    ``user.role == "admin"`` for backward compatibility.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        school = getattr(request, "school", None)
        return user.has_capability("can_manage_school", school=school)


class IsOwnerOrTeacher(permissions.BasePermission):
    """Object-level check: allow the owner of a record or any teacher/admin.

    Expects the target object to expose ``user`` (pointing at the owning
    :class:`accounts.models.User`) or ``student``/``teacher`` profile whose
    ``.user`` is the owner. Falls back to teacher/admin for broad access.

    Also enforces school scoping: the object's school must match the
    requesting user's school (admins bypass this).
    """

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        school = getattr(request, "school", None)
        if user.has_capability("can_manage_school", school=school):
            return True
        if user.has_capability("can_enter_scores", school=school):
            return True

        owner = getattr(obj, "user", None)
        if owner is None:
            student = getattr(obj, "student", None)
            owner = getattr(student, "user", None)
        if owner and owner == user:
            return True

        obj_school = getattr(obj, "school", None)
        if obj_school is None:
            student = getattr(obj, "student", None)
            if student:
                obj_school = getattr(student, "school", None)
        request_school = getattr(request, "school", None)
        if obj_school and request_school and obj_school == request_school:
            return True

        return False
