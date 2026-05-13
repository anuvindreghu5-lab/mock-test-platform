"""
backend/apps/questions/urls.py
"""

from django.urls import path
from .views import QuestionListView, QuestionDetailView, PDFUploadView

urlpatterns = [
    path("",              QuestionListView.view,  name="question-list"),
    path("<int:pk>/",     QuestionDetailView.as_view(), name="question-detail"),
    path("upload/",       PDFUploadView.as_view(),      name="pdf-upload"),
]