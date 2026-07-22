from django.urls import include, path
from rest_framework import routers

from .views import SchoolViewSet

router = routers.DefaultRouter()
router.register(r"", SchoolViewSet, basename="school")

urlpatterns = [
    path("", include(router.urls)),
]
