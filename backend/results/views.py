from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime

from .models import Result, UserAnswer
from .serializers import ResultSerializer

from tests.models import MockTest
from questions.models import Question
from rest_framework.permissions import IsAuthenticated

permission_classes = [IsAuthenticated]

class ResultViewSet(viewsets.ViewSet):

    permission_classes = [IsAuthenticated]



    # ─────────────────────────────
    # SUBMIT TEST
    # ─────────────────────────────

    @action(detail=False, methods=['post'])

    def submit_test(self, request):

        test_id = request.data.get('test_id')

        answers = request.data.get(
            'answers',
            []
        )

        # FIXED TIME
        time_taken = int(
            request.data.get(
                'time_taken',
                0
            )
        )

        started_at = request.data.get(
            'started_at'
        )



        try:

            test = MockTest.objects.get(
                id=test_id
            )

        except MockTest.DoesNotExist:

            return Response(

                {
                    'error': 'Test not found'
                },

                status=status.HTTP_404_NOT_FOUND
            )



        # ─────────────────────────────
        # CREATE RESULT
        # ─────────────────────────────

        correct_count = 0

        wrong_count = 0

        skipped_count = 0

        obtained_marks = 0



        result = Result.objects.create(

            user=request.user,

            test=test,

            total_questions=test.total_questions,

            attempted_questions=len([
                a for a in answers
                if a.get('selected_answer')
            ]),

            correct_answers=0,

            wrong_answers=0,

            skipped_questions=0,

            total_marks=(
                test.total_questions *
                test.marks_per_correct
            ),

            obtained_marks=0,

            percentage=0,

            time_taken_seconds=time_taken,

            started_at=(
                datetime.fromisoformat(started_at)
                if started_at
                else timezone.now()
            ),
        )



        # ─────────────────────────────
        # PROCESS ANSWERS
        # ─────────────────────────────

        for answer_data in answers:

            question_id = answer_data.get(
                'question_id'
            )

            selected_answer = answer_data.get(
                'selected_answer'
            )

            time_spent = answer_data.get(
                'time_spent',
                0
            )



            try:

                question = Question.objects.get(
                    id=question_id
                )

            except Question.DoesNotExist:

                continue



            is_correct = False



            if selected_answer:

                is_correct = (
                    selected_answer ==
                    question.correct_answer
                )

                if is_correct:

                    correct_count += 1

                    obtained_marks += (
                        test.marks_per_correct
                    )

                else:

                    wrong_count += 1

                    if test.negative_marking_enabled:

                        obtained_marks -= (
                            test.negative_marks
                        )

            else:

                skipped_count += 1



            UserAnswer.objects.create(

                result=result,

                question=question,

                selected_answer=selected_answer,

                is_correct=is_correct,

                time_spent_seconds=time_spent
            )



        # ─────────────────────────────
        # UPDATE RESULT
        # ─────────────────────────────

        result.correct_answers = correct_count

        result.wrong_answers = wrong_count

        result.skipped_questions = skipped_count

        result.obtained_marks = max(
            0,
            obtained_marks
        )

        result.percentage = (

            (
                result.obtained_marks /
                result.total_marks
            ) * 100

            if result.total_marks > 0

            else 0
        )

        result.is_passed = (

            result.percentage >=
            result.passing_marks
        )

        result.save()



        # UPDATE TEST STATS

        test.attempts += 1

        test.save()



        # UPDATE USER STATS

        request.user.total_tests_taken += 1

        request.user.total_score += (
            result.obtained_marks
        )

        request.user.save()



        return Response(

            ResultSerializer(result).data,

            status=status.HTTP_201_CREATED
        )



    # ─────────────────────────────
    # MY RESULTS
    # ─────────────────────────────

    @action(detail=False, methods=['get'])

    def my_results(self, request):

        results = Result.objects.filter(
            user=request.user
        ).order_by('-submitted_at')

        serializer = ResultSerializer(
            results,
            many=True
        )

        return Response(
            serializer.data
        )



    # ─────────────────────────────
    # LEADERBOARD
    # ─────────────────────────────

    @action(detail=False, methods=['get'])

    def leaderboard(self, request):

        from django.contrib.auth import get_user_model

        from django.db.models import Sum, Avg

        User = get_user_model()



        users = User.objects.annotate(

            total_score_sum=Sum(
                'results__obtained_marks'
            ),

            avg_percentage=Avg(
                'results__percentage'
            )

        ).filter(

            results__isnull=False

        ).order_by(

            '-total_score_sum'

        )[:100]



        data = [

            {
                'rank': idx + 1,

                'username': user.username,

                'total_score':
                    user.total_score_sum or 0,

                'avg_percentage':
                    round(
                        user.avg_percentage or 0,
                        2
                    ),

                'tests_taken':
                    user.results.count()
            }

            for idx, user in enumerate(users)
        ]



        return Response(data)



    # ─────────────────────────────
    # RESULT DETAIL
    # ─────────────────────────────

    @action(detail=False, methods=['get'])

    def result_detail(self, request):

        result_id = request.query_params.get(
            'result_id'
        )



        try:

            result = Result.objects.get(

                id=result_id,

                user=request.user

            )

        except Result.DoesNotExist:

            return Response(

                {
                    'error': 'Result not found'
                },

                status=status.HTTP_404_NOT_FOUND
            )



        answers = UserAnswer.objects.filter(
            result=result
        ).select_related("question")



        # SUBJECT ANALYSIS

        subject_analysis = {}



        for ans in answers:

            subject = ans.question.subject



            if subject not in subject_analysis:

                subject_analysis[subject] = {

                    "total": 0,

                    "correct": 0,

                    "wrong": 0,

                }



            subject_analysis[subject]["total"] += 1



            if ans.selected_answer:

                if ans.is_correct:

                    subject_analysis[subject]["correct"] += 1

                else:

                    subject_analysis[subject]["wrong"] += 1



        # ANSWERS DATA

        answers_data = []



        for ans in answers:

            answers_data.append({

                "selected_answer":
                    ans.selected_answer,

                "is_correct":
                    ans.is_correct,
"question": {
    "question_text":
        ans.question.question_text,
    "option_a":
        ans.question.option_a,
    "option_b":
        ans.question.option_b,
    "option_c":
        ans.question.option_c,
    "option_d":
        ans.question.option_d,
    "correct_answer":
        ans.question.correct_answer,
    "subject":
        ans.question.subject,
}
            })



        # FINAL RESPONSE

        return Response({

            "id":
                result.id,

            "test_title":
                result.test.title,

            "obtained_marks":
                result.obtained_marks,

            "total_marks":
                result.total_marks,

            "percentage":
                result.percentage,

            "correct_answers":
                result.correct_answers,

            "wrong_answers":
                result.wrong_answers,

            "attempted_questions":
                result.attempted_questions,

            "skipped_questions":
                result.skipped_questions,

            "total_questions":
                result.total_questions,

            "time_taken_seconds":
                result.time_taken_seconds,

            "is_passed":
                result.is_passed,

            "subject_analysis":
                subject_analysis,

            "answers":
                answers_data,
        })