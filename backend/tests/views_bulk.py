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

                def get_option(options, index):
                    if index < len(options):
                        opt = options[index]
                        if len(opt) > 2 and opt[1] == ")":
                            return opt[2:].strip()
                        return str(opt).strip()
                    return ""

                Question.objects.create(
                    test=test,
                    question_number=q.get("number", created + 1),
                    subject=q.get("subject", "math"),
                    question_text=q.get("question", ""),
                    option_a=get_option(options, 0),
                    option_b=get_option(options, 1),
                    option_c=get_option(options, 2),
                    option_d=get_option(options, 3),
                    correct_answer=q.get("answer", ""),
                    question_type=q.get("type", "mcq"),
                    difficulty=q.get("difficulty", "medium"),
                    use_image_display=bool(q.get("use_image_display", False)),
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