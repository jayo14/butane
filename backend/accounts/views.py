"""Views for accounts: profile, JWT auth, and teacher/student listings."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Student, Teacher
from .permissions import IsTeacher
from .serializers import StudentSerializer, TeacherSerializer, UserSerializer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT login. Accepts ``email`` + ``password`` (matches frontend login form)."""

    def post(self, request, *args, **kwargs):
        # Map the frontend's `email` field; Simple JWT already expects USERNAME_FIELD.
        return super().post(request, *args, **kwargs)


class CurrentUserView(generics.RetrieveAPIView):
    """Return the authenticated user's profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class TeacherListView(generics.ListAPIView):
    queryset = Teacher.objects.filter(is_deleted=False)
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentListView(generics.ListAPIView):
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
