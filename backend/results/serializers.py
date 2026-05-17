from rest_framework import serializers
from .models import Result, UserAnswer
from questions.models import Question

class QuestionInResultSerializer(serializers.ModelSerializer):
    
    # ✅ Add options as array too
    option_a = serializers.SerializerMethodField()
    option_b = serializers.SerializerMethodField()
    option_c = serializers.SerializerMethodField()
    option_d = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id',
            'question_text',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'correct_answer',
            'subject',
            'difficulty',
        ]

    def get_option_a(self, obj):
        if obj.option_a:
            return obj.option_a
        if obj.options and len(obj.options) > 0:
            return obj.options[0]
        return ""

    def get_option_b(self, obj):
        if obj.option_b:
            return obj.option_b
        if obj.options and len(obj.options) > 1:
            return obj.options[1]
        return ""

    def get_option_c(self, obj):
        if obj.option_c:
            return obj.option_c
        if obj.options and len(obj.options) > 2:
            return obj.options[2]
        return ""

    def get_option_d(self, obj):
        if obj.option_d:
            return obj.option_d
        if obj.options and len(obj.options) > 3:
            return obj.options[3]
        return ""


class UserAnswerSerializer(serializers.ModelSerializer):
    question = QuestionInResultSerializer(read_only=True)

    class Meta:
        model = UserAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct',
                  'is_marked_for_review', 'time_spent_seconds']


class ResultSerializer(serializers.ModelSerializer):
    answers = UserAnswerSerializer(many=True, read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = Result
        fields = ['id', 'test_title', 'total_questions', 'attempted_questions',
                  'correct_answers', 'wrong_answers', 'skipped_questions',
                  'obtained_marks', 'total_marks', 'percentage', 'time_taken_seconds',
                  'is_passed', 'submitted_at', 'answers', 'subject_analysis']