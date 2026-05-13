"""
backend/apps/questions/serializers.py
"""

from rest_framework import serializers
from .models import Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Question
        fields = [
            "id",
            "question_number",
            "subject",
            "question_text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer",
            "question_type",
            "difficulty",
        ]