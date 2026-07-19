from django.contrib import admin

from .models import Attempt, AttemptAnswer, Choice, Exam, Question, Result

for model in (Exam, Question, Choice, Attempt, AttemptAnswer, Result):
    admin.site.register(model)
