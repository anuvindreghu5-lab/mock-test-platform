from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
import os
import re
from rest_framework.permissions import AllowAny

from .models import MockTest
from .serializers import (
    MockTestListSerializer, MockTestDetailSerializer, MockTestCreateSerializer
)
from questions.models import Question
from questions.pdf_parser_images import parse_pdf_to_image_questions
from django.core.files.base import ContentFile
from utils.permissions import IsAdminUser, IsOwnerOrAdmin
import threading


def _process_pdf_in_background(
    pdf_path,
    full_pdf_path,
    output_dir,
    api_key,
    answer_key_page,
    skip_gemini,
    test_id
):
    try:
        from questions.pdf_parser_images import parse_pdf_to_image_questions
        from questions.models import Question
        from tests.models import MockTest
        from django.core.files.base import ContentFile
        import os

        test = MockTest.objects.filter(id=test_id).first()
        if not test:
            print(f"[BG THREAD] Test {test_id} not found.")
            return

        orig_description = test.description
        test.description = f"[Processing PDF in background...]\n\n{orig_description}"
        test.save()

        questions_data = parse_pdf_to_image_questions(
            full_pdf_path,
            output_dir,
            api_key=api_key,
            answer_key_page=answer_key_page,
            skip_gemini=skip_gemini,
        )

        if not questions_data:
            print(f"[BG THREAD] No questions detected in PDF for test {test_id}.")
            test.description = f"[Failed: No questions detected in PDF]\n\n{orig_description}"
            test.save()
            return

        # Replace existing questions for this test when uploading PDF
        Question.objects.filter(test=test).delete()

        created_count = 0
        for idx, q_data in enumerate(questions_data, 1):
            image_path = q_data.get('image_abs_path')
            image_name = q_data.get('image_filename', f'q_{idx}.jpg')

            raw_subject = str(q_data.get('subject', 'unknown')).lower().strip()
            subject = raw_subject if raw_subject else 'unknown'
            options = (q_data.get('options') or ['', '', '', ''])[:4]
            options += [''] * (4 - len(options))

            question_kwargs = dict(
                test=test,
                question_number=q_data.get('number', idx),
                question_text=q_data.get('question', f'Question {idx}'),
                option_a=options[0],
                option_b=options[1],
                option_c=options[2],
                option_d=options[3],
                correct_answer=_normalize_correct_answer(q_data.get('answer', '')),
                subject=subject,
                question_type=q_data.get('type', 'mcq'),
                difficulty=q_data.get('difficulty', 'medium'),
                use_image_display=q_data.get('use_image_display', True),
            )

            if image_path and os.path.isfile(image_path):
                with open(image_path, 'rb') as img_file:
                    question_kwargs['question_image'] = ContentFile(
                        img_file.read(),
                        name=image_name,
                    )

            for opt in ['a', 'b', 'c', 'd']:
                opt_image_path = q_data.get(f'option_{opt}_image_abs_path')
                opt_image_name = q_data.get(
                    f'option_{opt}_image_filename',
                    f'q_{idx}_opt_{opt}.jpg'
                )
                if opt_image_path and os.path.isfile(opt_image_path):
                    with open(opt_image_path, 'rb') as opt_file:
                        question_kwargs[f'option_{opt}_image'] = ContentFile(
                            opt_file.read(),
                            name=opt_image_name,
                        )

            Question.objects.create(**question_kwargs)
            created_count += 1

        test.total_questions = created_count
        test.description = orig_description
        test.save()
        print(f"[BG THREAD] Successfully created {created_count} questions for test {test_id}.")

    except Exception as e:
        print(f"[BG THREAD] Error processing PDF: {e}")
        try:
            test = MockTest.objects.filter(id=test_id).first()
            if test:
                test.description = f"[PDF Processing Failed: {str(e)[:400]}]\n\n{test.description}"
                test.save()
        except Exception:
            pass
    finally:
        from django.core.files.storage import default_storage
        if default_storage.exists(pdf_path):
            try:
                default_storage.delete(pdf_path)
            except Exception as e:
                print(f"[BG THREAD] Error deleting temp PDF: {e}")


def _normalize_correct_answer(raw_answer):
    if not isinstance(raw_answer, str):
        return ""

    answer = raw_answer.strip().upper()
    answer = re.sub(r"^(?:OPTION|OPT|ANSWER)\b[\s\)\.:\-]*", "", answer, flags=re.IGNORECASE).strip()
    answer = re.sub(r"^[\(\)\.:\-\s]+", "", answer)

    match = re.search(r"\b([A-D])\b", answer)
    return match.group(1) if match else ""


class MockTestViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = MockTest.objects.all().select_related('created_by')
        if self.action == 'retrieve':
            return queryset.prefetch_related('questions')
        return queryset

    def get_permissions(self):
        if self.action in ['upload_pdf', 'publish']:
            return [IsAdminUser()]
        if self.action in ['create', 'my_tests', 'bulk_questions']:
            return [IsAuthenticated()]
        return [AllowAny()]

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
        tests = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(tests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_tests(self, request):
        tests = self.get_queryset().filter(status='published')
        serializer = self.get_serializer(tests, many=True)
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
        skip_gemini_raw = request.data.get('skip_gemini', settings.PDF_SKIP_GEMINI)
        if isinstance(skip_gemini_raw, bool):
            skip_gemini = skip_gemini_raw
        else:
            skip_gemini = str(skip_gemini_raw).lower() in ('1', 'true', 'yes')

        # Free mode: no Gemini key required (one image per PDF page)
        if not settings.GEMINI_API_KEY:
            skip_gemini = True

        pdf_path = default_storage.save(f'temp_pdfs/{pdf_file.name}', pdf_file)
        full_pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_path)
        output_dir = os.path.join(settings.MEDIA_ROOT, 'questions', f'test_{test.id}')
        os.makedirs(output_dir, exist_ok=True)

        try:
            thread = threading.Thread(
                target=_process_pdf_in_background,
                args=(
                    pdf_path,
                    full_pdf_path,
                    output_dir,
                    settings.GEMINI_API_KEY,
                    answer_key_page,
                    skip_gemini,
                    test.id
                )
            )
            thread.daemon = True
            thread.start()

            mode_label = 'free_page_images' if skip_gemini else 'ai_cropped_images'
            return Response({
                'success': True,
                'message': (
                    'PDF processing has started in the background. '
                    + (
                        'Since this is Free Mode, it will extract page by page and be done in 10-20 seconds.'
                        if skip_gemini
                        else 'Since this is AI Mode, Gemini is visually cropping and scanning each question. This can take 2–5 minutes due to API rate limits. Please refresh the page in a few minutes.'
                    )
                ),
                'status': 'processing',
                'mode': mode_label,
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            if default_storage.exists(pdf_path):
                default_storage.delete(pdf_path)
            return Response(
                {'error': f'Failed to start background PDF processing: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                correct_answer=_normalize_correct_answer(q_data.get('answer', '')),
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
