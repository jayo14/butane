"""Tests for the public student examination flow and attempt lifecycle."""
from __future__ import annotations

from django.utils import timezone
from datetime import timedelta

from exams.tests import BaseAPITestCase
from exams.models import Attempt, Choice, Exam, Question
from accounts.models import Student


class PublicFlowTests(BaseAPITestCase):
    def setUp(self):
        self.teacher, _ = self.create_teacher()
        self.exam = Exam.objects.create(
            title="Public Algebra",
            course="Algebra I",
            course_code="MATH-101",
            created_by=self.teacher,
            status="ongoing",
            duration_minutes=60,
            total_marks=4,
            passing_marks=2,
            passing_percentage=50,
        )
        self.exam.generate_public_token()
        self.exam.save(update_fields=["public_token", "is_public"])
        self.q1 = Question.objects.create(exam=self.exam, order=1, text="2+2?", type="single_choice", marks=2)
        self.c1a = Choice.objects.create(question=self.q1, label="A", text="4", is_correct=True)
        self.c1b = Choice.objects.create(question=self.q1, label="B", text="5", is_correct=False)
        self.q2 = Question.objects.create(exam=self.exam, order=2, text="3+3?", type="single_choice", marks=2)
        self.c2a = Choice.objects.create(question=self.q2, label="A", text="5", is_correct=False)
        self.c2b = Choice.objects.create(question=self.q2, label="B", text="6", is_correct=True)
        self.url = f"/api/public/exams/{self.exam.public_token}/"

    # --- Exam detail --------------------------------------------------------
    def test_public_exam_returns_safe_data(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["title"], "Public Algebra")
        self.assertEqual(len(data["questions"]), 2)
        # No correct answers leaked.
        for q in data["questions"]:
            for opt in q["options"]:
                self.assertNotIn("is_correct", opt)
        self.assertNotIn("public_token", data)

    def test_public_exam_unknown_token_404(self):
        resp = self.client.get("/api/public/exams/does-not-exist/")
        self.assertEqual(resp.status_code, 404)

    def test_draft_exam_not_available(self):
        self.exam.status = "draft"
        self.exam.save(update_fields=["status"])
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 400)

    def test_expired_exam_not_available(self):
        self.exam.available_to = timezone.now() - timedelta(hours=1)
        self.exam.save(update_fields=["available_to"])
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 400)

    def test_not_yet_available_exam(self):
        self.exam.available_from = timezone.now() + timedelta(hours=1)
        self.exam.save(update_fields=["available_from"])
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 400)

    # --- Start / resume -----------------------------------------------------
    def test_start_creates_attempt_and_student(self):
        resp = self.client.post(
            f"{self.url}start/",
            {"student_name": "Jane Doe", "admission_number": "ADM-1", "class_group": "grade-10", "term": "first-term"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data["access_token"])
        self.assertEqual(data["student_name"], "Jane Doe")
        self.assertTrue(Student.objects.filter(student_id__isnull=False).exists())

    def test_start_resumes_existing_in_progress_attempt(self):
        r1 = self.client.post(f"{self.url}start/", {"student_name": "Jane", "admission_number": "ADM-2"}, format="json")
        self.assertEqual(r1.status_code, 201)
        token = r1.json()["access_token"]
        r2 = self.client.post(f"{self.url}start/", {"student_name": "Jane", "admission_number": "ADM-2"}, format="json")
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r2.json()["access_token"], token)
        self.assertEqual(Attempt.objects.filter(admission_number="ADM-2").count(), 1)

    # --- Autosave / resume --------------------------------------------------
    def test_autosave_then_resume(self):
        start = self.client.post(f"{self.url}start/", {"student_name": "Joe", "admission_number": "ADM-3"}, format="json")
        aid = start.json()["id"]
        token = start.json()["access_token"]

        save = self.client.post(
            f"/api/public/attempts/{aid}/save/",
            {"token": token, "answers": [{"question": str(self.q1.id), "selected_choice": str(self.c1a.id)}], "duration_seconds": 42},
            format="json",
        )
        self.assertEqual(save.status_code, 200)
        self.assertEqual(save.json()["duration_seconds"], 42)
        self.assertEqual(len(save.json()["answers"]), 1)

        resume = self.client.get(f"/api/public/attempts/{aid}/?token={token}")
        self.assertEqual(resume.status_code, 200)
        self.assertEqual(resume.json()["answers"][0]["selected_choice"], str(self.c1a.id))

    def test_autosave_requires_valid_token(self):
        start = self.client.post(f"{self.url}start/", {"student_name": "Joe", "admission_number": "ADM-X"}, format="json")
        aid = start.json()["id"]
        resp = self.client.post(f"/api/public/attempts/{aid}/save/", {"token": "wrong", "answers": []}, format="json")
        self.assertEqual(resp.status_code, 403)

    # --- Submit -------------------------------------------------------------
    def test_submit_grades_and_returns_result(self):
        start = self.client.post(f"{self.url}start/", {"student_name": "Jane", "admission_number": "ADM-4"}, format="json")
        aid = start.json()["id"]
        token = start.json()["access_token"]

        resp = self.client.post(
            f"/api/public/attempts/{aid}/submit/",
            {
                "token": token,
                "answers": [
                    {"question": str(self.q1.id), "selected_choice": str(self.c1a.id)},
                    {"question": str(self.q2.id), "selected_choice": str(self.c2b.id)},
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["correct_count"], 2)
        self.assertEqual(data["score"], 4.0)
        self.assertTrue(data["passed"])

    def test_submit_rejects_double_submission(self):
        start = self.client.post(f"{self.url}start/", {"student_name": "Jane", "admission_number": "ADM-5"}, format="json")
        aid = start.json()["id"]
        token = start.json()["access_token"]
        self.client.post(f"/api/public/attempts/{aid}/submit/", {"token": token, "answers": []}, format="json")
        again = self.client.post(f"/api/public/attempts/{aid}/submit/", {"token": token, "answers": []}, format="json")
        self.assertEqual(again.status_code, 400)
