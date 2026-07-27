"""Tests for the academics domain."""
from __future__ import annotations

import itertools

from uuid import uuid4

from django.test import TestCase
from rest_framework.test import APITestCase

from accounts.models import Student, Teacher, User
from academics.models import (
    AcademicSession,
    AssessmentComponent,
    AssessmentScore,
    BehaviouralRating,
    BehaviouralTrait,
    ClassRoom,
    Enrollment,
    GradeScale,
    ReportCard,
    SchoolProfile,
)
from academics.signals import result_post_save
from academics.services import generate_class_report_cards, generate_report_card, average_remark, subject_grade
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

        import importlib

        backfill_academic_structure = importlib.import_module("academics.migrations.0002_backfill").backfill_academic_structure

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

    def _create_student(self, email="student@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="S", last_name="Tudent", role="student"
        )
        student = Student.objects.create(user=user, grade="JSS1")
        return student, user


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


class ReportCardServiceTests(TestCase):
    def test_generate_report_card_computes_totals(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        user2 = User.objects.create_user(email="s@example.com", password="pwd", role="student")
        student = Student.objects.create(user=user2, grade="JSS1")
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        ))
        AssessmentScore.objects.create(component=component, student=student, score=80.0, entered_by=teacher)

        report = generate_report_card(student, classroom, term)
        self.assertEqual(report.total_score, 80.0)
        self.assertAlmostEqual(report.average_score, 80.0)

    def test_generate_class_report_cards_computes_positions_with_ties(self):
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        session = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        )
        students = []
        for i in range(4):
            u = User.objects.create_user(email=f"s{i}@example.com", password="pwd", role="student")
            s = Student.objects.create(user=u, grade="JSS1")
            Enrollment.objects.create(student=s, classroom=classroom, session=session)
            students.append(s)
        AssessmentScore.objects.create(component=component, student=students[0], score=90.0, entered_by=teacher)
        AssessmentScore.objects.create(component=component, student=students[1], score=80.0, entered_by=teacher)
        AssessmentScore.objects.create(component=component, student=students[2], score=80.0, entered_by=teacher)
        AssessmentScore.objects.create(component=component, student=students[3], score=70.0, entered_by=teacher)

        reports = generate_class_report_cards(classroom, term)
        positions = { r.student_id: r.position for r in reports }
        self.assertEqual(positions[students[0].id], 1)
        self.assertEqual(positions[students[1].id], 2)
        self.assertEqual(positions[students[2].id], 2)
        self.assertEqual(positions[students[3].id], 4)


class ReportCardFlowIntegrationTests(APITestCase):
    def test_generate_submit_approve_pdf_flow(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1"
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        ))
        AssessmentScore.objects.create(component=component, student=student, score=85.0, entered_by=teacher)

        generate_resp = self.client.post("/api/academics/report-cards/generate/", {
            "classroom_id": str(classroom.id),
            "term_id": str(term.id),
        }, format="json")
        self.assertEqual(generate_resp.status_code, 200)
        report_id = generate_resp.data[0]["id"]

        submit_resp = self.client.post(f"/api/academics/report-cards/{report_id}/submit/")
        self.assertEqual(submit_resp.status_code, 200)
        self.assertEqual(submit_resp.data["status"], "submitted")

        admin, admin_user = self._create_admin()
        self.client.force_authenticate(user=admin_user)
        approve_resp = self.client.post(f"/api/academics/report-cards/{report_id}/approve/")
        self.assertEqual(approve_resp.status_code, 200)
        self.assertEqual(approve_resp.data["status"], "approved")

        pdf_resp = self.client.get(f"/api/academics/report-cards/{report_id}/pdf/")
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp["Content-Type"], "application/pdf")

        self.client.force_authenticate(user=user)
        draft = ReportCard.objects.create(student=student, classroom=classroom, term=term, status="draft")
        pdf_draft_resp = self.client.get(f"/api/academics/report-cards/{draft.id}/pdf/")
        self.assertEqual(pdf_draft_resp.status_code, 403)

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user

    def _create_admin(self, email="admin@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="A", last_name="Dmin", role="admin"
        )
        return user, user

    def _create_student(self, email="student@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="S", last_name="Tudent", role="student"
        )
        student = Student.objects.create(user=user, grade="JSS1")
        return student, user


def _create_subject(name="Mathematics") -> "exams.Subject":
    from exams.models import Subject
    return Subject.objects.create(name=name, code=name[:4].upper())


class SchoolProfileModelTests(TestCase):
    def test_singleton_behavior(self):
        profile1 = SchoolProfile.load()
        profile2 = SchoolProfile.load()
        self.assertEqual(profile1.pk, profile2.pk)

    def test_default_values(self):
        profile = SchoolProfile.load()
        self.assertEqual(profile.name, "Dee Soar School")
        self.assertEqual(profile.primary_color, "#006c49")
        self.assertEqual(profile.secondary_color, "#3c4a42")


class SchoolProfileAPITests(APITestCase):
    def test_admin_can_get_school_profile(self):
        admin, admin_user = self._create_admin()
        self.client.force_authenticate(user=admin_user)
        resp = self.client.get("/api/academics/school-profile/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["name"], "Dee Soar School")

    def test_admin_can_update_school_profile(self):
        admin, admin_user = self._create_admin()
        self.client.force_authenticate(user=admin_user)
        resp = self.client.patch("/api/academics/school-profile/", {"name": "New Name", "motto": "Test Motto"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["name"], "New Name")
        self.assertEqual(resp.data["motto"], "Test Motto")

    def test_teacher_cannot_update_school_profile(self):
        _, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        resp = self.client.patch("/api/academics/school-profile/", {"name": "Hacked"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def _create_admin(self, email="admin@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="A", last_name="Dmin", role="admin"
        )
        return user, user


class GradeScaleModelTests(TestCase):
    def test_string_representation(self):
        scale = GradeScale(min_score=70, max_score=100, grade="A", remark="Excellent")
        self.assertEqual(str(scale), "A (70-100)")


class PDFBrandingTests(APITestCase):
    def test_pdf_includes_school_profile_branding(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1"
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        ))
        AssessmentScore.objects.create(component=component, student=student, score=85.0, entered_by=teacher)

        SchoolProfile.objects.filter(pk=1).delete()
        SchoolProfile.objects.create(
            pk=1,
            name="Branded Academy",
            primary_color="#ff0000",
            secondary_color="#00ff00",
        )

        generate_resp = self.client.post("/api/academics/report-cards/generate/", {
            "classroom_id": str(classroom.id),
            "term_id": str(term.id),
        }, format="json")
        self.assertEqual(generate_resp.status_code, 200)
        report_id = generate_resp.data[0]["id"]

        admin, admin_user = self._create_admin()
        self.client.force_authenticate(user=admin_user)
        approve_resp = self.client.post(f"/api/academics/report-cards/{report_id}/approve/")
        self.assertEqual(approve_resp.status_code, 200)

        pdf_resp = self.client.get(f"/api/academics/report-cards/{report_id}/pdf/")
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp["Content-Type"], "application/pdf")
        content = b"".join(pdf_resp.streaming_content if hasattr(pdf_resp, 'streaming_content') else [pdf_resp.content])
        self.assertIn(b"Branded Academy", content)

    def test_pdf_returns_403_for_non_approved(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        subject = _create_subject()
        grade = GradeLevel.objects.create(name="JSS1", display_order=1)
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade)
        term = Term.objects.create(name="First Term", display_order=1)
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1"
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True
        ))
        AssessmentScore.objects.create(component=component, student=student, score=85.0, entered_by=teacher)

        generate_resp = self.client.post("/api/academics/report-cards/generate/", {
            "classroom_id": str(classroom.id),
            "term_id": str(term.id),
        }, format="json")
        report_id = generate_resp.data[0]["id"]

        pdf_resp = self.client.get(f"/api/academics/report-cards/{report_id}/pdf/")
        self.assertEqual(pdf_resp.status_code, 403)


class SubjectGradeFunctionTests(TestCase):
    def test_subject_grade_a(self):
        self.assertEqual(subject_grade(75), ("A", "EXCELLENT"))

    def test_subject_grade_c(self):
        self.assertEqual(subject_grade(55), ("C", "CREDIT"))

    def test_subject_grade_p(self):
        self.assertEqual(subject_grade(45), ("P", "PASS"))

    def test_subject_grade_f(self):
        self.assertEqual(subject_grade(0), ("F", "FAIL"))

    def test_subject_grade_none(self):
        self.assertEqual(subject_grade(None), ("", ""))

    def test_average_remark_excellent(self):
        self.assertIn("excellent", average_remark(85).lower())

    def test_average_remark_below_average(self):
        self.assertIn("serious", average_remark(35).lower())


class ReportCardGradeAndRemarkTests(TestCase):
    def _setup_data(self):
        subject = _create_subject()
        grade, _ = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})
        school = _create_school()
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        GradeScale.objects.create(school=school, min_score=70, max_score=100, grade="A", remark="Excellent")
        GradeScale.objects.create(school=school, min_score=50, max_score=69.99, grade="C", remark="Credit")
        GradeScale.objects.create(school=school, min_score=40, max_score=49.99, grade="P", remark="Pass")
        GradeScale.objects.create(school=school, min_score=0, max_score=39.99, grade="F", remark="Fail")
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        AssessmentScore.objects.create(component=component, student=student, score=80.0, entered_by=teacher)
        return student, classroom, term

    def test_generate_report_card_sets_grade_from_grade_scale(self):
        student, classroom, term = self._setup_data()
        report = generate_report_card(student, classroom, term)
        self.assertEqual(report.grade, "A")

    def test_regenerate_preserves_teacher_remark_but_refreshes_remark_suggestion(self):
        student, classroom, term = self._setup_data()
        report = generate_report_card(student, classroom, term)
        self.assertEqual(report.teacher_remark, "An excellent performance. Keep it up.")

        report2 = generate_report_card(student, classroom, term)
        self.assertEqual(report2.teacher_remark, "An excellent performance. Keep it up.")
        self.assertEqual(report2.remark_suggestion, "An excellent performance. Keep it up.")

    def test_regenerate_overwrites_remark_suggestion_when_teacher_remark_exists(self):
        student, classroom, term = self._setup_data()
        report = generate_report_card(student, classroom, term)
        self.assertEqual(report.remark_suggestion, "An excellent performance. Keep it up.")

        report.teacher_remark = "Custom teacher remark."
        report.save(update_fields=["teacher_remark"])

        report2 = generate_report_card(student, classroom, term)
        self.assertEqual(report2.teacher_remark, "Custom teacher remark.")
        self.assertEqual(report2.remark_suggestion, "An excellent performance. Keep it up.")


def _create_school():
    from schools.models import School
    school, _ = School.objects.get_or_create(name="Test School", defaults={"slug": "test-school"})
    return school


class ReportCardFullActionTests(APITestCase):
    def test_full_returns_scores_and_behavioural_ratings_scoped_to_student(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        student2 = Student.objects.create(
            user=User.objects.create_user(email="s2@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        Enrollment.objects.create(student=student2, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        AssessmentScore.objects.create(component=component, student=student, score=80.0, entered_by=teacher)
        AssessmentScore.objects.create(component=component, student=student2, score=70.0, entered_by=teacher)
        BehaviouralRating.objects.create(
            trait=trait, student=student, classroom=classroom, term=term, rating=4,
            rated_by=teacher, school=school,
        )
        BehaviouralRating.objects.create(
            trait=trait, student=student2, classroom=classroom, term=term, rating=3,
            rated_by=teacher, school=school,
        )
        report = ReportCard.objects.create(
            student=student, classroom=classroom, term=term, status="approved",
        )

        resp = self.client.get(f"/api/academics/report-cards/{report.id}/full/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["scores"]), 1)
        self.assertEqual(resp.data["scores"][0]["student"], str(student.id))
        self.assertEqual(len(resp.data["behavioural_ratings"]), 1)
        self.assertEqual(resp.data["behavioural_ratings"][0]["student"], str(student.id))

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


class ReportCardPDFWithBehaviouralTests(APITestCase):
    def test_pdf_generation_succeeds_with_behavioural_ratings(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        component = AssessmentComponent.objects.create(
            subject=subject, classroom=classroom, term=term, name="Exam", component_type="exam", max_score=100
        )
        AssessmentScore.objects.create(component=component, student=student, score=85.0, entered_by=teacher)
        BehaviouralRating.objects.create(
            trait=trait, student=student, classroom=classroom, term=term, rating=4,
            rated_by=teacher, school=school,
        )
        report = ReportCard.objects.create(
            student=student, classroom=classroom, term=term, status="approved",
        )

        resp = self.client.get(f"/api/academics/report-cards/{report.id}/pdf/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp["Content-Type"], "application/pdf")

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


class ReportCardPatchReadonlyTests(APITestCase):
    def test_patch_cannot_change_status_or_average_score(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        report = ReportCard.objects.create(
            student=student, classroom=classroom, term=term, status="draft", average_score=80.0,
        )

        resp = self.client.patch(
            f"/api/academics/report-cards/{report.id}/",
            {"status": "approved", "average_score": 99.9, "teacher_remark": "Updated remark"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        report.refresh_from_db()
        self.assertEqual(report.status, "draft")
        self.assertEqual(report.average_score, 80.0)
        self.assertEqual(report.teacher_remark, "Updated remark")

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


class BehaviouralTraitModelTests(TestCase):
    def test_string_representation(self):
        trait = BehaviouralTrait(name="Punctuality", domain="affective")
        self.assertEqual(str(trait), "Punctuality (affective)")

    def test_rating_validation_rejects_out_of_range(self):
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        school = _create_school()
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        rating = BehaviouralRating(
            trait=trait,
            student=student,
            classroom=classroom,
            term=term,
            rating=6,
            rated_by=teacher,
            school=school,
        )
        with self.assertRaises(ValidationError) as ctx:
            rating.full_clean()
        self.assertIn("rating", ctx.exception.message_dict)

    def test_unique_together_prevents_duplicate_rating(self):
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        school = _create_school()
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        teacher = Teacher.objects.create(user=user, department="Math")
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        BehaviouralRating.objects.create(
            trait=trait,
            student=student,
            classroom=classroom,
            term=term,
            rating=3,
            rated_by=teacher,
            school=school,
        )
        with self.assertRaises(Exception):
            BehaviouralRating.objects.create(
                trait=trait,
                student=student,
                classroom=classroom,
                term=term,
                rating=4,
                rated_by=teacher,
                school=school,
            )


class BehaviouralRatingBulkTests(APITestCase):
    def test_bulk_creates_and_updates_ratings(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))

        payload = {
            "trait_id": str(trait.id),
            "term_id": str(term.id),
            "classroom_id": str(classroom.id),
            "ratings": [
                {"student_id": str(student.id), "rating": 4},
            ],
        }
        resp = self.client.post("/api/academics/behavioural-ratings/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["created"], 1)
        self.assertEqual(resp.data["updated"], 0)
        self.assertEqual(BehaviouralRating.objects.count(), 1)
        self.assertEqual(BehaviouralRating.objects.first().rating, 4)

    def test_bulk_updates_existing_rating(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))
        BehaviouralRating.objects.create(
            trait=trait,
            student=student,
            classroom=classroom,
            term=term,
            rating=2,
            rated_by=teacher,
            school=school,
        )

        payload = {
            "trait_id": str(trait.id),
            "term_id": str(term.id),
            "classroom_id": str(classroom.id),
            "ratings": [
                {"student_id": str(student.id), "rating": 5},
            ],
        }
        resp = self.client.post("/api/academics/behavioural-ratings/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["created"], 0)
        self.assertEqual(resp.data["updated"], 1)
        self.assertEqual(BehaviouralRating.objects.first().rating, 5)

    def test_bulk_rejects_invalid_rating(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        term = Term.objects.create(name="First Term", display_order=1)
        trait = BehaviouralTrait.objects.create(
            name="Punctuality", domain="affective", school=school
        )
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom, session=AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=school
        ))

        payload = {
            "trait_id": str(trait.id),
            "term_id": str(term.id),
            "classroom_id": str(classroom.id),
            "ratings": [
                {"student_id": str(student.id), "rating": 7},
            ],
        }
        resp = self.client.post("/api/academics/behavioural-ratings/bulk/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["errors"]), 1)

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


class SeededTraitsTests(TestCase):
    def test_seed_creates_11_affective_traits(self):
        count = BehaviouralTrait.objects.filter(domain="affective", school=None).count()
        self.assertEqual(count, 11)

    def test_seed_creates_5_psychomotor_traits(self):
        count = BehaviouralTrait.objects.filter(domain="psychomotor", school=None).count()
        self.assertEqual(count, 5)


class PromoteStudentsTests(TestCase):
    def setUp(self):
        self.subject = _create_subject()
        self.grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        self.school = _create_school()
        self.source_classroom = ClassRoom.objects.create(name="JSS1A", grade_level=self.grade, school=self.school)
        self.target_classroom = ClassRoom.objects.create(name="JSS2A", grade_level=self.grade, school=self.school)
        self.session_current = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True, school=self.school
        )
        self.session_target = AcademicSession.objects.create(
            name="2026/2027", start_date="2026-09-01", end_date="2027-07-31", school=self.school
        )
        self.term = Term.objects.create(name="First Term", display_order=1)
        self.user = User.objects.create_user(email="t@example.com", password="pwd", role="teacher")
        self.teacher = Teacher.objects.create(user=self.user, department="Math")
        self.student1 = Student.objects.create(
            user=User.objects.create_user(email="s1@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        self.student2 = Student.objects.create(
            user=User.objects.create_user(email="s2@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        self.student3 = Student.objects.create(
            user=User.objects.create_user(email="s3@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=self.student1, classroom=self.source_classroom, session=self.session_current)
        Enrollment.objects.create(student=self.student2, classroom=self.source_classroom, session=self.session_current)
        Enrollment.objects.create(student=self.student3, classroom=self.source_classroom, session=self.session_current)

    def test_promote_creates_enrollments(self):
        from academics.services import promote_students
        result = promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id), str(self.student2.id)],
        )
        self.assertEqual(result["promoted"], [str(self.student1.id), str(self.student2.id)])
        self.assertEqual(result["skipped"], [])
        self.assertEqual(Enrollment.objects.filter(classroom=self.target_classroom, session=self.session_target).count(), 2)

    def test_promote_skips_already_enrolled(self):
        from academics.services import promote_students
        Enrollment.objects.create(student=self.student1, classroom=self.target_classroom, session=self.session_target)
        result = promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id), str(self.student2.id)],
        )
        self.assertEqual(result["promoted"], [str(self.student2.id)])
        self.assertEqual(len(result["skipped"]), 1)
        self.assertEqual(result["skipped"][0]["student_id"], str(self.student1.id))
        self.assertEqual(result["skipped"][0]["reason"], "already enrolled in target session")

    def test_promote_skips_not_in_source(self):
        from academics.services import promote_students
        result = promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id), "nonexistent-id"],
        )
        self.assertEqual(result["promoted"], [str(self.student1.id)])
        self.assertEqual(len(result["skipped"]), 1)
        self.assertEqual(result["skipped"][0]["reason"], "not enrolled in source classroom")

    def test_promote_is_idempotent(self):
        from academics.services import promote_students
        promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id)],
        )
        before_count = Enrollment.objects.filter(classroom=self.target_classroom, session=self.session_target).count()
        promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id)],
        )
        after_count = Enrollment.objects.filter(classroom=self.target_classroom, session=self.session_target).count()
        self.assertEqual(before_count, after_count)

    def test_promote_does_not_touch_existing_enrollments(self):
        from academics.services import promote_students
        before_count = Enrollment.objects.count()
        promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id)],
        )
        after_count = Enrollment.objects.count()
        self.assertEqual(after_count, before_count + 1)

    def test_promote_does_not_touch_existing_report_cards(self):
        from academics.services import promote_students
        ReportCard.objects.create(
            student=self.student1, classroom=self.source_classroom, term=self.term, status="draft",
        )
        before_rc = ReportCard.objects.count()
        promote_students(
            self.source_classroom,
            self.target_classroom,
            self.session_target,
            [str(self.student1.id)],
        )
        after_rc = ReportCard.objects.count()
        self.assertEqual(after_rc, before_rc)


class PromoteActionTests(APITestCase):
    def test_promote_returns_403_for_teacher(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        resp = self.client.post(
            f"/api/academics/classrooms/{classroom.id}/promote/",
            {"target_classroom_id": "00000000-0000-0000-0000-000000000000", "target_session_id": "00000000-0000-0000-0000-000000000000", "student_ids": []},
            format="json",
        )
        self.assertIn(resp.status_code, (401, 403))

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user


class StudentHistoryTests(APITestCase):
    def test_student_history_groups_by_session(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        school = _create_school()
        subject = _create_subject()
        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        classroom1 = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=school)
        classroom2 = ClassRoom.objects.create(name="JSS2A", grade_level=grade, school=school)
        session1 = AcademicSession.objects.create(
            name="2024/2025", start_date="2024-09-01", end_date="2025-07-31", is_current=True, school=school
        )
        session2 = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", school=school
        )
        term1 = Term.objects.create(name="First Term", display_order=1)
        term2 = Term.objects.create(name="First Term", display_order=1)
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        Enrollment.objects.create(student=student, classroom=classroom1, session=session1)
        Enrollment.objects.create(student=student, classroom=classroom2, session=session2)
        ReportCard.objects.create(student=student, classroom=classroom1, term=term1, status="approved")
        ReportCard.objects.create(student=student, classroom=classroom2, term=term2, status="approved")

        resp = self.client.get(f"/api/academics/report-cards/student-history/?student_id={student.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        sessions = [g["session"] for g in resp.data]
        self.assertIn("2024/2025", sessions)
        self.assertIn("2025/2026", sessions)

    def test_student_history_returns_empty_list_for_no_reports(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        student = Student.objects.create(
            user=User.objects.create_user(email="s@example.com", password="pwd", role="student"),
            grade="JSS1",
        )
        resp = self.client.get(f"/api/academics/report-cards/student-history/?student_id={student.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, [])

    def test_student_history_returns_400_without_student_id(self):
        teacher, user = self._create_teacher()
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/academics/report-cards/student-history/")
        self.assertEqual(resp.status_code, 400)

    def _create_teacher(self, email="teacher@example.com", password="password123"):
        user = User.objects.create_user(
            email=email, password=password, first_name="T", last_name="Eacher", role="teacher"
        )
        teacher = Teacher.objects.create(user=user, department="Math")
        return teacher, user

