"""Reporting APIs for teachers: exam statistics, question analytics, student
history, and leaderboards.

All endpoints run aggregated queries (Django ORM ``Count``/``Avg``/``Max``/
``Min`` + a single grouped ``AttemptAnswer`` query) so they stay efficient even
with thousands of attempts. Input is scoped and filtered by the requesting
teacher's ownership where applicable.
"""
from __future__ import annotations

from django.db.models import Avg, Count, Max, Min, Q
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer

from accounts.models import Student, Teacher
from accounts.permissions import IsTeacher

from .grading import question_statistics
from .models import Attempt, Exam, Question, Result


def _owned_exam(user, exam_id) -> Exam:
    teacher = Teacher.objects.filter(user=user).first()
    qs = Exam.objects.filter(is_deleted=False, id=exam_id)
    if teacher and user.role != "admin":
        qs = qs.filter(created_by=teacher)
    return qs.first()


def _result_stats(results):
    """Compute headline stats from a queryset of ``Result`` (uses SQL aggregates)."""
    agg = results.aggregate(
        avg=Avg("percentage"),
        highest=Max("percentage"),
        lowest=Min("percentage"),
        count=Count("id"),
        passed=Count("id", filter=Q(passed=True)),
    )
    count = agg["count"] or 0
    avg = round(agg["avg"] or 0.0, 2)
    pass_rate = round((agg["passed"] / count) * 100, 2) if count else 0.0
    return {
        "total_attempts": count,
        "average_score": avg,
        "highest": agg["highest"] or 0.0,
        "lowest": agg["lowest"] or 0.0,
        "total_passed": agg["passed"] or 0,
        "pass_rate": pass_rate,
    }


def _score_distribution(results):
    """Bucket percentages into a 0-100 distribution for charting."""
    buckets = [(0, 39), (40, 54), (55, 69), (70, 84), (85, 100)]
    labels = ["0-39", "40-54", "55-69", "70-84", "85-100"]
    percentages = list(results.values_list("percentage", flat=True))
    out = []
    for (lo, hi), label in zip(buckets, labels):
        count = sum(1 for p in percentages if lo <= (p or 0) <= hi)
        out.append({"range": label, "count": count})
    return out


@extend_schema(
    responses=inline_serializer(
        "ExamStatisticsResponse",
        fields={
            "exam_id": serializers.UUIDField(),
            "title": serializers.CharField(),
            "total_marks": serializers.IntegerField(),
            "passing_marks": serializers.IntegerField(),
            "stats": inline_serializer(
                "ResultStats",
                fields={
                    "total_attempts": serializers.IntegerField(),
                    "average_score": serializers.FloatField(),
                    "highest": serializers.FloatField(),
                    "lowest": serializers.FloatField(),
                    "total_passed": serializers.IntegerField(),
                    "pass_rate": serializers.FloatField(),
                },
            ),
            "distribution": serializers.ListField(
                child=inline_serializer(
                    "ScoreDistribution",
                    fields={"range": serializers.CharField(), "count": serializers.IntegerField()},
                )
            ),
            "question_statistics": serializers.ListField(
                child=inline_serializer(
                    "QuestionStat",
                    fields={
                        "question_id": serializers.UUIDField(),
                        "number": serializers.IntegerField(),
                        "text": serializers.CharField(),
                        "type": serializers.CharField(),
                        "marks": serializers.IntegerField(),
                        "responses": serializers.IntegerField(),
                        "correct_responses": serializers.IntegerField(),
                        "correct_rate": serializers.FloatField(),
                    },
                )
            ),
            "top_performers": serializers.ListField(
                child=inline_serializer(
                    "TopPerformer",
                    fields={
                        "student_id": serializers.UUIDField(allow_null=True),
                        "student_name": serializers.CharField(),
                        "percentage": serializers.FloatField(),
                        "score": serializers.FloatField(),
                        "total_marks": serializers.FloatField(),
                        "passed": serializers.BooleanField(),
                    },
                )
            ),
        },
    ),
    tags=["Reports"],
)
class ExamStatisticsView(APIView):
    """GET /api/reports/exams/{exam_id}/ — aggregate statistics for one exam."""

    permission_classes = [IsTeacher]

    def get(self, request, exam_id: str):
        exam = _owned_exam(request.user, exam_id)
        if not exam:
            return Response({"detail": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        results = Result.objects.filter(exam=exam, is_deleted=False).select_related("student", "student__user", "attempt")
        stats = _result_stats(results)

        top = results.order_by("-percentage", "-score", "created_at")[:10]
        top_performers = [
            {
                "student_id": str(r.student.id) if r.student else None,
                "student_name": r.student.user.full_name if r.student else r.attempt.student_name,
                "percentage": r.percentage,
                "score": r.score,
                "total_marks": r.total_marks,
                "passed": r.passed,
            }
            for r in top
        ]

        return Response(
            {
                "exam_id": str(exam.id),
                "title": exam.title,
                "total_marks": exam.total_marks,
                "passing_marks": exam.passing_marks,
                "stats": stats,
                "distribution": _score_distribution(results),
                "question_statistics": question_statistics(exam),
                "top_performers": top_performers,
            }
        )


@extend_schema(
    responses=inline_serializer(
        "QuestionStatisticsResponse",
        fields={
            "exam_id": serializers.UUIDField(),
            "questions": serializers.ListField(
                child=inline_serializer(
                    "QuestionStat",
                    fields={
                        "question_id": serializers.UUIDField(),
                        "number": serializers.IntegerField(),
                        "text": serializers.CharField(),
                        "type": serializers.CharField(),
                        "marks": serializers.IntegerField(),
                        "responses": serializers.IntegerField(),
                        "correct_responses": serializers.IntegerField(),
                        "correct_rate": serializers.FloatField(),
                    },
                )
            ),
        },
    ),
    tags=["Reports"],
)
class QuestionStatisticsView(APIView):
    """GET /api/reports/exams/{exam_id}/questions/ — per-question analytics."""

    permission_classes = [IsTeacher]

    def get(self, request, exam_id: str):
        exam = _owned_exam(request.user, exam_id)
        if not exam:
            return Response({"detail": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"exam_id": str(exam.id), "questions": question_statistics(exam)})


@extend_schema(
    responses=inline_serializer(
        "StudentHistoryResponse",
        fields={
            "student_id": serializers.UUIDField(),
            "student_name": serializers.CharField(),
            "grade": serializers.CharField(),
            "summary": inline_serializer(
                "StudentSummary",
                fields={
                    "total_exams": serializers.IntegerField(),
                    "average_score": serializers.FloatField(),
                    "highest": serializers.FloatField(),
                    "lowest": serializers.FloatField(),
                    "pass_rate": serializers.FloatField(),
                    "rank": serializers.IntegerField(allow_null=True),
                },
            ),
            "history": serializers.ListField(
                child=inline_serializer(
                    "StudentHistoryItem",
                    fields={
                        "result_id": serializers.UUIDField(),
                        "exam_id": serializers.UUIDField(),
                        "exam_title": serializers.CharField(),
                        "course": serializers.CharField(),
                        "percentage": serializers.FloatField(),
                        "score": serializers.FloatField(),
                        "total_marks": serializers.FloatField(),
                        "passed": serializers.BooleanField(),
                        "correct_count": serializers.IntegerField(),
                        "incorrect_count": serializers.IntegerField(),
                        "unanswered_count": serializers.IntegerField(),
                        "graded_at": serializers.DateTimeField(),
                    },
                )
            ),
        },
    ),
    tags=["Reports"],
)
class StudentHistoryView(APIView):
    """GET /api/reports/students/{student_id}/ — a student's attempt history + summary."""

    permission_classes = [IsTeacher]

    def get(self, request, student_id: str):
        student = Student.objects.filter(id=student_id, is_deleted=False).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        results = Result.objects.filter(student=student, is_deleted=False).select_related("exam")
        stats = _result_stats(results)

        # Global percentile rank: how many results scored strictly higher.
        rank = None
        if stats["total_attempts"]:
            rank = Result.objects.filter(is_deleted=False, percentage__gt=stats["average_score"]).count() + 1

        history = [
            {
                "result_id": str(r.id),
                "exam_id": str(r.exam.id),
                "exam_title": r.exam.title,
                "course": r.exam.course,
                "percentage": r.percentage,
                "score": r.score,
                "total_marks": r.total_marks,
                "passed": r.passed,
                "correct_count": r.correct_count,
                "incorrect_count": r.incorrect_count,
                "unanswered_count": r.unanswered_count,
                "graded_at": r.graded_at,
            }
            for r in results.order_by("-created_at")
        ]

        return Response(
            {
                "student_id": str(student.id),
                "student_name": student.user.full_name,
                "grade": student.grade,
                "summary": {
                    "total_exams": stats["total_attempts"],
                    "average_score": stats["average_score"],
                    "highest": stats["highest"],
                    "lowest": stats["lowest"],
                    "pass_rate": stats["pass_rate"],
                    "rank": rank,
                },
                "history": history,
            }
        )
