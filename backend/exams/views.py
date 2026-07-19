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
from .grading import submit_and_grade
from .models import Attempt, AttemptAnswer, Exam, Question, Result
from .serializers import (
    AttemptSerializer,
    ExamDetailSerializer,
    ExamListSerializer,
    ResultSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    """CRUD + lifecycle actions (publish, share, duplicate, archive) for exams.

    Only the owning teacher (or an admin) may create/update/delete or perform
    lifecycle actions. Listing and retrieval are restricted to teachers.
    """

    queryset = Exam.objects.filter(is_deleted=False).prefetch_related("questions__choices")
    filterset_class = ExamFilter
    search_fields = ["title", "course", "course_code", "subject", "description"]
    ordering_fields = ["created_at", "title", "total_marks", "duration_minutes", "published_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        return ExamDetailSerializer if self.action in {"retrieve", "create", "update", "partial_update"} else ExamListSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsTeacher()]
        return [IsTeacher()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Teachers see only their own exams; admins see everything.
        if getattr(user, "role", None) != "admin":
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                qs = qs.filter(created_by=teacher)
        return qs

    def perform_create(self, serializer):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        serializer.save(created_by=teacher)

    def _own_exam(self, exam) -> None:
        if exam.created_by.user_id != self.request.user.id and self.request.user.role != "admin":
            self.permission_denied(self.request, message="You do not own this exam.")

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """Publish the exam: set status to ongoing and enable its public link."""
        exam = self.get_object()
        self._own_exam(exam)
        if not exam.questions.exists():
            return Response(
                {"detail": "Cannot publish an exam without questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exam.publish()
        return Response(ExamDetailSerializer(exam).data)

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="generate-public-token")
    def generate_public_token(self, request, pk=None):
        """Generate (or regenerate) the signed public token and return the link."""
        exam = self.get_object()
        self._own_exam(exam)
        token = exam.generate_public_token()
        exam.save(update_fields=["public_token", "is_public", "updated_at"])
        return Response({"public_token": token, "public_url": exam.public_url, "is_public": exam.is_public})

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="revoke-public-token")
    def revoke_public_token(self, request, pk=None):
        """Disable public access by clearing the token."""
        exam = self.get_object()
        self._own_exam(exam)
        exam.public_token = None
        exam.is_public = False
        exam.save(update_fields=["public_token", "is_public", "updated_at"])
        return Response({"is_public": False, "public_token": None})

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        """Create a deep copy of the exam as a new draft owned by the teacher."""
        exam = self.get_object()
        self._own_exam(exam)
        teacher = get_object_or_404(Teacher, user=request.user)
        new_exam = exam.duplicate(created_by=teacher)
        return Response(ExamDetailSerializer(new_exam).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        """Archive the exam and disable its public link."""
        exam = self.get_object()
        self._own_exam(exam)
        exam.archive()
        return Response(ExamDetailSerializer(exam).data)


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
        """Submit an attempt: persist answers, auto-grade, and store the Result."""
        attempt = self.get_object()
        if attempt.status == "submitted":
            return Response({"detail": "Attempt already submitted."}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get("answers", [])
        question_map = {str(q.id): q for q in attempt.exam.questions.all()}
        for ans in answers:
            question = question_map.get(str(ans.get("question")))
            if not question:
                continue
            selected_id = ans.get("selected_choice")
            choice = question.choices.filter(id=selected_id).first() if selected_id else None
            AttemptAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={"selected_choice": choice},
            )

        result = submit_and_grade(attempt)

        # Respect the exam's result-visibility setting.
        if not attempt.exam.show_result:
            return Response(
                {"detail": "Exam submitted successfully.", "attempt_id": str(attempt.id), "show_result": False},
                status=status.HTTP_201_CREATED,
            )
        data = ResultSerializer(result).data
        data["show_result"] = True
        data["allow_review"] = attempt.exam.allow_review
        return Response(data, status=status.HTTP_201_CREATED)


class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only aggregated results for reporting.

    Supports filtering (exam, student, passed, percentage range, graded date
    range), full-text search, sorting, and pagination. Queries are optimized
    with ``select_related`` so per-result student/exam lookups don't trigger
    N+1 queries.
    """

    queryset = Result.objects.filter(is_deleted=False).select_related(
        "exam", "student", "student__user", "attempt"
    )
    serializer_class = ResultSerializer
    filterset_class = ResultFilter
    search_fields = ["student__user__first_name", "student__user__last_name", "exam__title", "attempt__student_name"]
    ordering_fields = ["percentage", "score", "correct_count", "graded_at", "created_at"]
    ordering = ["-created_at"]
    permission_classes = [IsTeacher]
