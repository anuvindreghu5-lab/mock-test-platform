from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from tests.views import MockTestViewSet
from results.views import ResultViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# ADD THIS
from tests.views_bulk import BulkQuestionUploadView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'tests', MockTestViewSet, basename='test')
router.register(r'results', ResultViewSet, basename='result')

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include(router.urls)),

    # ADD THIS
    path(
        'api/tests/<int:test_id>/bulk_questions/',
        BulkQuestionUploadView.as_view()
    ),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Explicitly serve media files in production (DEBUG=False) on Render
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
]