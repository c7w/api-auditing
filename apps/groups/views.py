from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import ModelGroup
from .serializers import ModelGroupSerializer, ModelGroupCreateSerializer, ModelGroupUpdateSerializer
from apps.users.permissions import IsSuperAdminUser


# Create your views here.

class ModelGroupPagination(PageNumberPagination):
    """模型组分页器"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000  # 模型组数量相对较少


class ModelGroupViewSet(ModelViewSet):
    """模型组管理视图集"""
    queryset = ModelGroup.objects.prefetch_related('ai_models__provider', 'allowed_users').all()
    permission_classes = [IsSuperAdminUser]
    pagination_class = ModelGroupPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_public']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'default_quota']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ModelGroupCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ModelGroupUpdateSerializer
        return ModelGroupSerializer
