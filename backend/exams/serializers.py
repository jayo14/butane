"""Serializers for the exams domain, including nested exam authoring."""
from __future__ import annotations

from rest_framework import serializers

from accounts.models import Student, Teacher
from .models import Attempt, AttemptAnswer, Exam, Result
from .question_serializers import QuestionSerializer

from .models import GradeLevel, Subject, Term

__all__ = [
    "SubjectSerializer",
    "GradeLevelSerializer",
    "TermSerializer",
    "QuestionSerializer",
    "ExamListSerializer",
    "ExamDetailSerializer",
    "AttemptSerializer",
    "AttemptAnswerSerializer",
    "ResultSerializer",
]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GradeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeLevel
        fields = ["id", "name", "display_order", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ["id", "name", "display_order", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ExamListSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_public = serializers.BooleanField(read_only=True)
    short_url = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id", "title", "course", "course_code", "subject", "class_group", "term",
            "status", "duration_minutes", "total_marks", "passing_marks",
            "passing_percentage", "is_public", "created_by", "question_count",
            "short_code", "short_url", "published_at", "created_at",
        ]

    def get_short_url(self, obj: Exam) -> str | None:
        return obj.public_url(raw_token=None)


class ExamDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    created_by = serializers.CharField(source="created_by.user.full_name", read_only=True)
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id", "title", "description", "instructions", "course", "course_code",
            "subject", "class_group", "term", "created_by", "status",
            "duration_minutes", "total_marks", "passing_marks", "passing_percentage",
            "available_from", "available_to", "shuffle_questions", "shuffle_answers",
            "show_result", "allow_review", "is_public", "public_url",
            "published_at", "archived_at", "short_code", "questions", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "created_by", "status", "is_public",
            "public_url", "published_at", "archived_at",
        ]

    def get_public_url(self, obj):
        return None

    def validate(self, attrs):
        total_marks = attrs.get("total_marks", self.instance.total_marks if self.instance else 0)
        passing_marks = attrs.get("passing_marks", self.instance.passing_marks if self.instance else 0)
        passing_percentage = attrs.get("passing_percentage", self.instance.passing_percentage if self.instance else 50)
        duration_minutes = attrs.get("duration_minutes", self.instance.duration_minutes if self.instance else 60)
        available_from = attrs.get("available_from", getattr(self.instance, "available_from", None))
        available_to = attrs.get("available_to", getattr(self.instance, "available_to", None))

        if passing_marks > total_marks and total_marks:
            raise serializers.ValidationError({"passing_marks": "Passing marks cannot exceed total marks."})
        if passing_percentage < 0 or passing_percentage > 100:
            raise serializers.ValidationError({"passing_percentage": "Must be between 0 and 100."})
        if duration_minutes <= 0:
            raise serializers.ValidationError({"duration_minutes": "Must be a positive integer."})
        if available_from and available_to and available_from >= available_to:
            raise serializers.ValidationError({"available_to": "Must be after available_from."})
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
            qs = QuestionSerializer()
            for index, question in enumerate(questions, start=1):
                question.setdefault("order", index)
                qs.create({**question, "exam": instance})
        return instance

    def update(self, instance, validated_data):
        questions = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions is not None:
            existing = {q.id: q for q in instance.questions.all()}
            incoming_ids = {q.get("id") for q in questions if q.get("id")}
            question_serializer = QuestionSerializer()
            for index, question_data in enumerate(questions, start=1):
                qid = question_data.get("id")
                if qid and qid in existing:
                    q = existing.pop(qid)
                    question_serializer.update(q, {**question_data, "exam": instance})
                else:
                    question_data["order"] = index
                    question_serializer.create({**question_data, "exam": instance})
            for stale in existing.values():
                stale.delete()
        return instance


class AttemptAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptAnswer
        fields = ["id", "question", "selected_choice", "is_correct", "awarded_marks"]
        read_only_fields = ["id", "is_correct", "awarded_marks"]


class AttemptSerializer(serializers.ModelSerializer):
    answers = AttemptAnswerSerializer(many=True, required=False)
    student_name = serializers.CharField(read_only=True)

    class Meta:
        model = Attempt
        fields = [
            "id", "exam", "student", "student_name", "status", "started_at", "submitted_at",
            "duration_seconds", "answers", "created_at",
        ]
        read_only_fields = ["id", "started_at", "submitted_at", "created_at"]

    def validate_answers(self, answers):
        return answers


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    exam_title = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            "id", "attempt", "exam", "student", "student_name", "exam_title",
            "subject", "duration_seconds", "score", "total_marks", "percentage",
            "passed", "correct_count", "incorrect_count", "unanswered_count",
            "graded_at", "created_at",
        ]
        read_only_fields = fields

    def get_student_name(self, obj):
        if obj.student and obj.student.user_id:
            return obj.student.user.full_name
        if obj.attempt_id:
            return obj.attempt.student_name or ""
        return ""

    def get_exam_title(self, obj):
        return obj.exam.title if obj.exam_id else ""

    def get_subject(self, obj):
        return obj.exam.subject if obj.exam_id else ""

    def get_duration_seconds(self, obj):
        if obj.attempt_id:
            return obj.attempt.duration_seconds
        return 0

