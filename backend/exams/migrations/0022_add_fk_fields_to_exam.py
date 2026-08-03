from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0021_remove_global_unique_subject_gradelevel"),
        ("academics", "0018_add_teaching_assignment_and_class_teacher"),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="subject_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="exams",
                to="exams.subject",
            ),
        ),
        migrations.AddField(
            model_name="exam",
            name="classroom_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="exams",
                to="academics.classroom",
            ),
        ),
        migrations.AddField(
            model_name="exam",
            name="term_fk",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="exams",
                to="exams.term",
            ),
        ),
    ]
