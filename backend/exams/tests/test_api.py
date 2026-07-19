from __future__ import annotations

from exams.tests import BaseAPITestCase


class ExamAPITests(BaseAPITestCase):
    def test_teacher_can_create_exam_with_questions(self):
        teacher, user = self.create_teacher()
        self.auth(user)
        payload = {
            "title": "Algebra Midterm",
            "course": "Algebra I",
            "course_code": "MATH-101",
            "status": "scheduled",
            "duration_minutes": 90,
            "total_marks": 4,
            "passing_marks": 2,
            "questions": [
                {
                    "order": 1,
                    "text": "2 + 2?",
                    "type": "single_choice",
                    "marks": 2,
                    "choices": [
                        {"label": "A", "text": "4", "is_correct": True},
                        {"label": "B", "text": "5", "is_correct": False},
                    ],
                },
                {
                    "order": 2,
                    "text": "3 + 3?",
                    "type": "single_choice",
                    "marks": 2,
                    "choices": [
                        {"label": "A", "text": "5", "is_correct": False},
                        {"label": "B", "text": "6", "is_correct": True},
                    ],
                },
            ],
        }
        resp = self.client.post("/api/exams/", payload, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["question_count"] if "question_count" in resp.data else len(resp.data["questions"]), 2)

    def test_student_cannot_create_exam(self):
        _, user = self.create_student()
        self.auth(user)
        resp = self.client.post("/api/exams/", {"title": "x"}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def test_submit_attempt_grades_and_creates_result(self):
        teacher, tuser = self.create_teacher()
        student, suser = self.create_student()
        from exams.models import Exam, Question, Choice, Attempt

        exam = Exam.objects.create(
            title="Q", created_by=teacher, status="ongoing",
            duration_minutes=30, total_marks=4, passing_marks=2,
        )
        q1 = Question.objects.create(exam=exam, order=1, text="2+2?", marks=2)
        c1a = Choice.objects.create(question=q1, label="A", text="4", is_correct=True)
        c1b = Choice.objects.create(question=q1, label="B", text="5", is_correct=False)
        q2 = Question.objects.create(exam=exam, order=2, text="3+3?", marks=2)
        c2a = Choice.objects.create(question=q2, label="A", text="5", is_correct=False)
        c2b = Choice.objects.create(question=q2, label="B", text="6", is_correct=True)

        attempt = Attempt.objects.create(exam=exam, student=student, status="in_progress")
        self.auth(suser)
        resp = self.client.post(
            f"/api/attempts/{attempt.id}/submit/",
            {"answers": [
                {"question": str(q1.id), "selected_choice": str(c1a.id)},
                {"question": str(q2.id), "selected_choice": str(c2a.id)},
            ]},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["correct_count"], 1)
        self.assertTrue(resp.data["passed"])
        self.assertEqual(resp.data["percentage"], 50.0)
