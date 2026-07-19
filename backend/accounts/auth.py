"""Teacher-only JWT authentication.

Students are intentionally excluded from authentication: only ``teacher`` and
``admin`` roles may obtain tokens. Password verification uses Django's
PBKDF2 password hashing (via ``User.check_password``), and logout blacklists the
refresh token so it cannot be reused.
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from .models import Teacher
from .serializers import TeacherSerializer, UserSerializer
from core.throttling import LoginRateThrottle

AUTHENTICATABLE_ROLES = {"teacher", "admin"}


class TeacherTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Issue JWTs only for teacher/admin accounts.

    Students (and inactive users) are rejected with a generic error to avoid
    disclosing which emails exist in the system.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        if not user.is_active:
            raise AuthenticationFailed("No active account found with the given credentials.")
        if user.role not in AUTHENTICATABLE_ROLES:
            raise AuthenticationFailed("No active account found with the given credentials.")

        data["user"] = UserSerializer(user).data
        return data


@extend_schema(
    request=inline_serializer(
        "LoginRequest",
        fields={"email": serializers.EmailField(), "password": serializers.CharField()},
    ),
    responses=TeacherTokenObtainPairSerializer,
)
class LoginView(APIView):
    """Exchange email + password for access/refresh JWTs (teachers only)."""

    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = TeacherTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@extend_schema(
    request=inline_serializer("RefreshRequest", fields={"refresh": serializers.CharField()}),
    responses={"200": TeacherTokenObtainPairSerializer},
)
class LogoutView(APIView):
    """Blacklist the submitted refresh token to invalidate the session."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid or already revoked token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@extend_schema(responses=UserSerializer)
class CurrentUserView(APIView):
    """Return the authenticated user's account."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


@extend_schema(responses=TeacherSerializer)
class ProfileView(APIView):
    """Return the authenticated teacher's full profile (account + teacher data)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in AUTHENTICATABLE_ROLES:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        teacher = Teacher.objects.filter(user=user, is_deleted=False).first()
        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TeacherSerializer(teacher).data)
