from django.contrib import admin

from .models import Attempt, AttemptAnswer, Choice, Exam, Question, Result, Subject

for model in (Subject, Exam, Question, Choice, Attempt, AttemptAnswer, Result):
    admin.site.register(model)
