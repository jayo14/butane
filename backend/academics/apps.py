from django.apps import AppConfig


class AcademicsConfig(AppConfig):
    default_auto_field = "django.db.models.UUIDField"
    name = "academics"

    def ready(self):
        import academics.signals  # noqa: F401
