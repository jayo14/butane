"""ViewSets for the academics domain."""
from __future__ import annotations

import io
import os
import zipfile
from pathlib import Path

from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.views import SchoolScopedViewSetMixin
from accounts.permissions import IsAdmin, IsTeacher
from .models import (
    AcademicSession,
    AssessmentComponent,
    AssessmentScore,
    BehaviouralRating,
    BehaviouralTrait,
    ClassRoom,
    Enrollment,
    GradeScale,
    ReportCard,
    SchoolProfile,
)
from .serializers import (
    AcademicSessionSerializer,
    AssessmentComponentSerializer,
    AssessmentScoreSerializer,
    BehaviouralRatingSerializer,
    BehaviouralTraitSerializer,
    ClassRoomSerializer,
    EnrollmentSerializer,
    GradeScaleSerializer,
    ReportCardSerializer,
)
from .services import generate_class_report_cards, promote_students, subject_grade


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
        if self.action == "promote":
            return [IsAdmin()]
        return [IsTeacher()]

    @transaction.atomic
    @action(detail=True, methods=["post"], url_path="promote")
    def promote(self, request, pk=None):
        source_classroom = self.get_object()
        target_classroom_id = request.data.get("target_classroom_id")
        target_session_id = request.data.get("target_session_id")
        student_ids = request.data.get("student_ids", [])
        if not target_classroom_id or not target_session_id:
            return Response(
                {"detail": "target_classroom_id and target_session_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(student_ids, list) or not student_ids:
            return Response(
                {"detail": "student_ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_classroom = get_object_or_404(
            ClassRoom, pk=target_classroom_id, school=source_classroom.school
        )
        target_session = get_object_or_404(
            AcademicSession, pk=target_session_id, school=source_classroom.school
        )

        result = promote_students(
            source_classroom, target_classroom, target_session, student_ids
        )
        return Response(result, status=status.HTTP_200_OK)


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


class BehaviouralTraitViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = BehaviouralTrait.objects.all()
    serializer_class = BehaviouralTraitSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]


class BehaviouralRatingViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = BehaviouralRating.objects.select_related(
        "trait", "student", "classroom", "term", "rated_by"
    )
    serializer_class = BehaviouralRatingSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsTeacher()]

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        trait_id = request.data.get("trait_id")
        term_id = request.data.get("term_id")
        classroom_id = request.data.get("classroom_id")
        ratings = request.data.get("ratings", [])
        if not trait_id or not term_id or not classroom_id:
            return Response(
                {"detail": "trait_id, term_id, and classroom_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(ratings, list):
            return Response(
                {"detail": "ratings must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trait = BehaviouralTrait.objects.get(pk=trait_id)
        except BehaviouralTrait.DoesNotExist:
            return Response({"detail": "BehaviouralTrait not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            from exams.models import Term as TermModel

            term = TermModel.objects.get(pk=term_id)
        except TermModel.DoesNotExist:
            return Response({"detail": "Term not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            classroom = ClassRoom.objects.get(pk=classroom_id)
        except ClassRoom.DoesNotExist:
            return Response({"detail": "ClassRoom not found."}, status=status.HTTP_404_NOT_FOUND)

        teacher = request.user.teacher_profile
        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(ratings):
            student_id = item.get("student_id")
            rating = item.get("rating")
            if student_id is None or rating is None:
                errors.append({"index": idx, "detail": "student_id and rating are required."})
                continue
            try:
                obj, was_created = BehaviouralRating.objects.update_or_create(
                    trait=trait,
                    student_id=student_id,
                    term=term,
                    classroom=classroom,
                    defaults={
                        "rating": rating,
                        "rated_by": teacher,
                        "school": classroom.school,
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


class ReportCardViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = ReportCard.objects.select_related("student", "classroom", "term", "approved_by")
    serializer_class = ReportCardSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        if self.action in {"approve", "bulk_approve"}:
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

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="bulk-submit")
    def bulk_submit(self, request):
        classroom_id = request.data.get("classroom_id")
        term_id = request.data.get("term_id")
        if not classroom_id or not term_id:
            return Response({"detail": "classroom_id and term_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(classroom_id=classroom_id, term_id=term_id, status="draft")
        count = qs.update(status="submitted")
        return Response({"submitted": count})

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

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="bulk-approve")
    def bulk_approve(self, request):
        classroom_id = request.data.get("classroom_id")
        term_id = request.data.get("term_id")
        if not classroom_id or not term_id:
            return Response({"detail": "classroom_id and term_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(classroom_id=classroom_id, term_id=term_id, status="submitted")
        from django.utils import timezone
        count = qs.update(status="approved", approved_by=request.user.teacher_profile, approved_at=timezone.now())

        from notifications.tasks import notify_report_card_approved
        for report_id in qs.values_list("id", flat=True):
            notify_report_card_approved.delay(str(report_id))

        return Response({"approved": count})

    def _report_pdf_context(self, report: ReportCard) -> dict:
        from django.conf import settings

        profile = SchoolProfile.load(school=getattr(self.request, "school", None))
        school_name = profile.name
        school_logo_url = profile.logo.url if profile.logo else ""
        primary_color = profile.primary_color or "#006c49"
        secondary_color = profile.secondary_color or "#3c4a42"
        site_url = getattr(settings, "SITE_URL", "").rstrip("/")
        return {
            "report": report,
            "school_name": school_name,
            "school_logo_url": school_logo_url,
            "site_url": site_url,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "times_present": report.times_present,
            "times_absent": report.times_absent,
            "school_days_open": report.school_days_open,
        }

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

        behavioural_ratings = BehaviouralRating.objects.filter(
            student=report.student,
            classroom=report.classroom,
            term=report.term,
        ).select_related("trait").order_by("trait__domain", "trait__display_order")

        context = self._report_pdf_context(report)
        context.update({
            "components": components,
            "scores": scores,
            "behavioural_ratings": behavioural_ratings,
        })
        html = render_to_string("academics/report_card.html", context)

        try:
            from weasyprint import HTML
            pdf_file = HTML(string=html, base_url=context.get("site_url", "")).write_pdf()
        except Exception as exc:
            return Response({"detail": f"PDF generation failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = Response(pdf_file, content_type="application/pdf")
        filename = f"report-card-{report.student.user.full_name}-{report.term.name}.pdf"
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    @action(detail=False, methods=["get"], url_path="bulk-pdf")
    def bulk_pdf(self, request):
        classroom_id = request.query_params.get("classroom_id")
        term_id = request.query_params.get("term_id")
        if not classroom_id or not term_id:
            return Response({"detail": "classroom_id and term_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        reports = self.get_queryset().filter(
            classroom_id=classroom_id, term_id=term_id, status="approved"
        ).select_related("student__user", "classroom", "term")

        if not reports.exists():
            return Response(
                {"detail": "No approved report cards found for this classroom/term."},
                status=status.HTTP_404_NOT_FOUND,
            )

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for report in reports:
                components = list(
                    AssessmentComponent.objects.filter(classroom=report.classroom, term=report.term)
                    .select_related("subject")
                    .prefetch_related("scores__student")
                )
                scores = AssessmentScore.objects.filter(
                    component__in=components,
                    student=report.student,
                ).select_related("component__subject")
                behavioural_ratings = BehaviouralRating.objects.filter(
                    student=report.student,
                    classroom=report.classroom,
                    term=report.term,
                ).select_related("trait").order_by("trait__domain", "trait__display_order")

                context = self._report_pdf_context(report)
                context.update({
                    "components": components,
                    "scores": scores,
                    "behavioural_ratings": behavioural_ratings,
                })
                html = render_to_string("academics/report_card.html", context)
                pdf_bytes = HTML(string=html, base_url=context.get("site_url", "")).write_pdf()
                safe_name = report.student.user.full_name.replace(" ", "_")
                zf.writestr(f"{safe_name}-{report.term.name}.pdf", pdf_bytes)

        buffer.seek(0)
        response = Response(buffer.getvalue(), content_type="application/zip")
        classroom_name = reports.first().classroom.name.replace(" ", "_")
        response["Content-Disposition"] = f"attachment; filename=report-cards-{classroom_name}.zip"
        return response

    @action(detail=True, methods=["get"], url_path="full")
    def full(self, request, pk=None):
        report = self.get_object()
        serializer = self.get_serializer(report)

        scores = AssessmentScore.objects.filter(
            component__classroom=report.classroom,
            component__term=report.term,
            student=report.student,
        ).select_related("component__subject")
        scores_data = AssessmentScoreSerializer(scores, many=True).data

        behavioural_ratings = BehaviouralRating.objects.filter(
            student=report.student,
            classroom=report.classroom,
            term=report.term,
        ).select_related("trait").order_by("trait__domain", "trait__display_order")
        behavioural_data = BehaviouralRatingSerializer(behavioural_ratings, many=True).data

        return Response(
            {
                **serializer.data,
                "scores": scores_data,
                "behavioural_ratings": behavioural_data,
            }
        )

    @action(detail=False, methods=["get"], url_path="student-history")
    def student_history(self, request):
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response(
                {"detail": "student_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reports = self.get_queryset().filter(
            student_id=student_id, is_deleted=False
        ).select_related("classroom", "term", "term__session").order_by(
            "term__session__start_date", "term__display_order"
        )

        grouped: dict[str, dict] = {}
        for report in reports:
            session_name = report.term.session.name if report.term.session else "Unknown"
            group_key = f"{session_name}|{report.classroom.name}"
            if group_key not in grouped:
                grouped[group_key] = {
                    "session": session_name,
                    "classroom": report.classroom.name,
                    "terms": [],
                }
            grouped[group_key]["terms"].append(ReportCardSerializer(report).data)

        return Response(list(grouped.values()))

    @action(detail=False, methods=["get"], url_path="broadsheet")
    def broadsheet(self, request):
        classroom_id = request.query_params.get("classroom_id")
        term_id = request.query_params.get("term_id")
        if not classroom_id or not term_id:
            return Response({"detail": "classroom_id and term_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        components = AssessmentComponent.objects.filter(
            classroom_id=classroom_id, term_id=term_id
        ).select_related("subject")
        subjects = sorted({c.subject for c in components}, key=lambda s: s.name)
        reports = self.get_queryset().filter(
            classroom_id=classroom_id, term_id=term_id
        ).select_related("student__user").order_by("position")

        rows = []
        subject_totals = {s.id: [] for s in subjects}
        for report in reports:
            subject_scores = {}
            for subject in subjects:
                subj_components = [c for c in components if c.subject_id == subject.id]
                total = AssessmentScore.objects.filter(
                    component__in=subj_components,
                    student=report.student,
                ).aggregate(total=Sum("score"))["total"] or 0
                grade, _ = subject_grade(total)
                subject_scores[str(subject.id)] = {"score": total, "grade": grade}
                subject_totals[subject.id].append(total)
            rows.append({
                "student_id": str(report.student_id),
                "student_name": report.student.user.full_name,
                "subjects": subject_scores,
                "total_score": report.total_score,
                "average_score": report.average_score,
                "position": report.position,
                "grade": report.grade,
            })

        class_averages = {
            str(sid): round(sum(vals) / len(vals), 2) if vals else 0
            for sid, vals in subject_totals.items()
        }
        return Response({
            "subjects": [{"id": str(s.id), "name": s.name} for s in subjects],
            "rows": rows,
            "class_averages": class_averages,
            "class_size": len(rows),
        })

    @action(detail=False, methods=["get"], url_path="annual-summary")
    def annual_summary(self, request):
        student_id = request.query_params.get("student_id")
        session_id = request.query_params.get("session_id")
        if not student_id or not session_id:
            return Response({"detail": "student_id and session_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        reports = self.get_queryset().filter(
            student_id=student_id, term__session_id=session_id
        ).select_related("term", "classroom").order_by("term__display_order")
        term_data = [ReportCardSerializer(r).data for r in reports]
        averages = [r.average_score for r in reports if r.average_score is not None]
        annual_average = round(sum(averages) / len(averages), 2) if averages else None
        return Response({
            "student_id": student_id,
            "session_id": session_id,
            "terms": term_data,
            "annual_average": annual_average,
            "terms_recorded": len(term_data),
        })


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

