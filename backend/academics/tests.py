"""Tests for the academics domain."""
from __future__ import annotations

from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher, User
from academics.models import AcademicSession, ClassRoom, Enrollment
from exams.models import GradeLevel, Term


class AcademicSessionModelTests(TestCase):
    def test_only_one_current_session(self):
        AcademicSession.objects.create(
            name="2024/2025", start_date="2024-09-01", end_date="2025-07-31", is_current=True
        )
        second = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        )
        second.refresh_from_db()
        self.assertTrue(second.is_current)
        self.assertEqual(AcademicSession.objects.filter(is_current=True).count(), 1)

    def test_string_representation(self):
        session = AcademicSession(name="2025/2026")
        self.assertEqual(str(session), "2025/2026")


class ClassRoomModelTests(TestCase):
    def test_string_representation(self):
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom(name="JSS1A", grade_level=grade)
        self.assertEqual(str(classroom), "JSS1A")


class EnrollmentModelTests(TestCase):
    def test_unique_together_student_session(self):
        user = User.objects.create_user(email="s@example.com", password="pwd", role="student")
        student = Student.objects.create(user=user, grade="JSS1")
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        session = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31"
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=session)
        with self.assertRaises(Exception):
            Enrollment.objects.create(student=student, classroom=classroom, session=session)


class BackfillMigrationTests(TestCase):
    def test_data_migration_backfills_everything(self):
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        user = User.objects.create_user(email="s@example.com", password="pwd", role="student")
        student = Student.objects.create(user=user, grade="JSS1")
        term = Term.objects.create(name="First Term", display_order=1)
        term.session = None
        term.save(update_fields=["session"])

        AcademicSession.objects.filter(name="2025/2026").delete()
        ClassRoom.objects.filter(name="JSS1").delete()
        Enrollment.objects.filter(student=student).delete()

        from academics.migrations.0002_backfill import backfill_academic_structure

        backfill_academic_structure(self.apps, None)

        self.assertTrue(AcademicSession.objects.filter(name="2025/2026", is_current=True).exists())

        term.refresh_from_db()
        self.assertEqual(term.session.name, "2025/2026")

        self.assertTrue(ClassRoom.objects.filter(name="JSS1", grade_level=grade).exists())

        self.assertTrue(
            Enrollment.objects.filter(student=student, session__name="2025/2026").exists()
        )


class AcademicsAPITests(APITestCase):
    def test_teacher_can_list_sessions(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/academics/sessions/")
        self.assertEqual(resp.status_code, 200)

    def test_student_can_list_sessions(self):
        _, user = self._create_student()
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/academics/sessions/")
        self.assertEqual(resp.status_code, 200)

    def test_student_cannot_create_session(self):
        _, user = self._create_student()
        self.client.force_authenticate(user=user)
        resp = self.client.post("/api/academics/sessions/", {"name": "2026/2027", "start_date": "2026-09-01", "end_date": "2027-07-31"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user

    def _create_student(self, email="student@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="S", last_name="Tudent", role="student"
        )
        student = Student.objects.create(user=user, grade="JSS1")
        return student, user
