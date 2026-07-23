"""Views for accounts: teacher authentication and profile listings."""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.views import SchoolScopedViewSetMixin
from drf_spectacular.utils import extend_schema

from .auth import ChangePasswordView, CurrentUserView, LoginView, LogoutView, ProfileView
from .models import Invitation, Student, Teacher
from .permissions import IsAdmin, IsTeacher
from .serializers import InvitationSerializer, StudentSerializer, TeacherSerializer

User = get_user_model()


@extend_schema(
    responses=TeacherSerializer(many=True),
    tags=["Accounts"],
)
class TeacherListView(SchoolScopedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Teacher.objects.filter(is_deleted=False)
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


@extend_schema(
    responses=StudentSerializer(many=True),
    tags=["Accounts"],
)
class StudentListView(SchoolScopedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class InvitationViewSet(SchoolScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invitation.objects.select_related("school", "invited_by")
    serializer_class = InvitationSerializer

    def get_permissions(self):
        if self.action == "accept":
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        email = serializer.validated_data["email"]
        role = serializer.validated_data.get("role", "teacher")
        school = getattr(self.request, "school", None)
        if not school:
            return Response({"detail": "School not resolved for request."}, status=status.HTTP_400_BAD_REQUEST)

        raw_token, token_hash = Invitation.generate_token()
        invitation = serializer.save(
            school=school,
            token_hash=token_hash,
            invited_by=self.request.user,
            expires_at=timezone.now() + timedelta(days=7),
        )

        invite_url = (
            f"{getattr(self.request, 'scheme', 'https')}://"
            f"{self.request.get_host()}"
            f"/accept-invite/{raw_token}/"
        )
        from .tasks import send_invitation_email
        send_invitation_email.delay(email, school.name, invite_url)
        return invitation

    @action(detail=False, methods=["get", "post"], url_path="accept", permission_classes=[permissions.AllowAny])
    def accept(self, request):
        token = request.data.get("token") or request.query_params.get("token")
        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = Invitation.generate_token(token)[1]
        invitation = Invitation.objects.filter(token_hash=token_hash, status="pending").first()
        if not invitation:
            return Response({"detail": "Invalid or expired invitation."}, status=status.HTTP_404_NOT_FOUND)

        if invitation.expires_at < timezone.now():
            invitation.status = "expired"
            invitation.save(update_fields=["status"])
            return Response({"detail": "Invitation token has expired."}, status=status.HTTP_410_GONE)

        if request.method == "GET":
            return Response({"email": invitation.email, "role": invitation.role}, status=status.HTTP_200_OK)

        with transaction.atomic():
            user, _ = User.objects.get_or_create(
                email=invitation.email,
                defaults={
                    "role": invitation.role,
                    "first_name": request.data.get("first_name", ""),
                    "last_name": request.data.get("last_name", ""),
                    "is_active": True,
                },
            )
            if not user.has_usable_password():
                password = request.data.get("password")
                if password:
                    user.set_password(password)
                    user.save(update_fields=["password", "role", "first_name", "last_name", "is_active"])

            if invitation.role == "teacher":
                Teacher.objects.get_or_create(
                    user=user,
                    defaults={"school": invitation.school},
                )
            elif invitation.role == "admin":
                user.role = "admin"
                user.save(update_fields=["role"])

            invitation.status = "accepted"
            invitation.save(update_fields=["status"])

        from notifications.tasks import notify_invitation_accepted
        notify_invitation_accepted.delay(str(invitation.id))

        return Response(
            {"detail": "Invitation accepted. You can now log in."},
            status=status.HTTP_200_OK,
        )
