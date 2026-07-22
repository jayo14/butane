"""ViewSets for the academics domain."""
from __future__ import annotations

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTeacher
from .models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment
from .serializers import AcademicSessionSerializer, AssessmentComponentSerializer, AssessmentScoreSerializer, ClassRoomSerializer, EnrollmentSerializer


class AcademicSessionViewSet(viewsets.ModelViewSet):
    queryset = AcademicSession.objects.all()
    serializer_class = AcademicSessionSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class AssessmentComponentViewSet(viewsets.ModelViewSet):
    queryset = AssessmentComponent.objects.select_related("subject", "classroom", "term")
    serializer_class = AssessmentComponentSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class AssessmentScoreViewSet(viewsets.ModelViewSet):
    queryset = AssessmentScore.objects.select_related("component", "student", "entered_by")
    serializer_class = AssessmentScoreSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        component_id = request.data.get("component_id")
        scores = request.data.get("scores", [])
        if not component_id:
            return Response({"detail": "component_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(scores, list):
            return Response({"detail": "scores must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            component = AssessmentComponent.objects.get(pk=component_id)
        except AssessmentComponent.DoesNotExist:
            return Response({"detail": "AssessmentComponent not found."}, status=status.HTTP_404_NOT_FOUND)

        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(scores):
            student_id = item.get("student_id")
            score = item.get("score")
            if student_id is None or score is None:
                errors.append({"index": idx, "detail": "student_id and score are required."})
                continue
            try:
                obj, was_created = AssessmentScore.objects.update_or_create(
                    component=component,
                    student_id=student_id,
                    defaults={
                        "score": score,
                        "entered_by": request.user.teacher_profile,
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as exc:  # pragma: no cover
                errors.append({"index": idx, "detail": str(exc)})

        return Response(
            {
                "created": created,
                "updated": updated,
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )
