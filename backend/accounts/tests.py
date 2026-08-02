"""Tests for teacher-only JWT authentication flows."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from accounts.models import Role, SchoolMembership, Teacher

User = get_user_model()


class AuthFlowTests(TestCase):
    def setUp(self):
        self.teacher_user = User.objects.create_user(
            email="teacher@example.com",
            password="password123",
            first_name="T",
            last_name="Eacher",
            role="teacher",
        )
        Teacher.objects.create(user=self.teacher_user, department="Math")
        self.student_user = User.objects.create_user(
            email="student@example.com",
            password="password123",
            first_name="S",
            last_name="Tudent",
            role="student",
        )

    def test_teacher_can_login_and_get_tokens(self):
        resp = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "teacher@example.com", "password": "password123"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.json())
        self.assertIn("refresh", resp.json())

    def test_student_cannot_login(self):
        resp = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "student@example.com", "password": "password123"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, (401, 403))

    def test_invalid_credentials_rejected(self):
        resp = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "teacher@example.com", "password": "wrong"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, (401, 403))

    def test_current_user_requires_token(self):
        resp = self.client.get("/api/accounts/me/")
        self.assertEqual(resp.status_code, 401)

    def test_current_user_returns_teacher(self):
        login = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "teacher@example.com", "password": "password123"},
            content_type="application/json",
        )
        token = login.json()["access"]
        resp = self.client.get("/api/accounts/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["email"], "teacher@example.com")

    def test_profile_returns_teacher_data(self):
        login = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "teacher@example.com", "password": "password123"},
            content_type="application/json",
        )
        token = login.json()["access"]
        resp = self.client.get("/api/accounts/profile/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["department"], "Math")

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "teacher@example.com", "password": "password123"},
            content_type="application/json",
        )
        data = login.json()
        logout = self.client.post(
            "/api/accounts/auth/logout/",
            {"refresh": data["refresh"]},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {data['access']}",
        )
        self.assertEqual(logout.status_code, 200)
        # Refreshing the blacklisted token must fail.
        refresh = self.client.post(
            "/api/accounts/auth/refresh/",
            {"refresh": data["refresh"]},
            content_type="application/json",
        )
        self.assertEqual(refresh.status_code, 401)


class RoleMigrationTests(TestCase):
    """Assert default roles exist after the data migration runs."""

    def test_default_roles_seeded(self):
        expected_slugs = [
            "proprietor",
            "principal",
            "vice-principal",
            "exam-officer",
            "teacher",
            "admin-staff",
        ]
        roles = Role.objects.filter(slug__in=expected_slugs)
        self.assertEqual(roles.count(), len(expected_slugs))

    def test_propriator_has_all_capabilities(self):
        proprietor = Role.objects.get(slug="proprietor")
        self.assertTrue(proprietor.can_manage_school)
        self.assertTrue(proprietor.can_manage_users)
        self.assertTrue(proprietor.can_manage_teachers)
        self.assertTrue(proprietor.can_manage_students)
        self.assertTrue(proprietor.can_manage_academics)
        self.assertTrue(proprietor.can_manage_exams)
        self.assertTrue(proprietor.can_enter_scores)
        self.assertTrue(proprietor.can_view_reports)
        self.assertTrue(proprietor.can_manage_fees)

    def test_teacher_limited_capabilities(self):
        teacher = Role.objects.get(slug="teacher")
        self.assertFalse(teacher.can_manage_school)
        self.assertFalse(teacher.can_manage_users)
        self.assertTrue(teacher.can_enter_scores)
        self.assertTrue(teacher.can_view_reports)
        self.assertFalse(teacher.can_manage_fees)


class SchoolMembershipTests(TestCase):
    def setUp(self):
        from schools.models import School

        self.school = School.objects.create(name="Test School", slug="test-school")
        self.user = User.objects.create_user(
            email="member@example.com", password="password123"
        )
        self.teacher_role = Role.objects.get(slug="teacher")
        self.principal_role = Role.objects.get(slug="principal")

    def test_membership_creation(self):
        membership = SchoolMembership.objects.create(
            user=self.user, school=self.school, role=self.teacher_role, is_primary=True
        )
        self.assertTrue(membership.is_primary)
        self.assertEqual(str(membership), f"{self.user} → {self.school} [{self.teacher_role}] (primary)")

    def test_primary_role_for_school_returns_role(self):
        SchoolMembership.objects.create(
            user=self.user, school=self.school, role=self.principal_role, is_primary=True
        )
        role = self.user.primary_role_for_school(self.school)
        self.assertEqual(role, self.principal_role)

    def test_primary_role_for_school_returns_none_when_no_membership(self):
        role = self.user.primary_role_for_school(self.school)
        self.assertIsNone(role)

    def test_unique_constraint_prevents_duplicate_membership(self):
        SchoolMembership.objects.create(
            user=self.user, school=self.school, role=self.teacher_role
        )
        with self.assertRaises(Exception):
            SchoolMembership.objects.create(
                user=self.user, school=self.school, role=self.teacher_role
            )
