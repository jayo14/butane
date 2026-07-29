from django.urls import include, path
from rest_framework import routers

from .views import (
    AcademicSessionViewSet,
    AssessmentComponentViewSet,
    AssessmentScoreViewSet,
    BehaviouralRatingViewSet,
    BehaviouralTraitViewSet,
    ClassRoomViewSet,
    EnrollmentViewSet,
    GradeScaleViewSet,
    ReportCardViewSet,
    SchoolProfileViewSet,
    TeachingAssignmentViewSet,
)

router = routers.DefaultRouter()
router.register(r"sessions", AcademicSessionViewSet, basename="session")
router.register(r"classrooms", ClassRoomViewSet, basename="classroom")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"components", AssessmentComponentViewSet, basename="component")
router.register(r"scores", AssessmentScoreViewSet, basename="score")
router.register(r"grade-scales", GradeScaleViewSet, basename="grade-scale")
router.register(r"report-cards", ReportCardViewSet, basename="report-card")
router.register(r"behavioural-traits", BehaviouralTraitViewSet, basename="behavioural-trait")
router.register(r"behavioural-ratings", BehaviouralRatingViewSet, basename="behavioural-rating")
router.register(r"teaching-assignments", TeachingAssignmentViewSet, basename="teaching-assignment")

urlpatterns = [
    path("", include(router.urls)),
    path("school-profile/", SchoolProfileViewSet.as_view({"get": "list", "patch": "partial_update"})),
]
