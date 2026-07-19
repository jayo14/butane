"""Shared test fixtures and helpers."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher

User = get_user_model()


class BaseAPITestCase(APITestCase):
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
