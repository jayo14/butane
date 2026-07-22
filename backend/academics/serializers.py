"""Serializers for the academics domain."""
from __future__ import annotations

from rest_framework import serializers

from .models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment, GradeScale, ReportCard, SchoolProfile


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


class GradeScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScale
        fields = ["id", "min_score", "max_score", "grade", "remark", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ReportCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportCard
        fields = [
            "id", "student", "classroom", "term", "total_score", "average_score",
            "position", "class_size", "teacher_remark", "principal_remark",
            "status", "approved_by", "approved_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "total_score", "average_score",
            "position", "class_size", "status", "approved_by", "approved_at",
        ]


class SchoolProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolProfile
        fields = [
            "id", "name", "logo", "motto", "address",
            "principal_name", "principal_signature",
            "vice_principal_name", "vice_principal_signature",
            "primary_color", "secondary_color",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
