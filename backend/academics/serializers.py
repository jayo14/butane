"""Serializers for the academics domain."""
from __future__ import annotations

from rest_framework import serializers

from .models import AcademicSession, ClassRoom, Enrollment


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ["id", "name", "start_date", "end_date", "is_current", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = ["id", "name", "grade_level", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student", "classroom", "session", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
