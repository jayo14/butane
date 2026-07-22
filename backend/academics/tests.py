"""Tests for the academics domain."""
from __future__ import annotations

from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher, User
from academics.models import AcademicSession, AssessmentComponent, AssessmentScore, ClassRoom, Enrollment
from academics.signals import result_post_save
from exams.models import Exam, GradeLevel, Question, Choice, Term, Attempt


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


class AssessmentComponentModelTests(TestCase):
    def test_unique_together(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)

        AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="CA1"
        )
        with self.assertRaises(Exception):
            AssessmentComponent.objects.create(
                subject=subject, classroom=classroom, term=term, name="CA1"
            )

    def test_clean_warns_when_total_exceeds_100(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)

        AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="CA1", max_score=60
        )
        bad = AssessmentComponent(
            subject=subject, classroom=classroom, term=term, name="CA2", max_score=60
        )
        with self.assertRaises(Exception) as ctx:
            bad.clean()
        self.assertIn("max_score", str(ctx.exception))


class AssessmentScoreModelTests(TestCase):
    def test_unique_together_component_student(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam"
        )
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        student = Student.objects.create(user=User.objects.create_user(email="s@example.com", password="pwd", role="student"), grade="JSS1")
        AssessmentScore.objects.create(component=component, student=student, score=50, entered_by=teacher)
        with self.assertRaises(Exception):
            AssessmentScore.objects.create(component=component, student=student, score=60, entered_by=teacher)


class ExamResultSignalTests(TestCase):
    def test_graded_result_creates_assessment_score(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        exam = Exam.objects.create(
            title="Maths", created_by=teacher, subject=subject.name, class_group=classroom.name, term=term.name,
            status="ongoing", duration_minutes=60, total_marks=10, passing_marks=5,
        )
        q1 = Question.objects.create(exam=exam, order=1, text="2+2?", marks=5)
        Choice.objects.create(question=q1, label="A", text="4", is_correct=True)
        Choice.objects.create(question=q1, label="B", text="5", is_correct=False)
        q2 = Question.objects.create(exam=exam, order=2, text="3+3?", marks=5)
        Choice.objects.create(question=q2, label="A", text="5", is_correct=False)
        Choice.objects.create(question=q2, label="B", text="6", is_correct=True)

        student = Student.objects.create(user=User.objects.create_user(email="s@example.com", password="pwd", role="student"), grade="JSS1")
        result_post_save(
            None,
            instance=type(
                "Res",
                (),
                {
                    "exam": exam,
                    "student": student,
                    "student_id": student.id,
                    "percentage": 80.0,
                    "is_deleted": False,
                },
            )(),
            created=True,
        )

        self.assertTrue(
            AssessmentScore.objects.filter(component=component, student=student, score=80.0).exists()
        )

    def test_signal_skips_when_no_component_matches(self):
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        exam = Exam.objects.create(
            title="Lonely", created_by=teacher, subject="Ghost", class_group="Z1", term="Never",
            status="ongoing", duration_minutes=60, total_marks=1, passing_marks=1,
        )
        student = Student.objects.create(user=User.objects.create_user(email="s@example.com", password="pwd", role="student"), grade="Z1")
        result_post_save(
            None,
            instance=type(
                "Res",
                (),
                {
                    "exam": exam,
                    "student": student,
                    "student_id": student.id,
                    "percentage": 50.0,
                    "is_deleted": False,
                },
            )(),
            created=True,
        )
        self.assertFalse(AssessmentScore.objects.exists())


class AcademicsBulkScoreAPITests(APITestCase):
    def test_bulk_upsert_creates_scores(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="CA1"
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1"
        )
        payload = {
            "component_id": str(component.id),
            "scores": [{"student_id": str(student.id), "score": 42.0}],
        }
        resp = self.client.post("/api/academics/scores/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["created"], 1)
        self.assertEqual(resp.data["updated"], 0)
        self.assertTrue(AssessmentScore.objects.filter(component=component, student=student, score=42.0).exists())

    def test_bulk_upsert_updates_existing_scores(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="CA1"
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1"
        )
        AssessmentScore.objects.create(component=component, student=student, score=10.0, entered_by=teacher)
        payload = {
            "component_id": str(component.id),
            "scores": [{"student_id": str(student.id), "score": 99.0}],
        }
        resp = self.client.post("/api/academics/scores/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["updated"], 1)
        self.assertEqual(resp.data["created"], 0)
        self.assertTrue(AssessmentScore.objects.filter(component=component, student=student, score=99.0).exists())

    def test_bulk_rejects_partial_missing_fields(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="CA1"
        )
        payload = {
            "component_id": str(component.id),
            "scores": [{"student_id": "missing"}],
        }
        resp = self.client.post("/api/academics/scores/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["errors"][0]["index"], 0)

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


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


def _create_subject(name="Mathematics") -> "exams.Subject":
    from exams.models import Subject
    return Subject.objects.create(name=name, code=name[:4].upper())
