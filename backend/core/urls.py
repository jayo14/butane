"""Root URL configuration for the butane backend.

Exposes a versioned JSON API under ``/api/`` together with Swagger/OpenAPI
documentation. Django admin remains available for operational tasks.
"""
from django.contrib import admin
from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from exams.upload_views import ImageUploadView


def health(request):
    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_ok = True
    except OperationalError:
        pass
    return JsonResponse({"status": "ok" if db_ok else "degraded", "database": "connected" if db_ok else "unreachable"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    # REST API
    path("api/accounts/", include("accounts.urls")),
    path("api/upload/", ImageUploadView.as_view(), name="image-upload"),
    path("api/", include("exams.urls")),
    path("api/academics/", include("academics.urls")),
    # OpenAPI schema + docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
