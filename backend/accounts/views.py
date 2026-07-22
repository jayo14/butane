"""Views for accounts: teacher authentication and profile listings."""
from __future__ import annotations

from core.views import SchoolScopedViewSetMixin
from rest_framework import generics, permissions
from drf_spectacular.utils import extend_schema

from .auth import ChangePasswordView, CurrentUserView, LoginView, LogoutView, ProfileView
from .models import Student, Teacher
from .permissions import IsTeacher
from .serializers import StudentSerializer, TeacherSerializer


@extend_schema(
    responses=TeacherSerializer(many=True),
    tags=["Accounts"],
)
class TeacherListView(SchoolScopedViewSetMixin, generics.ListAPIView):
    queryset = Teacher.objects.filter(is_deleted=False)
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


@extend_schema(
    responses=StudentSerializer(many=True),
    tags=["Accounts"],
)
class StudentListView(SchoolScopedViewSetMixin, generics.ListAPIView):
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
