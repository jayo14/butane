"""Serializers for the academics domain."""
from __future__ import annotations

from rest_framework import serializers

from .models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment


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


class AssessmentComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentComponent
        fields = ["id", "subject", "classroom", "term", "name", "max_score", "component_type", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        instance = AssessmentComponent(**attrs)
        try:
            instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return attrs


class AssessmentScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentScore
        fields = ["id", "component", "student", "score", "entered_by", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
