from django.contrib import admin

from .models import Attempt, AttemptAnswer, Choice, Exam, GradeLevel, Question, Result, Subject, Term

for model in (Subject, GradeLevel, Term, Exam, Question, Choice, Attempt, AttemptAnswer, Result):
    admin.site.register(model)
