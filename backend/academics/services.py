"""Services for the academics domain."""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from math import ceil

from django.db import transaction

from accounts.models import Student
from exams.models import _DEFAULT_TERMS, GradeLevel, Result, Term
from .models import (
    AcademicSession,
    AssessmentComponent,
    AssessmentScore,
    ClassRoom,
    Enrollment,
    GradeScale,
    ReportCard,
)

SUBJECT_GRADE_BANDS = (
    (70, 100, "A", "EXCELLENT"),
    (50, 69.99, "C", "CREDIT"),
    (40, 49.99, "P", "PASS"),
    (0, 39.99, "F", "FAIL"),
)


def subject_grade(score: float) -> tuple[str, str]:
    if score is None:
        return ("", "")
    for min_score, max_score, grade, remark in SUBJECT_GRADE_BANDS:
        if min_score <= score <= max_score:
            return (grade, remark)
    return ("", "")


def average_remark(average_score: float) -> str:
    if average_score >= 70:
        return "An excellent performance. Keep it up."
    if average_score >= 60:
        return "A good result, work more on your weak subjects."
    if average_score >= 50:
        return "An average result, you can still do better next term."
    if average_score >= 40:
        return "The result is below average, you need to buckle up academically."
    return "The result is far below average, you need to be serious with your studies."


def _grade_for_average(average_score: float, classroom: ClassRoom) -> GradeScale | None:
    return GradeScale.objects.filter(
        min_score__lte=average_score,
        max_score__gte=average_score,
        school=classroom.school,
    ).first()


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

    Computes total_score, average_score, position within the class,
    grade from the school's GradeScale, and a remark suggestion.
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

    grade_scale = _grade_for_average(average_score, classroom)
    grade = grade_scale.grade if grade_scale else ""
    remark_suggestion = average_remark(average_score)

    with transaction.atomic():
        report, created = ReportCard.objects.update_or_create(
            student=student,
            classroom=classroom,
            term=term,
            defaults={
                "total_score": total_score,
                "average_score": average_score,
                "class_size": Enrollment.objects.filter(classroom=classroom, session__is_current=True).count(),
                "school": classroom.school,
                "grade": grade,
                "remark_suggestion": remark_suggestion,
            },
        )
        if created and not report.teacher_remark:
            report.teacher_remark = remark_suggestion
            report.save(update_fields=["teacher_remark", "updated_at"])
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


def promote_students(
    source_classroom: ClassRoom,
    target_classroom: ClassRoom,
    target_session: AcademicSession,
    student_ids: list[str],
) -> dict:
    """Create Enrollment rows for target_classroom/target_session for each student.

    Skips a student who already has an Enrollment for target_session (idempotent
    - safe to call twice) or who lacks any Enrollment in source_classroom for
    any session. Never deletes or mutates existing Enrollment or ReportCard rows.

    Returns {"promoted": [...student_ids...], "skipped": [{"student_id", "reason"}, ...]}.
    """
    promoted = []
    skipped = []

    with transaction.atomic():
        for student_id in student_ids:
            existing = Enrollment.objects.filter(
                student_id=student_id,
                classroom=source_classroom,
            ).exists()
            if not existing:
                skipped.append(
                    {"student_id": student_id, "reason": "not enrolled in source classroom"}
                )
                continue

            already_enrolled = Enrollment.objects.filter(
                student_id=student_id,
                session=target_session,
            ).exists()
            if already_enrolled:
                skipped.append(
                    {"student_id": student_id, "reason": "already enrolled in target session"}
                )
                continue

            Enrollment.objects.create(
                student_id=student_id,
                classroom=target_classroom,
                session=target_session,
            )
            promoted.append(student_id)

    return {"promoted": promoted, "skipped": skipped}


_DEFAULT_GRADE_LEVELS = [
    ("JSS1", 1),
    ("JSS2", 2),
    ("JSS3", 3),
    ("SSS1", 4),
    ("SSS2", 5),
    ("SSS3", 6),
]


def seed_default_academic_setup(school) -> dict:
    """Create a default academic session, 3 terms, and 6 grade levels for a school.

    Idempotent — safe to call on a school that already has some data; only
    missing objects are created.  Returns a summary dict:
    {"session": AcademicSession, "terms": [Term, ...], "grade_levels": [GradeLevel, ...]}.
    """
    today = date.today()
    session_start = today.replace(month=9, day=1)
    session_end = today.replace(year=today.year + 1, month=8, day=31)
    session_name = f"{today.year}/{today.year + 1}"

    session, _ = AcademicSession.objects.get_or_create(
        name=session_name,
        school=school,
        defaults={
            "start_date": session_start,
            "end_date": session_end,
            "is_current": True,
        },
    )

    terms = []
    for name, order in _DEFAULT_TERMS:
        term, _ = Term.objects.get_or_create(
            name=name,
            session=session,
            defaults={"display_order": order},
        )
        terms.append(term)

    grade_levels = []
    for name, order in _DEFAULT_GRADE_LEVELS:
        gl, _ = GradeLevel.objects.get_or_create(
            name=name,
            school=school,
            defaults={"display_order": order},
        )
        grade_levels.append(gl)

    return {"session": session, "terms": terms, "grade_levels": grade_levels}
