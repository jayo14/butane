"""ViewSets for the academics domain."""
from __future__ import annotations

import os
from pathlib import Path

from django.db import transaction
from django.template.loader import render_to_string
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.views import SchoolScopedViewSetMixin
from accounts.permissions import IsAdmin, IsTeacher
from .models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment, GradeScale, ReportCard, SchoolProfile
from .serializers import AcademicSessionSerializer, AssessmentComponentSerializer, AssessmentScoreSerializer, ClassRoomSerializer, EnrollmentSerializer, GradeScaleSerializer, ReportCardSerializer
from .services import generate_class_report_cards


class AcademicSessionViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = AcademicSession.objects.all()
    serializer_class = AcademicSessionSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class ClassRoomViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class EnrollmentViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class AssessmentComponentViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = AssessmentComponent.objects.select_related("subject", "classroom", "term")
    serializer_class = AssessmentComponentSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class AssessmentScoreViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
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


class GradeScaleViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = GradeScale.objects.all()
    serializer_class = GradeScaleSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class ReportCardViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ReportCard.objects.select_related("student", "classroom", "term", "approved_by")
    serializer_class = ReportCardSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        if self.action == "approve":
            return [IsAdmin()]
        return [IsTeacher()]

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        classroom_id = request.data.get("classroom_id")
        term_id = request.data.get("term_id")
        if not classroom_id or not term_id:
            return Response({"detail": "classroom_id and term_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            classroom = ClassRoom.objects.get(pk=classroom_id)
            term = type("Term", (), {"id": term_id, "name": ""})()
        except ClassRoom.DoesNotExist:
            return Response({"detail": "ClassRoom not found."}, status=status.HTTP_404_NOT_FOUND)

        from exams.models import Term as TermModel
        try:
            term = TermModel.objects.get(pk=term_id)
        except TermModel.DoesNotExist:
            return Response({"detail": "Term not found."}, status=status.HTTP_404_NOT_FOUND)

        reports = generate_class_report_cards(classroom, term)
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        report = self.get_object()
        if report.status != "draft":
            return Response({"detail": "Only draft report cards can be submitted."}, status=status.HTTP_400_BAD_REQUEST)
        report.status = "submitted"
        report.save(update_fields=["status", "updated_at"])
        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        report = self.get_object()
        if report.status != "submitted":
            return Response({"detail": "Only submitted report cards can be approved."}, status=status.HTTP_400_BAD_REQUEST)
        report.status = "approved"
        report.approved_by = request.user.teacher_profile
        report.approved_at = __import__("django.utils").timezone.now()
        report.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        from notifications.tasks import notify_report_card_approved
        notify_report_card_approved.delay(str(report.id))

        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        report = self.get_object()
        if report.status != "approved":
            return Response({"detail": "Report card is not approved."}, status=status.HTTP_403_FORBIDDEN)

        components = list(
            AssessmentComponent.objects.filter(classroom=report.classroom, term=report.term)
            .select_related("subject")
            .prefetch_related("scores__student")
        )
        scores = AssessmentScore.objects.filter(
            component__in=components,
            student=report.student,
        ).select_related("component__subject")

        from django.conf import settings

        profile = SchoolProfile.load(school=getattr(request, "school", None))
        school_name = profile.name
        school_logo_url = profile.logo.url if profile.logo else ""
        primary_color = profile.primary_color or "#006c49"
        secondary_color = profile.secondary_color or "#3c4a42"
        site_url = getattr(settings, "SITE_URL", "").rstrip("/")

        html = render_to_string(
            "academics/report_card.html",
            {
                "report": report,
                "components": components,
                "scores": scores,
                "school_name": school_name,
                "school_logo_url": school_logo_url,
                "site_url": site_url,
                "primary_color": primary_color,
                "secondary_color": secondary_color,
            },
        )

        try:
            from weasyprint import HTML
            pdf_file = HTML(string=html, base_url=site_url).write_pdf()
        except Exception as exc:
            return Response({"detail": f"PDF generation failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = Response(pdf_file, content_type="application/pdf")
        filename = f"report-card-{report.student.user.full_name}-{report.term.name}.pdf"
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response


class SchoolProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    queryset = SchoolProfile.objects.all()
    serializer_class = None

    def get_serializer(self, *args, **kwargs):
        from .serializers import SchoolProfileSerializer

        return SchoolProfileSerializer(*args, **kwargs)

    def list(self, request):
        profile = SchoolProfile.load(school=getattr(request, "school", None))
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    def partial_update(self, request):
        profile = SchoolProfile.load(school=getattr(request, "school", None))
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

