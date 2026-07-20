"""Shared test fixtures and helpers."""
from __future__ import annotations

from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher
from core.throttling import AttemptRateThrottle

User = get_user_model()


class BaseAPITestCase(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._throttle_patcher = patch.object(AttemptRateThrottle, "allow_request", return_value=True)
        cls._throttle_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls._throttle_patcher.stop()
        super().tearDownClass()
    def create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        return Teacher.objects.create(user=user, department="Math"), user

    def create_student(self, email="student@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="S", last_name="Tudent", role="student"
        )
        return Student.objects.create(user=user, grade="Grade 10", student_id="STU-1"), user

    def auth(self, user):
        self.client.force_authenticate(user=user)
