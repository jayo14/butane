"""Views for accounts: teacher authentication and profile listings."""
from __future__ import annotations

from rest_framework import generics, permissions

from .auth import CurrentUserView, LoginView, LogoutView, ProfileView
from .models import Student, Teacher
from .permissions import IsTeacher
from .serializers import StudentSerializer, TeacherSerializer

__all__ = [
    "LoginView",
    "LogoutView",
    "CurrentUserView",
    "ProfileView",
    "TeacherListView",
    "StudentListView",
]


class TeacherListView(generics.ListAPIView):
    queryset = Teacher.objects.filter(is_deleted=False)
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentListView(generics.ListAPIView):
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
