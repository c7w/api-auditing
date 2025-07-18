from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import APIProviderViewSet

router = DefaultRouter()
router.register(r'providers', APIProviderViewSet, basename='apiprovider')

urlpatterns = [
    path('', include(router.urls)),
] 