"""
backend/apps/questions/models.py
"""

from django.db import models


class Question(models.Model):

    # ─────────────────────────────
    # SUBJECTS
    # ─────────────────────────────

    SUBJECT_CHOICES = [
        ("math", "Mathematics"),
        ("english", "English"),
        ("engineering mechanics", "Engineering Mechanics"),
        ("engineering graphics", "Engineering Graphics"),
        ("general engineering civil", "General Engineering (Civil)"),
        ("general engineering mechanical", "General Engineering (Mechanical)"),
        ("general engineering computer", "General Engineering (Computer)"),
        ("general engineering electrical", "General Engineering (Electrical)"),
        ("general engineering electronics", "General Engineering (Electronics)"),
        ("unknown", "Unknown"),
    ]


    # ─────────────────────────────
    # QUESTION TYPES
    # ─────────────────────────────

    TYPE_CHOICES = [

        ("mcq", "Multiple Choice"),
        ("short_answer", "Short Answer"),
        ("long_answer", "Long Answer"),
    ]


    # ─────────────────────────────
    # DIFFICULTY
    # ─────────────────────────────

    DIFFICULTY_CHOICES = [

        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]


    # ─────────────────────────────
    # MAIN FIELDS
    # ─────────────────────────────

    test = models.ForeignKey(
        'tests.MockTest',
        on_delete=models.CASCADE,
        related_name='questions'
    )

    question_number = models.IntegerField()

    subject = models.CharField(
        max_length=50,
        choices=SUBJECT_CHOICES,
        default="unknown"
    )

    question_text = models.TextField(blank=True)

    # PDF image mode — preserves maths / matrices / trig from original PDF
    use_image_display = models.BooleanField(default=False)
    question_image = models.ImageField(
        upload_to="questions/%Y/%m/",
        blank=True,
        null=True,
    )
    option_a_image = models.ImageField(
        upload_to="questions/%Y/%m/",
        blank=True,
        null=True,
    )
    option_b_image = models.ImageField(
        upload_to="questions/%Y/%m/",
        blank=True,
        null=True,
    )
    option_c_image = models.ImageField(
        upload_to="questions/%Y/%m/",
        blank=True,
        null=True,
    )
    option_d_image = models.ImageField(
        upload_to="questions/%Y/%m/",
        blank=True,
        null=True,
    )

    # OPTIONS

    option_a = models.TextField(blank=True)
    option_b = models.TextField(blank=True)
    option_c = models.TextField(blank=True)
    option_d = models.TextField(blank=True)

    # ANSWER

    correct_answer = models.CharField(
        max_length=5,
        blank=True
    )

    # TYPE

    question_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default="mcq"
    )

    # DIFFICULTY

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default="medium"
    )

    # CREATED TIME

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    # ─────────────────────────────
    # HELPER METHODS
    # ─────────────────────────────

    def get_options(self):

        return [

            self.option_a,
            self.option_b,
            self.option_c,
            self.option_d,
        ]


    # ─────────────────────────────
    # STRING
    # ─────────────────────────────

    class Meta:

        ordering = ["question_number"]


    def __str__(self):

        return (
            f"Q{self.question_number} "
            f"[{self.subject}]"
        )