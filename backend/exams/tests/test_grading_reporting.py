"""Tests for automatic grading and the reporting APIs."""
from __future__ import annotations

from django.utils import timezone

from exams.tests import BaseAPITestCase
from exams.models import Attempt, Choice, Exam, Question, Result
from exams.grading import grade_attempt, submit_and_grade, question_statistics


class GradingTests(BaseAPITestCase):
    def setUp(self):
        self.teacher, _ = self.create_teacher()
        self.exam = Exam.objects.create(
            title="Graded Exam",
            created_by=self.teacher,
            status="ongoing",
            duration_minutes=60,
            total_marks=4,
            passing_marks=2,
            passing_percentage=50,
            show_result=True,
            allow_review=True,
        )
        self.q1 = Question.objects.create(exam=self.exam, order=1, text="2+2?", type="single_choice", marks=2)
        self.c1a = Choice.objects.create(question=self.q1, label="A", text="4", is_correct=True)
        self.c1b = Choice.objects.create(question=self.q1, label="B", text="5", is_correct=False)
        self.q2 = Question.objects.create(exam=self.exam, order=2, text="3+3?", type="single_choice", marks=2)
        self.c2a = Choice.objects.create(question=self.q2, label="A", text="5", is_correct=False)
        self.c2b = Choice.objects.create(question=self.q2, label="B", text="6", is_correct=True)

    def _attempt(self, name="Jane", admission="ADM-G1"):
        return Attempt.objects.create(
            exam=self.exam, student_name=name, admission_number=admission, status="in_progress"
        )

    def test_grade_correct_and_incorrect(self):
        attempt = self._attempt()
        Attempt.objects  # noop to keep linter calm
        from exams.models import AttemptAnswer
        AttemptAnswer.objects.create(attempt=attempt, question=self.q1, selected_choice=self.c1a, is_correct=True, awarded_marks=2)
        AttemptAnswer.objects.create(attempt=attempt, question=self.q2, selected_choice=self.c2a)
        result = grade_attempt(attempt)
        self.assertEqual(result.correct_count, 1)
        self.assertEqual(result.incorrect_count, 1)
        self.assertEqual(result.unanswered_count, 0)
        self.assertEqual(result.score, 2.0)
        self.assertEqual(result.percentage, 50.0)
        self.assertTrue(result.passed)

    def test_grade_unanswered(self):
        attempt = self._attempt()
        from exams.models import AttemptAnswer
        AttemptAnswer.objects.create(attempt=attempt, question=self.q1, selected_choice=None)
        AttemptAnswer.objects.create(attempt=attempt, question=self.q2, selected_choice=self.c2b, is_correct=True, awarded_marks=2)
        result = grade_attempt(attempt)
        self.assertEqual(result.unanswered_count, 1)
        self.assertEqual(result.correct_count, 1)
        self.assertEqual(result.score, 2.0)

    def test_submit_and_grade_is_idempotent(self):
        attempt = self._attempt()
        from exams.models import AttemptAnswer
        AttemptAnswer.objects.create(attempt=attempt, question=self.q1, selected_choice=self.c1a, is_correct=True, awarded_marks=2)
        AttemptAnswer.objects.create(attempt=attempt, question=self.q2, selected_choice=self.c2b, is_correct=True, awarded_marks=2)
        r1 = submit_and_grade(attempt)
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, "submitted")
        r2 = submit_and_grade(attempt)
        self.assertEqual(r1.id, r2.id)
        self.assertEqual(Result.objects.filter(attempt=attempt).count(), 1)


class ReportingTests(BaseAPITestCase):
    def setUp(self):
        self.teacher, self.user = self.create_teacher()
        self.auth(self.user)
        self.exam = Exam.objects.create(
            title="Report Exam",
            created_by=self.teacher,
            status="ongoing",
            total_marks=4,
            passing_marks=2,
        )
        self.q1 = Question.objects.create(exam=self.exam, order=1, text="2+2?", type="single_choice", marks=2)
        self.c1a = Choice.objects.create(question=self.q1, label="A", text="4", is_correct=True)
        self.c1b = Choice.objects.create(question=self.q1, label="B", text="5", is_correct=False)
        self.q2 = Question.objects.create(exam=self.exam, order=2, text="3+3?", type="single_choice", marks=2)
        self.c2a = Choice.objects.create(question=self.q2, label="A", text="5", is_correct=False)
        self.c2b = Choice.objects.create(question=self.q2, label="B", text="6", is_correct=True)

        # Two attempts: one pass (100%), one fail (0%).
        from exams.models import AttemptAnswer
        for name, sel1, sel2, score in [("A", self.c1a, self.c2b, 4), ("B", self.c1b, self.c2a, 0)]:
            a = Attempt.objects.create(exam=self.exam, student_name=name, admission_number=f"ADM-{name}", status="submitted")
            AttemptAnswer.objects.create(attempt=a, question=self.q1, selected_choice=sel1)
            AttemptAnswer.objects.create(attempt=a, question=self.q2, selected_choice=sel2)
            submit_and_grade(a)

    def test_exam_statistics(self):
        resp = self.client.get(f"/api/reports/exams/{self.exam.id}/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["stats"]["total_attempts"], 2)
        self.assertEqual(data["stats"]["total_passed"], 1)
        self.assertEqual(data["stats"]["pass_rate"], 50.0)
        self.assertEqual(data["stats"]["highest"], 100.0)
        self.assertEqual(data["stats"]["lowest"], 0.0)
        self.assertEqual(data["stats"]["average_score"], 50.0)
        self.assertEqual(len(data["top_performers"]), 2)
        self.assertEqual(data["top_performers"][0]["percentage"], 100.0)
        self.assertEqual(len(data["question_statistics"]), 2)
        # q1 correct for student A only -> 50% correct rate.
        q1_stat = next(q for q in data["question_statistics"] if q["question_id"] == str(self.q1.id))
        self.assertEqual(q1_stat["correct_rate"], 50.0)

    def test_question_statistics_endpoint(self):
        resp = self.client.get(f"/api/reports/exams/{self.exam.id}/questions/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["questions"]), 2)

    def test_exam_statistics_scope_denies_other_teacher(self):
        other_teacher, other_user = self.create_teacher(email="other@e.edu")
        self.auth(other_user)
        resp = self.client.get(f"/api/reports/exams/{self.exam.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_results_list_filtering_and_pagination(self):
        resp = self.client.get("/api/results/?exam=%s&passed=true" % self.exam.id)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["count"], 1)
        self.assertEqual(resp.json()["results"][0]["percentage"], 100.0)

    def test_question_statistics_helper(self):
        stats = question_statistics(self.exam)
        self.assertEqual(len(stats), 2)
        self.assertTrue(all("correct_rate" in s for s in stats))
