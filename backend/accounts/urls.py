"""URL routing for the accounts app."""
from __future__ import annotations

from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CurrentUserView,
    CustomTokenObtainPairView,
    StudentListView,
    TeacherListView,
)

app_name = "accounts"

urlpatterns = [
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("teachers/", TeacherListView.as_view(), name="teacher_list"),
    path("students/", StudentListView.as_view(), name="student_list"),
]
