"""Question management views: CRUD, reorder, duplicate, mark correct.

All operations are scoped to a parent exam and enforce that the requesting
teacher owns that exam. Questions are ordered by the ``order`` integer field,
so reordering just renumbers the affected questions.
"""
from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTeacher
from .models import Choice, Exam, Question
from .question_serializers import ChoiceSerializer, QuestionSerializer


class QuestionViewSet(viewsets.ModelViewSet):
    """Manage questions that belong to an exam."""

    serializer_class = QuestionSerializer
    permission_classes = [IsTeacher]

    def get_exam(self) -> Exam:
        exam = get_object_or_404(Exam, id=self.kwargs["exam_id"], is_deleted=False)
        if exam.created_by.user_id != self.request.user.id:
            self.permission_denied(self.request, message="You do not own this exam.")
        return exam

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Question.objects.none()
        exam = self.get_exam()
        return exam.questions.all()

    def perform_create(self, serializer):
        exam = self.get_exam()
        order = exam.questions.count() + 1
        serializer.save(exam=exam, order=order)

    def perform_update(self, serializer):
        serializer.save()

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, exam_id=None):
        """Reorder questions given an ordered list of question ids."""
        exam = self.get_exam()
        ordered_ids = request.data.get("question_ids", [])
        if not isinstance(ordered_ids, list) or not ordered_ids:
            return Response({"detail": "question_ids list is required."}, status=status.HTTP_400_BAD_REQUEST)

        questions = {str(q.id): q for q in exam.questions.all()}
        if set(ordered_ids) != set(questions.keys()):
            return Response(
                {"detail": "Provided ids must match the exam's questions exactly."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reassign order via a temporary large offset to avoid unique
        # collisions on intermediate values, then compact to 1..N.
        offset = (exam.questions.count() + 1) * 1000
        for index, qid in enumerate(ordered_ids, start=offset):
            q = questions[str(qid)]
            q.order = index
            q.save(update_fields=["order", "updated_at"])
        for index, qid in enumerate(ordered_ids, start=1):
            q = questions[str(qid)]
            q.order = index
            q.save(update_fields=["order", "updated_at"])
        return Response(QuestionSerializer(exam.questions.all(), many=True).data)

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, exam_id=None, pk=None):
        """Duplicate a single question (with its choices) at the end of the exam."""
        exam = self.get_exam()
        source = self.get_object()
        order = exam.questions.count() + 1
        new_q = Question.objects.create(
            exam=exam,
            order=order,
            text=source.text,
            type=source.type,
            marks=source.marks,
            explanation=source.explanation,
        )
        for choice in source.choices.all():
            Choice.objects.create(
                question=new_q,
                label=choice.label,
                text=choice.text,
                is_correct=choice.is_correct,
            )
        return Response(QuestionSerializer(new_q).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    @action(detail=True, methods=["patch"], url_path="mark-correct")
    def mark_correct(self, request, exam_id=None, pk=None):
        """Set the correct answer(s) for a question.

        For single-choice questions exactly one choice id is expected; for
        multiple-choice questions a list is expected.
        """
        question = self.get_object()
        choice_ids = request.data.get("choice_ids", request.data.get("choice_id"))
        if choice_ids is None:
            return Response(
                {"detail": "choice_id or choice_ids is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(choice_ids, list):
            choice_ids = [choice_ids]

        valid_ids = {str(c.id) for c in question.choices.all()}
        if not set(choice_ids).issubset(valid_ids):
            return Response(
                {"detail": "choice_ids must belong to this question."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if question.type == "single_choice" and len(choice_ids) != 1:
            return Response(
                {"detail": "A single-choice question must have exactly one correct answer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for choice in question.choices.all():
            choice.is_correct = str(choice.id) in choice_ids
            choice.save(update_fields=["is_correct", "updated_at"])
        return Response(ChoiceSerializer(question.choices.all(), many=True).data)
