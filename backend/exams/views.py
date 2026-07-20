"""ViewSets for the exams domain."""
from __future__ import annotations

from django.db import models, transaction
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer

from accounts.permissions import IsStudent, IsTeacher
from accounts.models import Student, Teacher

from core.throttling import LoginRateThrottle
from .filters import AttemptFilter, ExamFilter, ResultFilter
from .grading import submit_and_grade
from .models import Attempt, AttemptAnswer, Exam, Question, Result
from .public_views import _result_response
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

    queryset = Exam.objects.filter(is_deleted=False).prefetch_related("questions__choices").annotate(
        question_count=models.Count("questions")
    )
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
        if getattr(user, "role", None) != "admin":
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                qs = qs.filter(created_by=teacher)
            else:
                qs = qs.none()
        return qs

    def perform_create(self, serializer):
        teacher = get_object_or_404(Teacher, user=self.request.user)
        serializer.save(created_by=teacher)

    def _own_exam(self, exam) -> None:
        if exam.created_by.user_id != self.request.user.id and self.request.user.role != "admin":
            self.permission_denied(self.request, message="You do not own this exam.")

    @transaction.atomic
    @extend_schema(
        request=None,
        responses=ExamDetailSerializer,
        tags=["Exams"],
    )
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
        public_url = exam.publish()
        data = ExamDetailSerializer(exam).data
        if public_url:
            data["public_url"] = public_url
        return Response(data)

    @transaction.atomic
    @extend_schema(
        request=None,
        responses=inline_serializer(
            "PublicTokenResponse",
            fields={
                "public_token": serializers.CharField(),
                "public_url": serializers.URLField(),
                "is_public": serializers.BooleanField(),
            },
        ),
        tags=["Exams"],
    )
    @action(detail=True, methods=["post"], url_path="generate-public-token")
    def generate_public_token(self, request, pk=None):
        """Generate (or regenerate) the signed public token and return the link."""
        exam = self.get_object()
        self._own_exam(exam)
        token = exam.generate_public_token()
        exam.save(update_fields=["public_token_hash", "is_public", "updated_at"])
        return Response({"public_token": token, "public_url": exam.public_url(token), "is_public": exam.is_public})

    @transaction.atomic
    @extend_schema(
        request=None,
        responses=inline_serializer(
            "RevokeTokenResponse",
            fields={
                "is_public": serializers.BooleanField(),
                "public_token": serializers.CharField(allow_null=True),
            },
        ),
        tags=["Exams"],
    )
    @action(detail=True, methods=["post"], url_path="revoke-public-token")
    def revoke_public_token(self, request, pk=None):
        """Disable public access by clearing the token."""
        exam = self.get_object()
        self._own_exam(exam)
        exam.public_token_hash = None
        exam.is_public = False
        exam.save(update_fields=["public_token_hash", "is_public", "updated_at"])
        return Response({"is_public": False, "public_token": None})

    @transaction.atomic
    @extend_schema(
        request=None,
        responses=ExamDetailSerializer,
        tags=["Exams"],
    )
    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        """Create a deep copy of the exam as a new draft owned by the teacher."""
        exam = self.get_object()
        self._own_exam(exam)
        teacher = get_object_or_404(Teacher, user=request.user)
        new_exam = exam.duplicate(created_by=teacher)
        return Response(ExamDetailSerializer(new_exam).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @extend_schema(
        request=None,
        responses=ExamDetailSerializer,
        tags=["Exams"],
    )
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
    @extend_schema(
        request=inline_serializer(
            "SubmitAnswersRequest",
            fields={
                "answers": serializers.ListField(
                    required=False,
                    child=inline_serializer(
                        "SubmitAnswer",
                        fields={
                            "question": serializers.UUIDField(),
                            "selected_choice": serializers.UUIDField(allow_null=True, required=False),
                        },
                    ),
                )
            },
        ),
        responses={
            status.HTTP_201_CREATED: inline_serializer(
                "SubmitResultResponse",
                fields={
                    "detail": serializers.CharField(required=False),
                    "attempt_id": serializers.UUIDField(required=False),
                    "show_result": serializers.BooleanField(),
                    "allow_review": serializers.BooleanField(required=False),
                    "score": serializers.FloatField(required=False),
                    "total_marks": serializers.FloatField(required=False),
                    "percentage": serializers.FloatField(required=False),
                    "passed": serializers.BooleanField(required=False),
                    "correct_count": serializers.IntegerField(required=False),
                    "incorrect_count": serializers.IntegerField(required=False),
                    "unanswered_count": serializers.IntegerField(required=False),
                    "graded_at": serializers.DateTimeField(required=False),
                    "answers": serializers.ListField(
                        required=False,
                        child=inline_serializer(
                            "SubmitAnswerReview",
                            fields={
                                "question": serializers.UUIDField(),
                                "selected_choice": serializers.UUIDField(allow_null=True),
                                "is_correct": serializers.BooleanField(),
                            },
                        ),
                    ),
                },
            )
        },
        tags=["Attempts"],
    )
    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        """Submit an attempt: persist answers, auto-grade, and store the Result."""
        throttle = LoginRateThrottle()
        if not throttle.allow_request(request, self):
            raise Throttled(throttle.wait())

        attempt = self.get_queryset().select_for_update().get(id=pk)
        if attempt.status == "submitted":
            return Response({"detail": "Attempt already submitted."}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get("answers", [])
        questions = attempt.exam.questions.prefetch_related("choices").all()
        question_map = {str(q.id): q for q in questions}
        choices_lookup = {}
        for q in questions:
            choices_lookup[str(q.id)] = {str(c.id): c for c in q.choices.all()}
        for ans in answers:
            question = question_map.get(str(ans.get("question")))
            if not question:
                continue
            selected_id = ans.get("selected_choice")
            choice = None
            if selected_id:
                choice = choices_lookup.get(str(question.id), {}).get(str(selected_id))
            AttemptAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={"selected_choice": choice},
            )

        result = submit_and_grade(attempt)

        attempt = Attempt.objects.prefetch_related("answers").get(id=attempt.id)
        return _result_response(attempt, result)


class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only aggregated results for reporting.

    Supports filtering (exam, student, passed, percentage range, graded date
    range), full-text search, sorting, and pagination. Queries are optimized
    with ``select_related`` so per-result student/exam lookups don't trigger
    N+1 queries.
    """

    serializer_class = ResultSerializer
    filterset_class = ResultFilter
    search_fields = ["student__user__first_name", "student__user__last_name", "exam__title", "attempt__student_name"]
    ordering_fields = ["percentage", "score", "correct_count", "graded_at", "created_at"]
    ordering = ["-created_at"]
    permission_classes = [IsTeacher]

    def get_queryset(self):
        qs = Result.objects.filter(is_deleted=False).select_related(
            "exam", "student", "student__user", "attempt"
        )
        user = self.request.user
        if getattr(user, "role", None) != "admin":
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                qs = qs.filter(exam__created_by=teacher)
        return qs
