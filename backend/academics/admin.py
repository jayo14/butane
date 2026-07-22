from django.contrib import admin

from .models import AcademicSession, ClassRoom, Enrollment


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "is_current")
    list_filter = ("is_current",)
    search_fields = ("name",)


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ("name", "grade_level")
    list_filter = ("grade_level",)
    search_fields = ("name",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "session")
    list_filter = ("session", "classroom")
    search_fields = ("student__user__email", "classroom__name")
