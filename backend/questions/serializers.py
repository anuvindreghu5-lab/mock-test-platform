from rest_framework import serializers
from .models import Question


def _build_media_url(obj, field_name, context):
    image_field = getattr(obj, field_name, None)
    if not image_field:
        return None
    try:
        url = image_field.url
    except Exception:
        return None
    request = context.get("request")
    if request and url and url.startswith("/"):
        return request.build_absolute_uri(url)
    return url


class QuestionSerializer(serializers.ModelSerializer):
    question_image_url = serializers.SerializerMethodField()
    option_a_image_url = serializers.SerializerMethodField()
    option_b_image_url = serializers.SerializerMethodField()
    option_c_image_url = serializers.SerializerMethodField()
    option_d_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Question
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
            "use_image_display",
            "question_image_url",
            "option_a_image_url",
            "option_b_image_url",
            "option_c_image_url",
            "option_d_image_url",
        ]

    def get_question_image_url(self, obj):
        return _build_media_url(obj, "question_image", self.context)

    def get_option_a_image_url(self, obj):
        return _build_media_url(obj, "option_a_image", self.context)

    def get_option_b_image_url(self, obj):
        return _build_media_url(obj, "option_b_image", self.context)

    def get_option_c_image_url(self, obj):
        return _build_media_url(obj, "option_c_image", self.context)

    def get_option_d_image_url(self, obj):
        return _build_media_url(obj, "option_d_image", self.context)
