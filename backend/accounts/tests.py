"""Tests for teacher-only JWT authentication flows."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from accounts.models import Teacher

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
