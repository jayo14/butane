"""Services for the academics domain."""
from __future__ import annotations

from collections import defaultdict
from math import ceil

from django.db import transaction

from accounts.models import Student
from exams.models import Result
from .models import AssessmentComponent, AssessmentScore, ClassRoom, Enrollment, ReportCard


def link_exam_result(result: Result, component: AssessmentComponent) -> AssessmentScore:
    """Upsert an AssessmentScore scaled from a graded exam result.

    Scales ``result.percentage`` onto ``component.max_score`` and stores it as
    the student's score for the given assessment component.
    """
    if component.component_type != "exam":
        raise ValueError("AssessmentComponent must be of type 'exam' to link a CBT result.")

    scaled = round(result.percentage / 100 * component.max_score, 2)

    with transaction.atomic():
        score, _ = AssessmentScore.objects.update_or_create(
            component=component,
            student=result.student,
            defaults={
                "score": scaled,
                "entered_by": result.exam.created_by,
            },
        )
    return score


def generate_report_card(student: Student, classroom: ClassRoom, term) -> ReportCard:
    """Generate or regenerate a report card for a single student.

    Computes total_score, average_score, and position within the class.
    """
    components = list(
        AssessmentComponent.objects.filter(classroom=classroom, term=term).select_related("subject")
    )
    scores_qs = AssessmentScore.objects.filter(
        component__in=components,
        student=student,
    ).select_related("component__subject")

    total_score = sum(s.score for s in scores_qs)
    subject_count = len({s.component.subject_id for s in scores_qs})
    average_score = round(total_score / subject_count, 2) if subject_count else 0.0

    with transaction.atomic():
        report, _ = ReportCard.objects.update_or_create(
            student=student,
            classroom=classroom,
            term=term,
            defaults={
                "total_score": total_score,
                "average_score": average_score,
                "class_size": Enrollment.objects.filter(classroom=classroom, session__is_current=True).count(),
                "school": classroom.school,
            },
        )
    return report


def _compute_positions(classroom: ClassRoom, term) -> None:
    """Recompute positions for all students in a class for a term.

    Ties share the same position (standard competition ranking), and the
    next rank skips accordingly.
    """
    reports = list(
        ReportCard.objects.filter(classroom=classroom, term=term, is_deleted=False).select_related("student")
    )
    if not reports:
        return

    sorted_reports = sorted(reports, key=lambda r: r.total_score, reverse=True)
    current_rank = 1
    for idx, report in enumerate(sorted_reports):
        if idx > 0 and report.total_score < sorted_reports[idx - 1].total_score:
            current_rank = idx + 1
        report.position = current_rank

    ReportCard.objects.bulk_update(sorted_reports, ["position"])


def generate_class_report_cards(classroom: ClassRoom, term) -> list[ReportCard]:
    """Generate report cards for every student in a class and compute positions.

    Returns the list of generated/updated ReportCard instances.
    """
    students = list(
        Student.objects.filter(
            enrollments__classroom=classroom,
            enrollments__session__is_current=True,
        ).distinct()
    )

    reports = []
    with transaction.atomic():
        for student in students:
            report = generate_report_card(student, classroom, term)
            reports.append(report)
        _compute_positions(classroom, term)

    return reports
