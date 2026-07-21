"""Image upload view — accepts multipart files, uploads to Cloudinary, returns URL."""
from __future__ import annotations

import cloudinary.uploader
from django.conf import settings
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTeacher


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        cloud_name = getattr(settings, "CLOUDINARY_STORAGE", {}).get("CLOUD_NAME", "")
        if not cloud_name:
            return Response(
                {"detail": "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

        result = cloudinary.uploader.upload(
            file,
            folder="butane/questions",
            resource_type="image",
            overwrite=True,
        )
        return Response({"url": result["secure_url"]}, status=status.HTTP_201_CREATED)
