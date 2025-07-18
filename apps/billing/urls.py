from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'chat-records', views.APIRequestViewSet, basename='chat-records')

urlpatterns = [
    path('', include(router.urls)),
] 