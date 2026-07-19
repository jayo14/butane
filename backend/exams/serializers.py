"""Serializers for the exams domain, including nested exam authoring."""
from __future__ import annotations

from rest_framework import serializers

from accounts.models import Student, Teacher
from .models import Attempt, AttemptAnswer, Choice, Exam, Question, Result


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "label", "text", "is_correct"]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "order", "text", "type", "marks", "explanation", "choices"]
        read_only_fields = ["id"]

    def validate_choices(self, choices):
        if not choices:
            raise serializers.ValidationError("A question must have at least one choice.")
        return choices

    def create(self, validated_data):
        choices = validated_data.pop("choices")
        question = Question.objects.create(**validated_data)
        for choice in choices:
            Choice.objects.create(question=question, **choice)
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if choices is not None:
            instance.choices.all().delete()
            for choice in choices:
                Choice.objects.create(question=instance, **choice)
        return instance


class ExamListSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "title", "course", "course_code", "status", "duration_minutes",
            "total_marks", "passing_marks", "created_by", "question_count",
            "created_at",
        ]


class ExamDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id", "title", "description", "course", "course_code", "created_by",
            "status", "duration_minutes", "total_marks", "passing_marks",
            "available_from", "available_to", "shuffle_questions",
            "shuffle_answers", "show_result", "allow_review", "questions",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def validate(self, attrs):
        if attrs.get("passing_marks", 0) > attrs.get("total_marks", 0) and attrs.get("total_marks"):
            raise serializers.ValidationError("Passing marks cannot exceed total marks.")
        return attrs


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
