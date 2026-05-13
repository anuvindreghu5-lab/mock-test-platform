from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class MockTest(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tests')
    
    # Test Configuration
    total_duration_minutes = models.IntegerField(default=60)
    marks_per_correct = models.IntegerField(default=4)
    negative_marking_enabled = models.BooleanField(default=True)
    negative_marks = models.IntegerField(default=1)
    allow_unlimited_time = models.BooleanField(default=False)
    shuffle_questions = models.BooleanField(default=True)
    shuffle_options = models.BooleanField(default=True)
    
    # Test Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    category = models.CharField(max_length=100, blank=True)
    difficulty_level = models.CharField(
        max_length=10, 
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
        default='medium'
    )
    
    # Statistics
    total_questions = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    pass_percentage = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'mock_tests'
        ordering = ['-created_at']

    def __str__(self):
        return self.title