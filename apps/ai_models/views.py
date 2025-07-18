from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import AIModel
from .serializers import AIModelSerializer, AIModelCreateSerializer, AIModelUpdateSerializer
from apps.users.permissions import IsSuperAdminUser


class AIModelPagination(PageNumberPagination):
    """AI模型分页器"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 2000  # 允许最大2000条记录，足够获取所有模型


class AIModelViewSet(ModelViewSet):
    """AI模型管理视图集"""
    queryset = AIModel.objects.select_related('provider').all()
    permission_classes = [IsSuperAdminUser]
    pagination_class = AIModelPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['provider', 'model_type', 'is_active', 'is_available']
    search_fields = ['name', 'display_name', 'description']
    ordering_fields = ['name', 'created_at', 'input_price_per_1m', 'output_price_per_1m']
    ordering = ['provider__name', 'name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AIModelCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AIModelUpdateSerializer
        return AIModelSerializer
