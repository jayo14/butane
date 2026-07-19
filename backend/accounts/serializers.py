"""Serializers for accounts: user, teacher, and student profiles."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Student, Teacher

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name", "role", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "password"]
        read_only_fields = ["id"]

    def validate_role(self, value):
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) != "admin":
            raise serializers.ValidationError("Only admins may assign roles.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id", "user", "full_name", "employee_id", "department", "title",
            "phone", "bio", "avatar", "created_at", "updated_at", "is_deleted",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_deleted"]


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id", "user", "full_name", "student_id", "phone", "grade", "status",
            "enrollment_date", "avatar", "created_at", "updated_at", "is_deleted",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_deleted"]
