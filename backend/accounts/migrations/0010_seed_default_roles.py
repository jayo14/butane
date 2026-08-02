"""Seed default roles for the multi-tenant RBAC system."""
from django.db import migrations

DEFAULT_ROLES = [
    {
        "name": "Proprietor",
        "slug": "proprietor",
        "can_manage_school": True,
        "can_manage_users": True,
        "can_manage_teachers": True,
        "can_manage_students": True,
        "can_manage_academics": True,
        "can_manage_exams": True,
        "can_enter_scores": True,
        "can_view_reports": True,
        "can_manage_fees": True,
    },
    {
        "name": "Principal",
        "slug": "principal",
        "can_manage_school": True,
        "can_manage_users": True,
        "can_manage_teachers": True,
        "can_manage_students": True,
        "can_manage_academics": True,
        "can_manage_exams": True,
        "can_enter_scores": True,
        "can_view_reports": True,
        "can_manage_fees": True,
    },
    {
        "name": "Vice Principal",
        "slug": "vice-principal",
        "can_manage_teachers": True,
        "can_manage_students": True,
        "can_manage_academics": True,
        "can_manage_exams": True,
        "can_enter_scores": True,
        "can_view_reports": True,
    },
    {
        "name": "Exam Officer",
        "slug": "exam-officer",
        "can_manage_exams": True,
        "can_enter_scores": True,
        "can_view_reports": True,
    },
    {
        "name": "Teacher",
        "slug": "teacher",
        "can_enter_scores": True,
        "can_view_reports": True,
    },
    {
        "name": "Admin Staff",
        "slug": "admin-staff",
        "can_manage_students": True,
        "can_view_reports": True,
    },
]


def seed_default_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    for role_data in DEFAULT_ROLES:
        Role.objects.update_or_create(
            slug=role_data["slug"],
            defaults=role_data,
        )


def remove_default_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    slugs = [r["slug"] for r in DEFAULT_ROLES]
    Role.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_add_role_and_school_membership"),
    ]

    operations = [
        migrations.RunPython(seed_default_roles, remove_default_roles),
    ]
