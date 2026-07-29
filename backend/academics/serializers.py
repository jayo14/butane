"""Serializers for the academics domain."""
from __future__ import annotations

from rest_framework import serializers

from .models import (
    AcademicSession,
    AssessmentComponent,
    AssessmentScore,
    BehaviouralRating,
    BehaviouralTrait,
    ClassRoom,
    Enrollment,
    GradeScale,
    ReportCard,
    SchoolProfile,
    TeachingAssignment,
)


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = ["id", "name", "start_date", "end_date", "is_current", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = ["id", "name", "grade_level", "class_teacher", "created_at", "updated_at"]
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
    subject_grade = serializers.SerializerMethodField()
    subject_remark = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentScore
        fields = ["id", "component", "student", "score", "entered_by", "subject_grade", "subject_remark", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_subject_grade(self, instance: AssessmentScore) -> str:
        return instance.grade_and_remark[0]

    def get_subject_remark(self, instance: AssessmentScore) -> str:
        return instance.grade_and_remark[1]


class GradeScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeScale
        fields = ["id", "school", "min_score", "max_score", "grade", "remark", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class BehaviouralTraitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviouralTrait
        fields = ["id", "name", "domain", "display_order", "school", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class BehaviouralRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviouralRating
        fields = ["id", "trait", "student", "classroom", "term", "rating", "rated_by", "school", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "rated_by"]


class ReportCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportCard
        fields = [
            "id", "student", "classroom", "term", "total_score", "average_score",
            "position", "class_size", "grade", "remark_suggestion",
            "times_present", "times_absent", "school_days_open",
            "teacher_remark", "principal_remark",
            "status", "approved_by", "approved_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "total_score", "average_score",
            "position", "class_size", "grade", "remark_suggestion", "status", "approved_by", "approved_at",
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


class TeachingAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingAssignment
        fields = ["id", "teacher", "classroom", "subject", "session", "school", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        teacher = attrs.get("teacher")
        classroom = attrs.get("classroom")
        if teacher and classroom and teacher.school_id != classroom.school_id:
            raise serializers.ValidationError(
                "Teacher and classroom must belong to the same school."
            )
        return attrs
