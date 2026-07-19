"""ViewSets for the exams domain."""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStudent, IsTeacher
from accounts.models import Student, Teacher

from .filters import AttemptFilter, ExamFilter, ResultFilter
from .models import Attempt, Exam, Question, Result
from .serializers import (
    AttemptSerializer,
    ExamDetailSerializer,
    ExamListSerializer,
    ResultSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    """CRUD for exams, including nested question/choice authoring.

    Teachers manage exams; students may only read published ones.
    """

    queryset = Exam.objects.filter(is_deleted=False).prefetch_related("questions__choices")
    filterset_class = ExamFilter
    search_fields = ["title", "course", "course_code", "description"]
    ordering_fields = ["created_at", "title", "total_marks", "duration_minutes"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        return ExamDetailSerializer if self.action in {"retrieve", "create", "update", "partial_update"} else ExamListSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsTeacher()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        serializer.save(created_by=teacher)


class AttemptViewSet(viewsets.ModelViewSet):
    """Students create attempts against exams and submit answers."""

    queryset = Attempt.objects.filter(is_deleted=False).select_related("exam", "student")
    serializer_class = AttemptSerializer
    filterset_class = AttemptFilter
    search_fields = ["exam__title"]
    ordering_fields = ["started_at", "submitted_at"]
    ordering = ["-started_at"]
    permission_classes = [IsStudent]

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        """Submit an attempt: grade answers, build a Result, and finalize."""
        attempt = self.get_object()
        if attempt.status == "submitted":
            return Response({"detail": "Attempt already submitted."}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get("answers", [])
        question_ids = {a["question"] for a in answers if "question" in a}

        # Persist/refresh each answer row and grade it.
        total_marks = attempt.exam.total_marks or 0
        correct = incorrect = unanswered = 0
        earned = 0.0
        question_map = {str(q.id): q for q in attempt.exam.questions.all()}

        for ans in answers:
            question = question_map.get(str(ans.get("question")))
            if not question:
                continue
            selected_id = ans.get("selected_choice")
            choice = None
            if selected_id:
                choice = question.choices.filter(id=selected_id).first()

            is_correct = bool(choice and choice.is_correct)
            awarded = float(question.marks) if is_correct else 0.0
            if selected_id is None:
                unanswered += 1
            elif is_correct:
                correct += 1
                earned += awarded
            else:
                incorrect += 1

            AttemptAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={"selected_choice": choice, "is_correct": is_correct, "awarded_marks": awarded},
            )

        attempt.status = "submitted"
        from django.utils import timezone
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=["status", "submitted_at", "updated_at"])

        percentage = round((earned / total_marks) * 100, 2) if total_marks else 0.0
        passed = earned >= attempt.exam.passing_marks

        result = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                "exam": attempt.exam,
                "student": attempt.student,
                "score": earned,
                "total_marks": total_marks,
                "percentage": percentage,
                "passed": passed,
                "correct_count": correct,
                "incorrect_count": incorrect,
                "unanswered_count": unanswered,
                "graded_at": timezone.now(),
            },
        )[0]

        return Response(ResultSerializer(result).data, status=status.HTTP_201_CREATED)


class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only aggregated results for reporting."""

    queryset = Result.objects.filter(is_deleted=False).select_related("exam", "student", "student__user")
    serializer_class = ResultSerializer
    filterset_class = ResultFilter
    search_fields = ["student__user__first_name", "student__user__last_name", "exam__title"]
    ordering_fields = ["percentage", "score", "graded_at", "created_at"]
    ordering = ["-created_at"]
    permission_classes = [IsTeacher]
