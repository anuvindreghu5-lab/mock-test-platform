"""
backend/apps/questions/views.py
"""

import os

from django.conf import settings

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import Question
from .serializers import QuestionSerializer
from .pdf_parser import parse_pdf


class QuestionListView(APIView):
    """
    GET /api/questions/
    List all questions
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        subject = request.query_params.get("subject")

        qs = Question.objects.all()

        if subject:
            qs = qs.filter(subject=subject)

        serializer = QuestionSerializer(qs, many=True)

        return Response(serializer.data)


class PDFUploadView(APIView):
    """
    POST /api/questions/upload/

    Upload PDF and parse questions.
    """

    permission_classes = [IsAdminUser]

    parser_classes = [
        MultiPartParser,
        FormParser
    ]

    def post(self, request):

        # ─────────────────────────────────────
        # GET FILE
        # ─────────────────────────────────────

        pdf_file = request.FILES.get("file")

        if not pdf_file:

            return Response(
                {
                    "error": (
                        "No file uploaded. "
                        "Send PDF as form-data 'file'"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────
        # VALIDATE FILE TYPE
        # ─────────────────────────────────────

        if not pdf_file.name.lower().endswith(".pdf"):

            return Response(
                {
                    "error": "Only PDF files are supported."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ─────────────────────────────────────
        # CREATE TEMP UPLOAD DIRECTORY
        # ─────────────────────────────────────

        upload_dir = os.path.join(
            settings.MEDIA_ROOT,
            "pdf_uploads"
        )

        os.makedirs(
            upload_dir,
            exist_ok=True
        )

        tmp_path = os.path.join(
            upload_dir,
            pdf_file.name
        )

        # ─────────────────────────────────────
        # SAVE TEMP FILE
        # ─────────────────────────────────────

        with open(tmp_path, "wb") as f:

            for chunk in pdf_file.chunks():
                f.write(chunk)

        # ─────────────────────────────────────
        # OPTIONS
        # ─────────────────────────────────────

        answer_key_page = request.data.get(
            "answer_key_page",
            "last"
        )

        force_vision = (
            request.data.get(
                "force_vision",
                "true"
            ).lower() == "true"
        )

        # ─────────────────────────────────────
        # PARSE PDF
        # ─────────────────────────────────────

        try:

            questions_data = parse_pdf(
                pdf_path=tmp_path,

                answer_key_page=answer_key_page,

                force_vision=force_vision,

                # IMPORTANT FIX
                api_key=settings.GEMINI_API_KEY,
            )

        except Exception as e:

            return Response(
                {
                    "error": f"PDF parsing failed: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        finally:

            # delete temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        # ─────────────────────────────────────
        # NO QUESTIONS FOUND
        # ─────────────────────────────────────

        if not questions_data:

            return Response(
                {
                    "error": (
                        "No questions found in PDF."
                    )
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # ─────────────────────────────────────
        # SAVE QUESTIONS
        # ─────────────────────────────────────

        created = 0
        skipped = 0

        for q in questions_data:

            # skip duplicates
            if Question.objects.filter(
                number=q["number"]
            ).exists():

                skipped += 1
                continue

            Question.objects.create(
                number=q["number"],

                subject=q["subject"],

                question=q["question"],

                options=q["options"],

                type=q["type"],

                answer=q["answer"],
            )

            created += 1

        # ─────────────────────────────────────
        # RESPONSE
        # ─────────────────────────────────────

        return Response(
            {
                "message": (
                    f"Parsed {len(questions_data)} questions. "
                    f"Created: {created}, "
                    f"Skipped: {skipped}"
                ),

                "total": len(questions_data),

                "created": created,

                "skipped": skipped,
            },

            status=status.HTTP_201_CREATED
        )


class QuestionDetailView(APIView):
    """
    GET /api/questions/<id>/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        try:

            question = Question.objects.get(pk=pk)

        except Question.DoesNotExist:

            return Response(
                {
                    "error": "Question not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = QuestionSerializer(question)

        return Response(serializer.data)