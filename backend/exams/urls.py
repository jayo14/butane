"""URL routing for the exams app."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttemptViewSet, ExamViewSet, ResultViewSet, SubjectViewSet
from .question_views import QuestionViewSet
from .public_views import (
    CodeLookupView,
    PublicExamDetailView,
    StartAttemptView,
    ResumeAttemptView,
    SaveAttemptView,
    SubmitAttemptView,
)
from .reports import ExamStatisticsView, QuestionStatisticsView, StudentHistoryView

app_name = "exams"

router = DefaultRouter()
router.register(r"subjects", SubjectViewSet, basename="subject")
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"attempts", AttemptViewSet, basename="attempt")
router.register(r"results", ResultViewSet, basename="result")

# Questions are nested under a specific exam:
#   /api/exams/<exam_id>/questions/...
question_router = DefaultRouter()
question_router.register(r"questions", QuestionViewSet, basename="exam-question")

# Public, unauthenticated student flow (token-guarded).
public_urlpatterns = [
    path("exams/<str:token>/", PublicExamDetailView.as_view(), name="public-exam-detail"),
    path("exams/<str:token>/start/", StartAttemptView.as_view(), name="public-start"),
    path("code/<str:short_code>/", CodeLookupView.as_view(), name="public-code-lookup"),
    path("attempts/<uuid:attempt_id>/", ResumeAttemptView.as_view(), name="public-resume"),
    path("attempts/<uuid:attempt_id>/save/", SaveAttemptView.as_view(), name="public-save"),
    path("attempts/<uuid:attempt_id>/submit/", SubmitAttemptView.as_view(), name="public-submit"),
]

# Reporting (teacher-only analytics) under /api/reports/.
report_urlpatterns = [
    path("exams/<uuid:exam_id>/", ExamStatisticsView.as_view(), name="exam-statistics"),
    path("exams/<uuid:exam_id>/questions/", QuestionStatisticsView.as_view(), name="question-statistics"),
    path("students/<uuid:student_id>/", StudentHistoryView.as_view(), name="student-history"),
]

urlpatterns = [
    path("public/", include((public_urlpatterns, "public"))),
    path("reports/", include((report_urlpatterns, "reports"))),
    path("", include(router.urls)),
    path("exams/<uuid:exam_id>/", include(question_router.urls)),
]
