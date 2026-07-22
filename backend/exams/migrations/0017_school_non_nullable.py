from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("exams", "0016_backfill_school"),
        ("schools", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="subject",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subjects", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="gradelevel",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="grade_levels", to="schools.school"),
        ),
        migrations.AlterField(
            model_name="exam",
            name="school",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="exams", to="schools.school"),
        ),
        migrations.AlterUniqueTogether(
            name="subject",
            unique_together={("school", "name")},
        ),
        migrations.AlterUniqueTogether(
            name="gradelevel",
            unique_together={("school", "name")},
        ),
    ]
