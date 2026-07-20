from django.db import migrations


def seed_grade_levels(apps, schema_editor):
    GradeLevel = apps.get_model("exams", "GradeLevel")
    grades = [
        ("JSS1", 1),
        ("JSS2", 2),
        ("JSS3", 3),
        ("SSS1", 4),
        ("SSS2", 5),
        ("SSS3", 6),
    ]
    for name, order in grades:
        GradeLevel.objects.get_or_create(name=name, defaults={"display_order": order})


def seed_terms(apps, schema_editor):
    Term = apps.get_model("exams", "Term")
    terms = [
        ("First Term", 1),
        ("Second Term", 2),
        ("Third Term", 3),
    ]
    for name, order in terms:
        Term.objects.get_or_create(name=name, defaults={"display_order": order})


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0011_gradelevel_term"),
    ]

    operations = [
        migrations.RunPython(seed_grade_levels, migrations.RunPython.noop),
        migrations.RunPython(seed_terms, migrations.RunPython.noop),
    ]
