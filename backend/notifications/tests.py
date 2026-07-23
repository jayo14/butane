"""Tests for notification tasks and views run in eager mode (no broker needed)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Teacher
from notifications.models import Notification
from notifications.tasks import create_notification
from schools.models import School

User = get_user_model()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class NotificationTaskTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="Test School", slug="test-school")
        self.user = User.objects.create_user(
            email="admin@example.com",
            password="password123",
            role="admin",
        )

    def test_create_notification_task(self):
        create_notification(
            recipient_id=str(self.user.id),
            message="Test notification",
            school_id=str(self.school.id),
            link="/dashboard",
        )
        self.assertEqual(Notification.objects.count(), 1)
        notification = Notification.objects.first()
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.message, "Test notification")
        self.assertFalse(notification.is_read)

    def test_notification_marked_read(self):
        notification = Notification.objects.create(
            recipient=self.user,
            message="Unread notification",
            school=self.school,
        )
        self.assertFalse(notification.is_read)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class NotificationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.school = School.objects.create(name="Test School", slug="test-school")

        user = User.objects.create_user(
            email="teacher@example.com",
            password="password123",
            role="teacher",
        )
        Teacher.objects.create(user=user, school=self.school, department="Math")
        self.user = User.objects.get(pk=user.pk)

        # Log in via session so CurrentSchoolMiddleware can resolve school
        self.client.login(email="teacher@example.com", password="password123")

        self.notification = Notification.objects.create(
            recipient=self.user,
            message="Test notification",
            school=self.school,
            link="/dashboard",
        )

    def test_list_notifications(self):
        resp = self.client.get("/api/notifications/notifications/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["count"], 1)

    def test_mark_read(self):
        resp = self.client.post(f"/api/notifications/notifications/{self.notification.id}/mark-read/")
        self.assertEqual(resp.status_code, 200)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user,
            message="Unread notification",
            school=self.school,
        )
        resp = self.client.post("/api/notifications/notifications/mark-all-read/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Notification.objects.filter(is_read=False).count(), 0)
