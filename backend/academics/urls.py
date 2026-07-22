from django.urls import include, path
from rest_framework import routers

from .views import AcademicSessionViewSet, ClassRoomViewSet, EnrollmentViewSet

router = routers.DefaultRouter()
router.register(r"sessions", AcademicSessionViewSet, basename="session")
router.register(r"classrooms", ClassRoomViewSet, basename="classroom")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
]
