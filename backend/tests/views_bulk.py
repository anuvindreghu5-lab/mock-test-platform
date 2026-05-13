from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from questions.models import Question
from .models import MockTest


class BulkQuestionUploadView(APIView):

    def post(self, request, test_id):

        # ─────────────────────────────
        # GET TEST
        # ─────────────────────────────

        try:

            test = MockTest.objects.get(
                id=test_id
            )

        except MockTest.DoesNotExist:

            return Response(
                {
                    "error": "Test not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )


        # ─────────────────────────────
        # GET QUESTIONS
        # ─────────────────────────────

        questions = request.data.get(
            "questions",
            []
        )

        if not isinstance(questions, list):

            return Response(
                {
                    "error":
                    "Questions must be array"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # ─────────────────────────────
        # SAVE QUESTIONS
        # ─────────────────────────────

        created = 0

        for q in questions:

            try:

                options = q.get(
                    "options",
                    []
                )

                Question.objects.create(

                    # TEST
                    test=test,

                    # QUESTION NUMBER
                    question_number=q.get(
                        "number",
                        created + 1
                    ),

                    # SUBJECT
                    subject=q.get(
                        "subject",
                        "math"
                    ),

                    # QUESTION TEXT
                    question_text=q.get(
                        "question",
                        ""
                    ),

                    # OPTIONS
                    option_a=(
                        options[0]
                        if len(options) > 0
                        else ""
                    ),

                    option_b=(
                        options[1]
                        if len(options) > 1
                        else ""
                    ),

                    option_c=(
                        options[2]
                        if len(options) > 2
                        else ""
                    ),

                    option_d=(
                        options[3]
                        if len(options) > 3
                        else ""
                    ),

                    # ANSWER
                    correct_answer=q.get(
                        "answer",
                        ""
                    ),

                    # TYPE
                    question_type=q.get(
                        "type",
                        "mcq"
                    ),

                    # DIFFICULTY
                    difficulty=q.get(
                        "difficulty",
                        "medium"
                    ),
                )

                created += 1

            except Exception as e:

                print(e)


        # ─────────────────────────────
        # UPDATE TOTAL QUESTIONS
        # ─────────────────────────────

        test.total_questions = created

        test.save()


        # ─────────────────────────────
        # RESPONSE
        # ─────────────────────────────

        return Response(

            {
                "message":
                f"{created} questions saved successfully"
            },

            status=status.HTTP_201_CREATED
        )