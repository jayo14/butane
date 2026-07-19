"""Serializers for the public (unauthenticated) student examination flow.

These serializers deliberately omit any correctness data: choices never expose
``is_correct`` and questions never expose ``explanation`` (until review is
explicitly allowed after submission).
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Attempt, AttemptAnswer, Choice, Exam, Question


class PublicChoiceSerializer(serializers.ModelSerializer):
    """Choice without the ``is_correct`` flag."""

    class Meta:
        model = Choice
        fields = ["id", "label", "text"]


class PublicQuestionSerializer(serializers.ModelSerializer):
    """Question with choices, but never the correct answer or explanation."""

    number = serializers.IntegerField(source="order", read_only=True)
    options = PublicChoiceSerializer(source="choices", many=True)

    class Meta:
        model = Question
        fields = ["id", "number", "text", "type", "marks", "options"]


class PublicExamSerializer(serializers.ModelSerializer):
    """Safe exam payload for the public welcome / take screen."""

    questions = PublicQuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "title", "description", "instructions", "course", "course_code",
            "subject", "class_group", "term", "status", "duration_minutes",
            "total_marks", "passing_marks", "passing_percentage", "show_result",
            "allow_review", "shuffle_questions", "shuffle_answers",
            "question_count", "questions",
        ]


class StartExamRequestSerializer(serializers.Serializer):
    student_name = serializers.CharField(max_length=160)
    admission_number = serializers.CharField(max_length=64)
    class_group = serializers.CharField(max_length=40, required=False, default="")
    term = serializers.CharField(max_length=40, required=False, default="")
    client_meta = serializers.JSONField(required=False, default=dict)


class AttemptAnswerSaveSerializer(serializers.Serializer):
    """A single answer row in the autosave payload."""

    question = serializers.UUIDField()
    selected_choice = serializers.UUIDField(required=False, allow_null=True)


class SaveAttemptRequestSerializer(serializers.Serializer):
    answers = AttemptAnswerSaveSerializer(many=True, required=False, default=list)
    duration_seconds = serializers.IntegerField(required=False, min_value=0)
    client_meta = serializers.JSONField(required=False, default=dict)


class PublicAttemptSerializer(serializers.ModelSerializer):
    """Attempt payload returned to the client (carries the access token once)."""

    answers = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = [
            "id", "access_token", "student_name", "admission_number", "class_group",
            "term", "status", "started_at", "duration_seconds", "answers",
        ]

    def get_answers(self, obj):
        return [
            {"question": str(a.question_id), "selected_choice": str(a.selected_choice_id) if a.selected_choice_id else None}
            for a in obj.answers.all()
        ]
