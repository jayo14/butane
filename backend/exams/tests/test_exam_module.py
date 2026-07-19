"""Tests for the Exam module: CRUD, publish, share, duplicate, archive, and
question management (create/update/delete/reorder/duplicate/mark-correct).
"""
from __future__ import annotations

from exams.tests import BaseAPITestCase
from exams.models import Choice, Exam, Question


class ExamModuleTests(BaseAPITestCase):
    def setUp(self):
        self.teacher, self.user = self.create_teacher()
        self.auth(self.user)
        self.exam = Exam.objects.create(
            title="Algebra Midterm",
            course="Algebra I",
            course_code="MATH-101",
            subject="mathematics",
            class_group="grade-10",
            term="first-term",
            created_by=self.teacher,
            status="draft",
            duration_minutes=90,
            total_marks=4,
            passing_marks=2,
            passing_percentage=50,
        )
        self.q1 = Question.objects.create(exam=self.exam, order=1, text="2 + 2?", type="single_choice", marks=2)
        self.c1a = Choice.objects.create(question=self.q1, label="A", text="4", is_correct=True)
        self.c1b = Choice.objects.create(question=self.q1, label="B", text="5", is_correct=False)
        self.q2 = Question.objects.create(exam=self.exam, order=2, text="3 + 3?", type="single_choice", marks=2)
        self.c2a = Choice.objects.create(question=self.q2, label="A", text="5", is_correct=False)
        self.c2b = Choice.objects.create(question=self.q2, label="B", text="6", is_correct=True)

    # --- CRUD ---------------------------------------------------------------
    def test_list_only_returns_own_exams(self):
        other_teacher, _ = self.create_teacher(email="other@e.edu")
        Exam.objects.create(title="Other exam", created_by=other_teacher, status="draft")
        resp = self.client.get("/api/exams/")
        self.assertEqual(resp.status_code, 200)
        titles = [e["title"] for e in resp.json()["results"]]
        self.assertIn("Algebra Midterm", titles)
        self.assertNotIn("Other exam", titles)

    def test_retrieve_exam_includes_questions(self):
        resp = self.client.get(f"/api/exams/{self.exam.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["questions"]), 2)

    def test_update_exam(self):
        resp = self.client.patch(f"/api/exams/{self.exam.id}/", {"title": "Updated"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["title"], "Updated")

    # --- Publish ------------------------------------------------------------
    def test_publish_exam_sets_ongoing_and_token(self):
        resp = self.client.post(f"/api/exams/{self.exam.id}/publish/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ongoing")
        self.assertTrue(resp.json()["is_public"])
        self.assertIsNotNone(resp.json()["public_token"])
        self.assertIn("?token=", resp.json()["public_url"])

    def test_cannot_publish_without_questions(self):
        empty = Exam.objects.create(title="Empty", created_by=self.teacher, status="draft")
        resp = self.client.post(f"/api/exams/{empty.id}/publish/")
        self.assertEqual(resp.status_code, 400)

    # --- Public token -------------------------------------------------------
    def test_generate_and_revoke_public_token(self):
        resp = self.client.post(f"/api/exams/{self.exam.id}/generate-public-token/")
        self.assertEqual(resp.status_code, 200)
        token = resp.json()["public_token"]
        self.assertTrue(resp.json()["is_public"])

        revoke = self.client.post(f"/api/exams/{self.exam.id}/revoke-public-token/")
        self.assertEqual(revoke.status_code, 200)
        self.assertFalse(revoke.json()["is_public"])
        self.assertIsNone(revoke.json()["public_token"])

    # --- Duplicate ----------------------------------------------------------
    def test_duplicate_exam_copies_questions_and_choices(self):
        resp = self.client.post(f"/api/exams/{self.exam.id}/duplicate/")
        self.assertEqual(resp.status_code, 201)
        new_id = resp.json()["id"]
        new_exam = Exam.objects.get(id=new_id)
        self.assertEqual(new_exam.questions.count(), 2)
        self.assertEqual(new_exam.status, "draft")
        self.assertTrue(new_exam.title.endswith("(Copy)"))

    # --- Archive ------------------------------------------------------------
    def test_archive_exam(self):
        resp = self.client.post(f"/api/exams/{self.exam.id}/archive/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "completed")
        self.assertIsNotNone(resp.json()["archived_at"])
        self.assertFalse(resp.json()["is_public"])

    # --- Question management ------------------------------------------------
    def test_create_question(self):
        resp = self.client.post(
            f"/api/exams/{self.exam.id}/questions/",
            {
                "text": "5 + 5?",
                "type": "single_choice",
                "marks": 2,
                "choices": [
                    {"label": "A", "text": "10", "is_correct": True},
                    {"label": "B", "text": "11", "is_correct": False},
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(self.exam.questions.count(), 3)

    def test_reorder_questions(self):
        resp = self.client.post(
            f"/api/exams/{self.exam.id}/questions/reorder/",
            {"question_ids": [str(self.q2.id), str(self.q1.id)]},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.q1.refresh_from_db()
        self.q2.refresh_from_db()
        self.assertEqual(self.q2.order, 1)
        self.assertEqual(self.q1.order, 2)

    def test_duplicate_question(self):
        resp = self.client.post(f"/api/exams/{self.exam.id}/questions/{self.q1.id}/duplicate/")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(self.exam.questions.count(), 3)

    def test_mark_correct(self):
        # Flip correctness onto the wrong choice for q2.
        resp = self.client.patch(
            f"/api/exams/{self.exam.id}/questions/{self.q2.id}/mark-correct/",
            {"choice_id": str(self.c2a.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.c2a.refresh_from_db()
        self.c2b.refresh_from_db()
        self.assertTrue(self.c2a.is_correct)
        self.assertFalse(self.c2b.is_correct)

    def test_mark_correct_rejects_multiple_for_single_choice(self):
        resp = self.client.patch(
            f"/api/exams/{self.exam.id}/questions/{self.q1.id}/mark-correct/",
            {"choice_ids": [str(self.c1a.id), str(self.c1b.id)]},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_teacher_cannot_access_others_exam(self):
        other_teacher, _ = self.create_teacher(email="other2@e.edu")
        other_exam = Exam.objects.create(title="X", created_by=other_teacher, status="draft")
        # Stay authenticated as self.user (a different teacher).
        resp = self.client.get(f"/api/exams/{other_exam.id}/questions/")
        # get_exam raises permission denied -> 403
        self.assertIn(resp.status_code, (403, 404))

    def test_question_validation_single_choice_requires_one_correct(self):
        resp = self.client.post(
            f"/api/exams/{self.exam.id}/questions/",
            {
                "text": "Bad?",
                "type": "single_choice",
                "marks": 1,
                "choices": [
                    {"label": "A", "text": "x", "is_correct": False},
                    {"label": "B", "text": "y", "is_correct": False},
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_filter_and_search(self):
        resp = self.client.get("/api/exams/?search=Algebra")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["count"], 1)

        resp2 = self.client.get("/api/exams/?status=draft")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.json()["count"], 1)
