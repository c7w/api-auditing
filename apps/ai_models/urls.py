from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIModelViewSet

router = DefaultRouter()
router.register(r'ai-models', AIModelViewSet, basename='aimodel')

urlpatterns = [
    path('', include(router.urls)),
] 