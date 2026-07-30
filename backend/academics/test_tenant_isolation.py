"""Tests verifying school-level tenant isolation — School A never sees School B data."""
from __future__ import annotations

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
    ReportCard,
    TeachingAssignment,
)
from exams.models import GradeLevel, Subject, Term
from schools.models import School


PW = "pwd"


def _make_school(name: str, slug: str) -> School:
    return School.objects.create(name=name, slug=slug)


def _make_teacher(school: School, email: str) -> tuple[Teacher, User]:
    user = User.objects.create_user(
        email=email, password=PW, first_name="T", last_name="Eacher", role="teacher"
    )
    teacher = Teacher.objects.create(user=user, department="Math", school=school)
    return teacher, user


def _make_admin(school: School, email: str) -> User:
    user = User.objects.create_user(
        email=email, password=PW, first_name="A", last_name="Dmin", role="admin"
    )
    return user


def _make_student() -> Student:
    user = User.objects.create_user(
        email=f"s-{uuid4().hex[:8]}@example.com", password=PW, role="student"
    )
    return Student.objects.create(user=user, grade="JSS1")


def _make_subject(name: str = "Math") -> Subject:
    return Subject.objects.create(name=name, code=name[:4].upper())


def _login(client, email: str) -> bool:
    return client.login(email=email, password=PW)


def _results(resp):
    """Extract paginated results from a list/retrieve response."""
    data = resp.data
    return data.get("results", data) if isinstance(data, dict) else data


class TenantIsolationCRUDTests(APITestCase):
    """Every scoped ViewSet must isolate data between two schools."""

    def setUp(self):
        self.school_a = _make_school("School A", "school-a")
        self.school_b = _make_school("School B", "school-b")

        self.teacher_a, self.user_a = _make_teacher(self.school_a, "t-a@example.com")
        self.teacher_b, self.user_b = _make_teacher(self.school_b, "t-b@example.com")

        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        self.classroom_a = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=self.school_a)
        self.classroom_b = ClassRoom.objects.create(name="JSS1B", grade_level=grade, school=self.school_b)

        session = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True,
            school=self.school_a,
        )
        session.__class__.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True,
            school=self.school_b,
        )

        self.term = Term.objects.create(name="First Term", display_order=1, session=session)
        self.subject = _make_subject()
        _login(self.client, "t-a@example.com")

    # ── AssessmentComponent ──────────────────────────────────────────────

    def test_assessment_component_list_is_scoped(self):
        AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_a, term=self.term,
            name="CA1", school=self.school_a,
        )
        AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="CA1", school=self.school_b,
        )
        resp = self.client.get("/api/academics/components/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    def test_assessment_component_detail_scoped(self):
        comp = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="CA1", school=self.school_b,
        )
        resp = self.client.get(f"/api/academics/components/{comp.id}/")
        self.assertEqual(resp.status_code, 404)

    # ── AssessmentScore ───────────────────────────────────────────────────

    def test_assessment_score_list_is_scoped(self):
        comp_a = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_a, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_a,
        )
        comp_b = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_b,
        )
        student = _make_student()
        AssessmentScore.objects.create(component=comp_a, student=student, score=80, entered_by=self.teacher_a)
        AssessmentScore.objects.create(component=comp_b, student=student, score=90, entered_by=self.teacher_b)
        resp = self.client.get("/api/academics/scores/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    def test_assessment_score_detail_scoped(self):
        comp_b = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_b,
        )
        student = _make_student()
        score = AssessmentScore.objects.create(component=comp_b, student=student, score=90, entered_by=self.teacher_b)
        resp = self.client.get(f"/api/academics/scores/{score.id}/")
        self.assertEqual(resp.status_code, 404)

    # ── BehaviouralRating ────────────────────────────────────────────────

    def test_behavioural_rating_list_is_scoped(self):
        trait_a = BehaviouralTrait.objects.create(name="Punctuality", domain="affective", school=self.school_a)
        trait_b = BehaviouralTrait.objects.create(name="Neatness", domain="affective", school=self.school_b)
        student = _make_student()
        BehaviouralRating.objects.create(
            trait=trait_a, student=student, classroom=self.classroom_a, term=self.term,
            rating=4, rated_by=self.teacher_a, school=self.school_a,
        )
        BehaviouralRating.objects.create(
            trait=trait_b, student=student, classroom=self.classroom_b, term=self.term,
            rating=3, rated_by=self.teacher_b, school=self.school_b,
        )
        resp = self.client.get("/api/academics/behavioural-ratings/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    # ── ReportCard ───────────────────────────────────────────────────────

    def test_report_card_list_is_scoped(self):
        student = _make_student()
        ReportCard.objects.create(student=student, classroom=self.classroom_a, term=self.term)
        ReportCard.objects.create(student=student, classroom=self.classroom_b, term=self.term)
        resp = self.client.get("/api/academics/report-cards/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    def test_report_card_detail_scoped(self):
        student = _make_student()
        report = ReportCard.objects.create(student=student, classroom=self.classroom_b, term=self.term)
        resp = self.client.get(f"/api/academics/report-cards/{report.id}/")
        self.assertEqual(resp.status_code, 404)

    # ── TeachingAssignment ───────────────────────────────────────────────

    def test_teaching_assignment_list_is_scoped(self):
        session_a = AcademicSession.objects.get(school=self.school_a)
        TeachingAssignment.objects.create(
            teacher=self.teacher_a, classroom=self.classroom_a,
            subject=self.subject, session=session_a, school=self.school_a,
        )
        session_b = AcademicSession.objects.get(school=self.school_b)
        TeachingAssignment.objects.create(
            teacher=self.teacher_b, classroom=self.classroom_b,
            subject=self.subject, session=session_b, school=self.school_b,
        )
        resp = self.client.get("/api/academics/teaching-assignments/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    # ── Enrollment ───────────────────────────────────────────────────────

    def test_enrollment_list_is_scoped(self):
        student_a = _make_student()
        student_b = _make_student()
        session_a = AcademicSession.objects.get(school=self.school_a)
        Enrollment.objects.create(student=student_a, classroom=self.classroom_a, session=session_a)
        Enrollment.objects.create(student=student_b, classroom=self.classroom_b, session=session_a)
        resp = self.client.get("/api/academics/enrollments/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)

    # ── ClassRoom ────────────────────────────────────────────────────────

    def test_classroom_list_is_scoped(self):
        resp = self.client.get("/api/academics/classrooms/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(_results(resp)), 1)  # only classroom_a belongs to school_a


class TenantIsolationBulkActionTests(APITestCase):
    """Custom @action (bulk, generate, broadsheet) must reject cross-school data."""

    def setUp(self):
        self.school_a = _make_school("School A", "school-a")
        self.school_b = _make_school("School B", "school-b")

        self.teacher_a, self.user_a = _make_teacher(self.school_a, "t-a@example.com")
        self.teacher_b, self.user_b = _make_teacher(self.school_b, "t-b@example.com")

        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        self.classroom_a = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=self.school_a)
        self.classroom_b = ClassRoom.objects.create(name="JSS1B", grade_level=grade, school=self.school_b)

        self.session_a = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True,
            school=self.school_a,
        )
        self.session_b = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True,
            school=self.school_b,
        )
        self.term = Term.objects.create(name="First Term", display_order=1, session=self.session_a)
        self.subject = _make_subject()
        self.student = _make_student()
        _login(self.client, "t-a@example.com")

    # ── AssessmentScore bulk ────────────────────────────────────────────

    def test_scores_bulk_rejects_component_from_other_school(self):
        comp_b = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_b,
        )
        resp = self.client.post("/api/academics/scores/bulk/", {
            "component_id": str(comp_b.id),
            "scores": [{"student_id": str(self.student.id), "score": 80.0}],
        }, format="json")
        self.assertEqual(resp.status_code, 404)
        self.assertIn("not found", resp.data["detail"].lower())

    # ── BehaviouralRating bulk ──────────────────────────────────────────

    def test_behavioural_bulk_rejects_classroom_from_other_school(self):
        trait = BehaviouralTrait.objects.create(name="Punctuality", domain="affective", school=self.school_a)
        resp = self.client.post("/api/academics/behavioural-ratings/bulk/", {
            "trait_id": str(trait.id),
            "term_id": str(self.term.id),
            "classroom_id": str(self.classroom_b.id),
            "ratings": [{"student_id": str(self.student.id), "rating": 4}],
        }, format="json")
        self.assertEqual(resp.status_code, 404)

    def test_behavioural_bulk_rejects_trait_from_other_school(self):
        trait_b = BehaviouralTrait.objects.create(name="Punctuality", domain="affective", school=self.school_b)
        resp = self.client.post("/api/academics/behavioural-ratings/bulk/", {
            "trait_id": str(trait_b.id),
            "term_id": str(self.term.id),
            "classroom_id": str(self.classroom_a.id),
            "ratings": [{"student_id": str(self.student.id), "rating": 4}],
        }, format="json")
        self.assertEqual(resp.status_code, 404)

    # ── ReportCard generate ─────────────────────────────────────────────

    def test_report_generate_rejects_classroom_from_other_school(self):
        resp = self.client.post("/api/academics/report-cards/generate/", {
            "classroom_id": str(self.classroom_b.id),
            "term_id": str(self.term.id),
        }, format="json")
        self.assertEqual(resp.status_code, 404)

    # ── Broadsheet ──────────────────────────────────────────────────────

    def test_broadsheet_is_scoped_by_school(self):
        comp_a = AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_a, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_a,
        )
        AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_b,
        )
        Enrollment.objects.create(student=self.student, classroom=self.classroom_a, session=self.session_a)
        ReportCard.objects.create(student=self.student, classroom=self.classroom_a, term=self.term)
        AssessmentScore.objects.create(component=comp_a, student=self.student, score=80, entered_by=self.teacher_a)

        resp = self.client.get(
            f"/api/academics/report-cards/broadsheet/?classroom_id={self.classroom_a.id}&term_id={self.term.id}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["subjects"]), 1)

    def test_broadsheet_other_school_classroom_returns_empty(self):
        AssessmentComponent.objects.create(
            subject=self.subject, classroom=self.classroom_b, term=self.term,
            name="Exam", component_type="exam", max_score=100, school=self.school_b,
        )
        resp = self.client.get(
            f"/api/academics/report-cards/broadsheet/?classroom_id={self.classroom_b.id}&term_id={self.term.id}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data["subjects"]), 0)


class TenantIsolationTeachingAssignmentSerializerTests(APITestCase):
    """TeachingAssignmentSerializer validate() must reject cross-school teacher+classroom."""

    def setUp(self):
        self.school_a = _make_school("School A", "school-a")
        self.school_b = _make_school("School B", "school-b")
        self.teacher_a, self.user_a = _make_teacher(self.school_a, "t-a@example.com")
        self.admin_user = _make_admin(self.school_a, "admin@example.com")

        grade = GradeLevel.objects.get_or_create(name="JSS1", defaults={"display_order": 1})[0]
        self.classroom_a = ClassRoom.objects.create(name="JSS1A", grade_level=grade, school=self.school_a)
        self.classroom_b = ClassRoom.objects.create(name="JSS1B", grade_level=grade, school=self.school_b)

        self.session = AcademicSession.objects.create(
            name="2025/2026", start_date="2025-09-01", end_date="2026-07-31", is_current=True,
            school=self.school_a,
        )
        self.subject = _make_subject()
        _login(self.client, "admin@example.com")

    def test_cross_school_create_rejected(self):
        resp = self.client.post("/api/academics/teaching-assignments/", {
            "teacher": str(self.teacher_a.id),
            "classroom": str(self.classroom_b.id),
            "subject": str(self.subject.id),
            "session": str(self.session.id),
        }, format="json")
        self.assertEqual(resp.status_code, 400)
        errors = resp.data.get("non_field_errors", [])
        error_text = " ".join(errors) if isinstance(errors, list) else str(errors)
        self.assertIn("same school", error_text.lower())
