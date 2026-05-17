from rest_framework import serializers
from .models import Result, UserAnswer
from questions.models import Question

class QuestionInResultSerializer(serializers.ModelSerializer):

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
        ]

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
                  'is_passed', 'submitted_at', 'answers']