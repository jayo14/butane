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
