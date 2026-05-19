from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
import os
from rest_framework.permissions import AllowAny

from .models import MockTest
from .serializers import (
    MockTestListSerializer, MockTestDetailSerializer, MockTestCreateSerializer
)
from questions.models import Question
from questions.pdf_parser_images import parse_pdf_to_image_questions
from django.core.files import File
from utils.permissions import IsAdminUser, IsOwnerOrAdmin

class MockTestViewSet(viewsets.ModelViewSet):
    queryset = MockTest.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MockTestDetailSerializer
        elif self.action == 'create':
            return MockTestCreateSerializer
        return MockTestListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            test = serializer.save(created_by=request.user)
            return Response(
                MockTestDetailSerializer(test).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=False, methods=['get'])
    def my_tests(self, request):
        tests = MockTest.objects.filter(created_by=request.user)
        serializer = MockTestListSerializer(tests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_tests(self, request):
        tests = MockTest.objects.filter(status='published')
        serializer = MockTestListSerializer(tests, many=True)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def upload_pdf(self, request, pk=None):
        """Upload PDF — saves each question as an image crop (preserves maths)."""
        test = self.get_object()

        if 'pdf_file' not in request.FILES:
            return Response(
                {'error': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pdf_file = request.FILES['pdf_file']
        if not pdf_file.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'Only PDF files are supported'},
                status=status.HTTP_400_BAD_REQUEST
            )

        answer_key_page = request.data.get('answer_key_page', 'last')

        pdf_path = default_storage.save(f'temp_pdfs/{pdf_file.name}', pdf_file)
        full_pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_path)
        output_dir = os.path.join(settings.MEDIA_ROOT, 'questions', f'test_{test.id}')
        os.makedirs(output_dir, exist_ok=True)

        try:
            questions_data = parse_pdf_to_image_questions(
                full_pdf_path,
                output_dir,
                api_key=settings.GEMINI_API_KEY,
                answer_key_page=answer_key_page,
            )

            if not questions_data:
                return Response(
                    {'error': 'No questions detected in PDF. Try a clearer scan or different answer-key setting.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Replace existing questions for this test when uploading PDF
            Question.objects.filter(test=test).delete()

            created_count = 0
            for idx, q_data in enumerate(questions_data, 1):
                image_path = q_data.get('image_abs_path')
                image_name = q_data.get('image_filename', f'q_{idx}.jpg')

                question_kwargs = dict(
                    test=test,
                    question_number=q_data.get('number', idx),
                    question_text=q_data.get('question', f'Question {idx}'),
                    option_a='Option A',
                    option_b='Option B',
                    option_c='Option C',
                    option_d='Option D',
                    correct_answer=q_data.get('answer', ''),
                    subject=q_data.get('subject', 'math')[:20],
                    question_type=q_data.get('type', 'mcq'),
                    difficulty=q_data.get('difficulty', 'medium'),
                    use_image_display=True,
                )

                if image_path and os.path.isfile(image_path):
                    with open(image_path, 'rb') as img_file:
                        question_kwargs['question_image'] = File(img_file, name=image_name)

                Question.objects.create(**question_kwargs)
                created_count += 1

            test.total_questions = created_count
            test.save()

            return Response({
                'success': True,
                'message': (
                    f'Saved {created_count} questions as images from PDF '
                    '(math & symbols preserved).'
                ),
                'total_questions': created_count,
                'mode': 'image',
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'PDF processing failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        finally:
            if default_storage.exists(pdf_path):
                default_storage.delete(pdf_path)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def publish(self, request, pk=None):
        test = self.get_object()
        test.status = 'published'
        test.published_at = timezone.now()
        test.save()
        return Response({'message': 'Test published successfully'})

    # ✅ NEW - bulk_questions action
    @action(detail=True, methods=['post'])
    def bulk_questions(self, request, pk=None):
        test = self.get_object()
        questions = request.data.get('questions', [])

        if not questions:
            return Response(
                {'error': 'No questions provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        def get_option(options, index):
            if index < len(options):
                opt = options[index]
                if len(opt) > 2 and opt[1] == ')':
                    return opt[2:].strip()
                return opt.strip()
            return ''

        created_count = 0
        for idx, q_data in enumerate(questions, 1):
            opts = q_data.get('options', [])
            Question.objects.create(
                test=test,
                question_number=q_data.get('number', idx),
                question_text=q_data.get('question', ''),
                option_a=get_option(opts, 0),
                option_b=get_option(opts, 1),
                option_c=get_option(opts, 2),
                option_d=get_option(opts, 3),
                correct_answer=q_data.get('answer', ''),
                subject=q_data.get('subject', 'unknown'),
                question_type=q_data.get('type', 'mcq'),
                difficulty=q_data.get('difficulty', 'medium'),
            )
            created_count += 1

        test.total_questions = created_count
        test.save()

        return Response({
            'message': f'{created_count} questions saved successfully!',
            'total_questions': created_count,
        }, status=status.HTTP_201_CREATED)