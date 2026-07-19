"""URL routing for the exams app."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttemptViewSet, ExamViewSet, ResultViewSet
from .question_views import QuestionViewSet

app_name = "exams"

router = DefaultRouter()
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"attempts", AttemptViewSet, basename="attempt")
router.register(r"results", ResultViewSet, basename="result")

# Questions are nested under a specific exam:
#   /api/exams/<exam_id>/questions/...
question_router = DefaultRouter()
question_router.register(r"questions", QuestionViewSet, basename="exam-question")

urlpatterns = [
    path("", include(router.urls)),
    path("exams/<uuid:exam_id>/", include(question_router.urls)),
]
