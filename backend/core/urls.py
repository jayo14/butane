"""Root URL configuration for the butane backend.

Exposes a versioned JSON API under ``/api/`` together with Swagger/OpenAPI
documentation. Django admin remains available for operational tasks.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    # REST API
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("exams.urls")),
    # OpenAPI schema + docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
