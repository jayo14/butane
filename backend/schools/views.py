"""ViewSets for the schools domain."""
from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import Invitation
from accounts.permissions import IsAdmin
from django.conf import settings

from core.email import EmailService

from .models import School
from .serializers import SchoolSerializer


User = get_user_model()


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    @transaction.atomic
    @action(detail=False, methods=["post"], url_path="register", permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Register a new school (pending verification) + admin account."""
        name = request.data.get("name")
        slug = request.data.get("slug")
        admin_email = request.data.get("admin_email")
        admin_password = request.data.get("admin_password")
        admin_first_name = request.data.get("admin_first_name", "")
        admin_last_name = request.data.get("admin_last_name", "")

        if not all([name, slug, admin_email, admin_password]):
            return Response(
                {"detail": "name, slug, admin_email, and admin_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if School.objects.filter(slug=slug).exists():
            return Response(
                {"detail": "A school with this slug already exists."},
                status=status.HTTP_409_CONFLICT,
            )

        school = School.objects.create(name=name, slug=slug, status="pending_verification")
        user = User.objects.create_user(
            email=admin_email,
            password=admin_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            role="admin",
            is_active=False,
        )

        token, token_hash = Invitation.generate_token()
        Invitation.objects.create(
            school=school,
            email=admin_email,
            role="admin",
            token_hash=token_hash,
            expires_at=__import__("django.utils").timezone.now() + timedelta(days=7),
            invited_by=user,
        )

        site_url = getattr(settings, "SITE_URL", "http://localhost:3000").rstrip("/")
        verification_url = (
            f"{site_url}/verify-email"
            f"?school={school.slug}&token={token}"
        )
        EmailService.send(
            subject="Verify your email to activate your school",
            body=f"Click the link to verify your email and activate {name}: {verification_url}",
            to=[admin_email],
            html_message=f"<p>Click <a href='{verification_url}'>here</a> to verify your email and activate {name}.</p>",
        )

        return Response(
            {"id": str(school.id), "name": school.name, "status": school.status},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="verify-email", permission_classes=[permissions.AllowAny])
    def verify_email(self, request):
        """Verify email and activate the school + admin account."""
        slug = request.data.get("school") or request.query_params.get("school")
        token = request.data.get("token") or request.query_params.get("token")

        if not slug or not token:
            return Response({"detail": "school and token are required."}, status=status.HTTP_400_BAD_REQUEST)

        school = School.objects.filter(slug=slug, status="pending_verification").first()
        if not school:
            return Response({"detail": "School not found or already verified."}, status=status.HTTP_404_NOT_FOUND)

        token_hash = Invitation.generate_token(token)[1]
        invitation = Invitation.objects.filter(school=school, token_hash=token_hash, status="pending").first()
        if not invitation:
            return Response({"detail": "Invalid or expired invitation token."}, status=status.HTTP_404_NOT_FOUND)

        if invitation.expires_at < __import__("django.utils").timezone.now():
            invitation.status = "expired"
            invitation.save(update_fields=["status"])
            return Response({"detail": "Invitation token has expired."}, status=status.HTTP_410_GONE)

        school.status = "active"
        school.save(update_fields=["status"])

        user = User.objects.filter(email=invitation.email).first()
        if user:
            user.is_active = True
            user.save(update_fields=["is_active"])

        invitation.status = "accepted"
        invitation.save(update_fields=["status"])

        return Response({"detail": "School and admin account activated successfully."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="lookup", permission_classes=[permissions.AllowAny])
    def lookup(self, request):
        """Search active schools by name (autocomplete)."""
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([], status=status.HTTP_200_OK)
        schools = School.objects.filter(status="active", name__icontains=q).order_by("name")[:8]
        return Response(
            [{"id": str(s.id), "name": s.name, "slug": s.slug} for s in schools],
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get", "post"], url_path="onboarding-status", permission_classes=[permissions.IsAuthenticated])
    def onboarding_status(self, request):
        """Check or mark onboarding as complete."""
        school = getattr(request, "school", None)
        if not school:
            return Response({"onboarding_completed": False}, status=status.HTTP_200_OK)
        if request.method == "POST":
            school.onboarding_completed = True
            school.save(update_fields=["onboarding_completed"])
            return Response({"onboarding_completed": True}, status=status.HTTP_200_OK)
        return Response({"onboarding_completed": school.onboarding_completed}, status=status.HTTP_200_OK)
