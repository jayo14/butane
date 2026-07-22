"""Services for the academics domain."""
from __future__ import annotations

from django.db import transaction

from exams.models import Result
from .models import AssessmentComponent, AssessmentScore


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
