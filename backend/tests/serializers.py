from rest_framework import serializers
from .models import MockTest
from questions.serializers import QuestionSerializer

class MockTestListSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = MockTest
        fields = ['id', 'title', 'description', 'total_duration_minutes', 
                  'total_questions', 'difficulty_level', 'category', 'status',
                  'created_by_username', 'attempts', 'created_at']


class MockTestDetailSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = MockTest
        fields = '__all__'


class MockTestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MockTest
        fields = ['title', 'description', 'total_duration_minutes', 'marks_per_correct',
                  'negative_marking_enabled', 'negative_marks', 'allow_unlimited_time',
                  'shuffle_questions', 'shuffle_options', 'category', 'difficulty_level']