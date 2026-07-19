"""Serializers for the exams domain, including nested exam authoring."""
from __future__ import annotations

from rest_framework import serializers

from accounts.models import Student, Teacher
from .models import Attempt, AttemptAnswer, Exam, Result
from .question_serializers import QuestionSerializer

__all__ = [
    "QuestionSerializer",
    "ExamListSerializer",
    "ExamDetailSerializer",
    "AttemptSerializer",
    "AttemptAnswerSerializer",
    "ResultSerializer",
]


class ExamListSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    is_public = serializers.BooleanField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "title", "course", "course_code", "subject", "class_group", "term",
            "status", "duration_minutes", "total_marks", "passing_marks",
            "passing_percentage", "is_public", "created_by", "question_count",
            "created_at", "published_at",
        ]


class ExamDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "title", "description", "instructions", "course", "course_code",
            "subject", "class_group", "term", "created_by", "status",
            "duration_minutes", "total_marks", "passing_marks", "passing_percentage",
            "available_from", "available_to", "shuffle_questions", "shuffle_answers",
            "show_result", "allow_review", "is_public", "public_token", "public_url",
            "published_at", "archived_at", "questions", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by", "status", "is_public",
            "public_token", "public_url", "published_at", "archived_at",
        ]

    def validate(self, attrs):
        if attrs.get("passing_marks", 0) > attrs.get("total_marks", 0) and attrs.get("total_marks"):
            raise serializers.ValidationError("Passing marks cannot exceed total marks.")
        return attrs

    def create(self, validated_data):
        questions = validated_data.pop("questions")
        exam = Exam.objects.create(**validated_data)
        question_serializer = QuestionSerializer()
        for index, question in enumerate(questions, start=1):
            question.setdefault("order", index)
            question_serializer.create({**question, "exam": exam})
        return exam

    def update(self, instance, validated_data):
        questions = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions is not None:
            instance.questions.all().delete()
            question_serializer = QuestionSerializer()
            for index, question in enumerate(questions, start=1):
                question.setdefault("order", index)
                question_serializer.create({**question, "exam": instance})
        return instance


class AttemptAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptAnswer
        fields = ["id", "question", "selected_choice", "is_correct", "awarded_marks"]
        read_only_fields = ["id", "is_correct", "awarded_marks"]


class AttemptSerializer(serializers.ModelSerializer):
    answers = AttemptAnswerSerializer(many=True, required=False)

    class Meta:
        model = Attempt
        fields = [
            "id", "exam", "student", "status", "started_at", "submitted_at",
            "duration_seconds", "answers", "created_at",
        ]
        read_only_fields = ["id", "started_at", "submitted_at", "created_at"]

    def validate_answers(self, answers):
        return answers


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)

    class Meta:
        model = Result
        fields = [
            "id", "attempt", "exam", "student", "student_name", "score",
            "total_marks", "percentage", "passed", "correct_count",
            "incorrect_count", "unanswered_count", "graded_at", "created_at",
        ]
        read_only_fields = fields
