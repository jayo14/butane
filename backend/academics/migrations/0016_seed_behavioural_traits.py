from django.db import migrations


AFFECTIVE_TRAITS = [
    ("Punctuality", 1),
    ("Neatness", 2),
    ("Relationship With Others", 3),
    ("Sense Of Responsibility", 4),
    ("Obedience", 5),
    ("Attentiveness", 6),
    ("Reliability", 7),
    ("Self Control", 8),
    ("Spirit Of Co-operation", 9),
    ("Initiative", 10),
    ("Honesty", 11),
]

PSYCHOMOTOR_TRAITS = [
    ("Communication", 1),
    ("Handling Of Tools", 2),
    ("Handwriting", 3),
    ("Sport & Games", 4),
    ("Manual Skills", 5),
]


def seed_traits(apps, schema_editor):
    BehaviouralTrait = apps.get_model("academics", "BehaviouralTrait")
    for name, order in AFFECTIVE_TRAITS:
        BehaviouralTrait.objects.get_or_create(
            name=name,
            domain="affective",
            school=None,
            defaults={"display_order": order},
        )
    for name, order in PSYCHOMOTOR_TRAITS:
        BehaviouralTrait.objects.get_or_create(
            name=name,
            domain="psychomotor",
            school=None,
            defaults={"display_order": order},
        )


def unseed_traits(apps, schema_editor):
    BehaviouralTrait = apps.get_model("academics", "BehaviouralTrait")
    BehaviouralTrait.objects.filter(school=None).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0015_add_behavioural_models"),
    ]

    operations = [
        migrations.RunPython(seed_traits, unseed_traits),
    ]