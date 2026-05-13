from django.db import models
from django.contrib.auth import get_user_model
from tests.models import MockTest

User = get_user_model()

class Result(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='results')
    test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name='results')
    
    total_questions = models.IntegerField()
    attempted_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    wrong_answers = models.IntegerField()
    skipped_questions = models.IntegerField()
    
    total_marks = models.IntegerField()
    obtained_marks = models.IntegerField()
    percentage = models.FloatField()
    
    time_taken_seconds = models.IntegerField()
    
    is_passed = models.BooleanField(default=False)
    passing_marks = models.IntegerField(default=50)
    
    started_at = models.DateTimeField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} - {self.test.title}"


class UserAnswer(models.Model):
    result = models.ForeignKey(Result, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE)
    
    selected_answer = models.CharField(max_length=1, null=True, blank=True)
    is_correct = models.BooleanField(null=True)
    is_marked_for_review = models.BooleanField(default=False)
    time_spent_seconds = models.IntegerField(default=0)

    class Meta:
        db_table = 'user_answers'
        unique_together = ('result', 'question')

    def __str__(self):
        return f"{self.result.id} - Q{self.question.question_number}"