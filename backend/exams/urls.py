"""URL routing for the exams app."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttemptViewSet, ExamViewSet, ResultViewSet

app_name = "exams"

router = DefaultRouter()
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"attempts", AttemptViewSet, basename="attempt")
router.register(r"results", ResultViewSet, basename="result")

urlpatterns = [
    path("", include(router.urls)),
]
