"""ViewSets for the schools domain."""
from __future__ import annotations

from rest_framework import permissions, viewsets

from accounts.permissions import IsAdmin
from .models import School
from .serializers import SchoolSerializer


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]
