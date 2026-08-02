from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0020_backfill_subject_gradelevel_school"),
    ]

    operations = [
        # Remove old global unique constraints
        migrations.AlterField(
            model_name="subject",
            name="name",
            field=models.CharField(max_length=160),
        ),
        migrations.AlterField(
            model_name="subject",
            name="code",
            field=models.CharField(blank=True, max_length=32, help_text="e.g. MATH"),
        ),
        migrations.AlterField(
            model_name="gradelevel",
            name="name",
            field=models.CharField(max_length=40, help_text="e.g. JSS1"),
        ),
        # Add new tenant-scoped unique constraints
        migrations.AddConstraint(
            model_name="subject",
            constraint=models.UniqueConstraint(fields=("name", "school"), name="uq_subject_name_per_school"),
        ),
        migrations.AddConstraint(
            model_name="subject",
            constraint=models.UniqueConstraint(fields=("code", "school"), name="uq_subject_code_per_school"),
        ),
        migrations.AddConstraint(
            model_name="gradelevel",
            constraint=models.UniqueConstraint(fields=("name", "school"), name="uq_gradelevel_name_per_school"),
        ),
    ]
