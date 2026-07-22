"""Signal wiring for the academics domain."""
from __future__ import annotations

import logging

from django.db import transaction
from django.db.models import Q

from exams.models import Result
from .models import AssessmentComponent, AssessmentScore
from .services import link_exam_result

logger = logging.getLogger(__name__)


def _find_exam_component(result: Result) -> AssessmentComponent | None:
    """Try to locate an AssessmentComponent of type 'exam' for a graded result."""
    exam = result.exam
    qs = AssessmentComponent.objects.filter(
        component_type="exam",
        subject__name__iexact=exam.subject,
        term__name__iexact=exam.term,
    ).select_related("subject", "classroom", "term")

    if exam.class_group:
        exact = qs.filter(classroom__name__iexact=exam.class_group).first()
        if exact:
            return exact
        by_grade = qs.filter(classroom__grade_level__name__iexact=exam.class_group).first()
        if by_grade:
            return by_grade

    if result.student_id:
        enrollment = result.student.enrollments.filter(session__is_current=True).select_related("classroom").first()
        if enrollment:
            return qs.filter(classroom=enrollment.classroom).first()

    return None


@transaction.atomic
def result_post_save(sender, instance: Result, created: bool, **kwargs):
    if instance.is_deleted:
        return
    component = _find_exam_component(instance)
    if component is None:
        logger.debug("No AssessmentComponent matched for Result %s", instance.pk)
        return
    link_exam_result(instance, component)


def register():
    from django.db.models.signals import post_save
    post_save.connect(result_post_save, sender=Result, weak=True, dispatch_uid="academics_link_exam_result")
