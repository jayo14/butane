"""Public (unauthenticated) student examination flow.

Endpoints are reached via the exam's ``public_token`` and, for attempt
mutations, a per-attempt ``access_token``. Correct answers are never served.
"""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Student, User

from .grading import grade_attempt, submit_and_grade
from .models import Attempt, AttemptAnswer, Choice, Exam, Question, Result
from .public_serializers import (
    PublicAttemptSerializer,
    PublicExamSerializer,
    SaveAttemptRequestSerializer,
    StartExamRequestSerializer,
)
from .serializers import ResultSerializer


def _get_public_exam(token: str) -> Exam:
    exam = Exam.verify_public_token(token)
    if exam is None:
        raise NotFound("Exam not found.")
    return exam


def _validate_available(exam: Exam) -> None:
    """Ensure the exam is published, within its availability window, and not expired."""
    if exam.status not in {"ongoing", "completed"}:
        raise ValidationError("This exam is not available yet.")
    now = timezone.now()
    if exam.available_from and now < exam.available_from:
        raise ValidationError("This exam is not open yet.")
    if exam.available_to and now > exam.available_to:
        raise ValidationError("This exam has closed.")


def _resolve_student(name: str, admission_number: str, exam: Exam) -> Student | None:
    """Create a student account if one with this admission number does not exist."""
    if not admission_number:
        return None
    email = f"{admission_number}@exam.local"
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        from django.utils.crypto import get_random_string

        password = get_random_string(24)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=name,
            role="student",
        )
    student, _ = Student.objects.get_or_create(user=user, defaults={"grade": exam.class_group})
    return student


def _persist_answers(attempt: Attempt, answers: list[dict]) -> None:
    valid_questions = {str(q.id): q for q in attempt.exam.questions.select_related("exam").prefetch_related("choices").all()}
    for ans in answers:
        if not isinstance(ans, dict):
            continue
        question = valid_questions.get(str(ans.get("question")))
        if not question:
            continue
        selected_id = ans.get("selected_choice")
        choice = None
        if selected_id:
            choice = question.choices.filter(id=selected_id).first()
        AttemptAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={"selected_choice": choice},
        )


def _result_response(attempt: Attempt, result: Result) -> Response:
    """Build the submit response, honouring the exam's result-visibility settings.

    - ``show_result=False`` → hidden results: only confirmation, no scores.
    - ``show_result=True``  → instant results: full score breakdown.
    - ``allow_review=True`` → include the per-question review (still no correct answer text).
    """
    if not attempt.exam.show_result:
        return Response(
            {"detail": "Exam submitted successfully.", "attempt_id": str(attempt.id), "show_result": False},
            status=status.HTTP_201_CREATED,
        )

    data = ResultSerializer(result).data
    data["show_result"] = True
    data["allow_review"] = attempt.exam.allow_review
    if attempt.exam.allow_review:
        data["answers"] = [
            {
                "question": str(a.question_id),
                "selected_choice": str(a.selected_choice_id) if a.selected_choice_id else None,
                "is_correct": a.is_correct,
            }
            for a in attempt.answers.all()
        ]
    return Response(data, status=status.HTTP_201_CREATED)
    """Build the submit response, honouring the exam's result-visibility settings.

    - ``show_result=False`` → hidden results: only confirmation, no scores.
    - ``show_result=True``  → instant results: full score breakdown.
    - ``allow_review=True`` → include the per-question review (still no correct answer text).
    """
    if not attempt.exam.show_result:
        return Response(
            {"detail": "Exam submitted successfully.", "attempt_id": str(attempt.id), "show_result": False},
            status=status.HTTP_201_CREATED,
        )

    data = ResultSerializer(result).data
    data["show_result"] = True
    data["allow_review"] = attempt.exam.allow_review
    if attempt.exam.allow_review:
        data["answers"] = [
            {
                "question": str(a.question_id),
                "selected_choice": str(a.selected_choice_id) if a.selected_choice_id else None,
                "is_correct": a.is_correct,
            }
            for a in attempt.answers.all()
        ]
    return Response(data, status=status.HTTP_201_CREATED)


class PublicExamDetailView(APIView):
    """GET /api/public/exams/{token}/ — safe, public exam details."""

    permission_classes = [AllowAny]

    def get(self, request, token: str):
        exam = _get_public_exam(token)
        _validate_available(exam)
        # Never expose the public_token back to the client.
        data = PublicExamSerializer(exam).data
        return Response(data)


class StartAttemptView(APIView):
    """POST /api/public/exams/{token}/start/ — create student + attempt (resume if exists)."""

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @transaction.atomic
    def post(self, request, token: str):
        exam = _get_public_exam(token)
        _validate_available(exam)

        serializer = StartExamRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = _resolve_student(data["student_name"], data["admission_number"], exam)

        # Resume an in-progress attempt for the same exam + admission number.
        existing = Attempt.objects.filter(
            exam=exam, admission_number=data["admission_number"], status="in_progress"
        ).first()
        if existing:
            existing.student_name = data["student_name"]
            existing.class_group = data.get("class_group") or exam.class_group
            existing.term = data.get("term") or exam.term
            existing.client_meta = data.get("client_meta") or {}
            existing.save(update_fields=["student_name", "class_group", "term", "client_meta", "updated_at"])
            return Response(PublicAttemptSerializer(existing).data, status=status.HTTP_200_OK)

        attempt = Attempt.objects.create(
            exam=exam,
            student=student,
            student_name=data["student_name"],
            admission_number=data["admission_number"],
            class_group=data.get("class_group") or exam.class_group,
            term=data.get("term") or exam.term,
            client_meta=data.get("client_meta") or {},
        )
        attempt.generate_access_token()
        attempt.save(update_fields=["access_token", "updated_at"])
        return Response(PublicAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class ResumeAttemptView(APIView):
    """GET /api/public/attempts/{attempt_id}/ — return an attempt + saved answers."""

    permission_classes = [AllowAny]

    def get(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt._access_token_hash or not attempt.access_token or attempt.access_token != request.query_params.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        return Response(PublicAttemptSerializer(attempt).data)


class SaveAttemptView(APIView):
    """POST /api/public/attempts/{attempt_id}/save/ — autosave answers."""

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @transaction.atomic
    def post(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt._access_token_hash or not attempt.access_token or attempt.access_token != request.data.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        if attempt.status == "submitted":
            raise ValidationError("This attempt has already been submitted.")

        serializer = SaveAttemptRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        _persist_answers(attempt, payload["answers"])

        if payload.get("duration_seconds") is not None:
            attempt.duration_seconds = payload["duration_seconds"]
        if payload.get("client_meta"):
            attempt.client_meta = payload["client_meta"]
        attempt.save(update_fields=["duration_seconds", "client_meta", "updated_at"])

        return Response(PublicAttemptSerializer(attempt).data, status=status.HTTP_200_OK)


class SubmitAttemptView(APIView):
    """POST /api/public/attempts/{attempt_id}/submit/ — grade and finalize."""

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @transaction.atomic
    def post(self, request, attempt_id: str):
        attempt = get_object_or_404(Attempt, id=attempt_id, is_deleted=False)
        if not attempt._access_token_hash or not attempt.access_token or attempt.access_token != request.data.get("token"):
            raise PermissionDenied("Invalid attempt token.")
        if attempt.status == "submitted":
            raise ValidationError("This attempt has already been submitted.")

        # Persist any final answers sent with the submission.
        answers = (request.data.get("answers") or []) if isinstance(request.data, dict) else []
        _persist_answers(attempt, answers)

        result = submit_and_grade(attempt)
        return _result_response(attempt, result)
