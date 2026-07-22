from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("academics", "0009_backfill_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="academicsession",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_sessions", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="classroom",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="classrooms", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="assessmentcomponent",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assessment_components", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="reportcard",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="report_cards", to="schools.school"),
        ),
        migrations.AlterUniqueTogether(
            name="academicsession",
            unique_together={("school", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="classroom",
            unique_together={("name", "grade_level", "school")},
        ),
        migrations.AlterUniqueTogether(
            name="assessmentcomponent",
            unique_together={("school", "subject", "classroom", "term", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="reportcard",
            unique_together={("school", "student", "classroom", "term")},
        ),
    ]
