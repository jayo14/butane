"""django-filter FilterSets for the exams app."""
from __future__ import annotations

import django_filters

from .models import Attempt, Exam, Question, Result


class ExamFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    course = django_filters.CharFilter(field_name="course", lookup_expr="icontains")
    course_code = django_filters.CharFilter(field_name="course_code", lookup_expr="iexact")
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    created_by = django_filters.UUIDFilter(field_name="created_by__user__id")
    created_after = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Exam
        fields = ["status", "course_code"]


class AttemptFilter(django_filters.FilterSet):
    exam = django_filters.UUIDFilter(field_name="exam__id")
    student = django_filters.UUIDFilter(field_name="student__user__id")
    student_profile = django_filters.UUIDFilter(field_name="student__id")
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    submitted_after = django_filters.IsoDateTimeFilter(field_name="submitted_at", lookup_expr="gte")

    class Meta:
        model = Attempt
        fields = ["exam", "status"]


class ResultFilter(django_filters.FilterSet):
    exam = django_filters.UUIDFilter(field_name="exam__id")
    student = django_filters.UUIDFilter(field_name="student__user__id")
    student_profile = django_filters.UUIDFilter(field_name="student__id")
    grade = django_filters.CharFilter(field_name="student__grade", lookup_expr="iexact")
    passed = django_filters.BooleanFilter(field_name="passed")
    min_percentage = django_filters.NumberFilter(field_name="percentage", lookup_expr="gte")
    max_percentage = django_filters.NumberFilter(field_name="percentage", lookup_expr="lte")
    graded_after = django_filters.IsoDateTimeFilter(field_name="graded_at", lookup_expr="gte")
    graded_before = django_filters.IsoDateTimeFilter(field_name="graded_at", lookup_expr="lte")

    class Meta:
        model = Result
        fields = ["exam", "passed"]
