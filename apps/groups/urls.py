from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ModelGroupViewSet

router = DefaultRouter()
router.register(r'model-groups', ModelGroupViewSet, basename='modelgroup')

urlpatterns = [
    path('', include(router.urls)),
] 