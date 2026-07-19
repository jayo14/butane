"""URL routing for the exams app."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttemptViewSet, ExamViewSet, ResultViewSet
from .question_views import QuestionViewSet
from .public_views import (
    PublicExamDetailView,
    StartAttemptView,
    ResumeAttemptView,
    SaveAttemptView,
    SubmitAttemptView,
)

app_name = "exams"

router = DefaultRouter()
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
    path("attempts/<uuid:attempt_id>/", ResumeAttemptView.as_view(), name="public-resume"),
    path("attempts/<uuid:attempt_id>/save/", SaveAttemptView.as_view(), name="public-save"),
    path("attempts/<uuid:attempt_id>/submit/", SubmitAttemptView.as_view(), name="public-submit"),
]

urlpatterns = [
    path("public/", include((public_urlpatterns, "public"))),
    path("", include(router.urls)),
    path("exams/<uuid:exam_id>/", include(question_router.urls)),
]
