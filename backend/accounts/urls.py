"""URL routing for the accounts app."""
from __future__ import annotations

from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordView,
    CurrentUserView,
    LoginView,
    LogoutView,
    ProfileView,
    StudentListView,
    TeacherListView,
)

app_name = "accounts"

urlpatterns = [
    # Authentication (teacher/admin only)
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Authenticated user
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    # Directories
    path("teachers/", TeacherListView.as_view(), name="teacher_list"),
    path("students/", StudentListView.as_view(), name="student_list"),
]
