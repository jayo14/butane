"""Views for the notifications app."""
from __future__ import annotations

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.views import SchoolScopedViewSetMixin

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(SchoolScopedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.select_related("recipient")
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return super().get_queryset().filter(recipient=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."}, status=status.HTTP_200_OK)
