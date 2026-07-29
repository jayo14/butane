from django.contrib import admin

from .models import (
    AcademicSession,
    AssessmentComponent,
    AssessmentScore,
    BehaviouralRating,
    BehaviouralTrait,
    ClassRoom,
    Enrollment,
    GradeScale,
    ReportCard,
    SchoolProfile,
    TeachingAssignment,
)


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


@admin.register(AssessmentComponent)
class AssessmentComponentAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "classroom", "term", "max_score", "component_type")
    list_filter = ("component_type", "term")
    search_fields = ("name", "subject__name")


@admin.register(AssessmentScore)
class AssessmentScoreAdmin(admin.ModelAdmin):
    list_display = ("student", "component", "score", "entered_by")
    list_filter = ("component__term",)
    search_fields = ("student__user__email",)


@admin.register(GradeScale)
class GradeScaleAdmin(admin.ModelAdmin):
    list_display = ("grade", "min_score", "max_score", "remark")
    ordering = ["-min_score"]


@admin.register(BehaviouralTrait)
class BehaviouralTraitAdmin(admin.ModelAdmin):
    list_display = ("name", "domain", "display_order", "school")
    list_filter = ("domain", "school")
    search_fields = ("name",)


@admin.register(BehaviouralRating)
class BehaviouralRatingAdmin(admin.ModelAdmin):
    list_display = ("trait", "student", "rating", "term", "classroom")
    list_filter = ("term", "trait__domain", "classroom")
    search_fields = ("student__user__email",)


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "term", "total_score", "average_score", "position", "status")
    list_filter = ("status", "term", "classroom")
    search_fields = ("student__user__email", "student__user__full_name")


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "primary_color", "secondary_color")
    search_fields = ("name",)


@admin.register(TeachingAssignment)
class TeachingAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "classroom", "subject", "session", "school")
    list_filter = ("session", "classroom", "subject")
    search_fields = ("teacher__user__email", "classroom__name", "subject__name")
