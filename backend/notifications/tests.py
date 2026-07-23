"""Tests for notification tasks run in eager mode (no broker needed)."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

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
