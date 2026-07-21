"""Serializers for standalone question management (nested under an exam)."""
from __future__ import annotations

from rest_framework import serializers

from .models import Choice, Question


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "label", "text", "is_correct"]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "order", "text", "image", "type", "marks", "explanation", "choices"]
        read_only_fields = ["id"]

    def validate_choices(self, choices):
        if not choices:
            raise serializers.ValidationError("A question must have at least one choice.")
        return choices

    def validate(self, attrs):
        question_type = attrs.get("type", self.instance.type if self.instance else "single_choice")
        choices = attrs.get("choices")
        if choices is not None:
            correct = [c for c in choices if c.get("is_correct")]
            if question_type == "single_choice" and len(correct) != 1:
                raise serializers.ValidationError(
                    {"choices": "A single-choice question must have exactly one correct answer."}
                )
            if question_type == "multiple_choice" and len(correct) < 1:
                raise serializers.ValidationError(
                    {"choices": "A multiple-choice question must have at least one correct answer."}
                )
            if question_type == "true_false" and len(choices) != 2:
                raise serializers.ValidationError(
                    {"choices": "A true/false question must have exactly two choices."}
                )
        return attrs

    def create(self, validated_data):
        choices = validated_data.pop("choices")
        question = Question.objects.create(**validated_data)
        for choice in choices:
            Choice.objects.create(question=question, **choice)
        return question

    def update(self, instance, validated_data):
        choices = validated_data.pop("choices", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if choices is not None:
            existing = {c.label: c for c in instance.choices.all()}
            seen = set()
            for choice_data in choices:
                label = choice_data.get("label", "")
                if label in existing:
                    c = existing[label]
                    c.text = choice_data.get("text", c.text)
                    c.is_correct = choice_data.get("is_correct", c.is_correct)
                    c.save(update_fields=["text", "is_correct", "updated_at"])
                else:
                    Choice.objects.create(question=instance, **choice_data)
                seen.add(label)
            for label, c in existing.items():
                if label not in seen:
                    c.delete()
        return instance
