from django.contrib import admin

from .models import Student, Teacher, User

if admin.site.is_registered(User):
    admin.site.unregister(User)

admin.site.register(User)
admin.site.register(Teacher)
admin.site.register(Student)
