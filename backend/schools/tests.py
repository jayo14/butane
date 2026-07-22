"""Tests for the schools domain and school scoping."""
from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher, User
from academics.models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment, GradeScale, ReportCard, SchoolProfile
from exams.models import Exam, GradeLevel, Subject, Term
from schools.models import School


class SchoolModelTests(TestCase):
    def test_string_representation(self):
        school = School(name="Dee Soar School", slug="dee-soar-school")
        self.assertEqual(str(school), "Dee Soar School")

    def test_slug_unique(self):
        School.objects.create(name="School A", slug="school-a")
        with self.assertRaises(Exception):
            School.objects.create(name="School B", slug="school-a")


class SchoolScopingAPITests(APITestCase):
    def _create_school(self, name, slug):
        return School.objects.create(name=name, slug=slug)

    def _create_teacher_for_school(self, school, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math", school=school)
        return teacher, user

    def _create_student_for_school(self, school, email="student@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="S", last_name="Tudent", role="student"
        )
        student = Student.objects.create(user=user, grade="JSS1", school=school)
        return student, user

    def _create_admin(self, email="admin@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="A", last_name="Dmin", role="admin"
        )
        return user, user

    def test_school_a_teacher_cannot_access_school_b_subject(self):
        school_a = self._create_school("School A", "school-a")
        school_b = self._create_school("School B", "school-b")
        _, user_a = self._create_teacher_for_school(school_a, email="tea@a.com")
        _, user_b = self._create_teacher_for_school(school_b, email="tea@b.com")

        subject_b = Subject.objects.create(name="Math B", code="MB", school=school_b)

        self.client.force_authenticate(user=user_a)
        resp = self.client.get(f"/api/subjects/{subject_b.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_school_a_teacher_cannot_list_school_b_exams(self):
        school_a = self._create_school("School A", "school-a")
        school_b = self._create_school("School B", "school-b")
        _, user_a = self._create_teacher_for_school(school_a, email="tea@a.com")
        _, user_b = self._create_teacher_for_school(school_b, email="tea@b.com")

        grade_b = GradeLevel.objects.create(name="JSS1", display_order=1, school=school_b)
        subject_b = Subject.objects.create(name="Math B", code="MB", school=school_b)
        Exam.objects.create(title="Exam B", created_by=user_b.teacher_profile, subject=subject_b.name, class_group=grade_b.name, term="First Term", status="draft", duration_minutes=60, total_marks=10, passing_marks=5, school=school_b)

        self.client.force_authenticate(user=user_a)
        resp = self.client.get("/api/exams/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data.get("results", resp.data if isinstance(resp.data, list) else [])), 0)

    def test_school_isolation_for_students(self):
        school_a = self._create_school("School A", "school-a")
        school_b = self._create_school("School B", "school-b")
        _, user_a = self._create_student_for_school(school_a, email="stu@a.com")
        _, user_b = self._create_student_for_school(school_b, email="stu@b.com")

        self.client.force_authenticate(user=user_a)
        resp = self.client.get("/api/students/")
        self.assertEqual(resp.status_code, 200)
        data = resp.data.get("results", resp.data if isinstance(resp.data, list) else [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], str(user_a.student_profile.id))

    def test_admin_can_access_all_schools(self):
        school_a = self._create_school("School A", "school-a")
        school_b = self._create_school("School B", "school-b")
        admin_user, _ = self._create_admin()
        self._create_teacher_for_school(school_a, email="tea@a.com")
        self._create_teacher_for_school(school_b, email="tea@b.com")

        self.client.force_authenticate(user=admin_user)
        resp = self.client.get("/api/teachers/")
        self.assertEqual(resp.status_code, 200)
        data = resp.data.get("results", resp.data if isinstance(resp.data, list) else [])
        self.assertEqual(len(data), 2)
