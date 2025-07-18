from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.dateparse import parse_datetime

from .models import UserQuota, QuotaUsageLog, QuotaAlert
from .serializers import (
    UserQuotaSerializer, UserQuotaCreateSerializer, QuotaUsageLogSerializer,
    QuotaAlertSerializer, QuotaStatisticsSerializer, APIKeyResetSerializer
)
from apps.users.permissions import IsSuperAdminUser, IsOwnerOrSuperAdmin
from apps.billing.models import APIRequest
from apps.billing.serializers import APIRequestSerializer

User = get_user_model()


class UserQuotaViewSet(ModelViewSet):
    """用户配额管理视图集（仅超级管理员可用）"""
    queryset = UserQuota.objects.all().select_related('user', 'model_group')
    permission_classes = [IsSuperAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserQuotaCreateSerializer
        return UserQuotaSerializer
    
    def perform_create(self, serializer):
        """创建用户配额"""
        with transaction.atomic():
            quota = serializer.save()
            return quota
    
    @action(detail=True, methods=['post'])
    def reset_api_key(self, request, pk=None):
        """重置指定配额的API Key"""
        quota = self.get_object()
        new_api_key = quota.regenerate_api_key()
        
        return Response({
            'quota_id': quota.id,
            'user': quota.user.name,
            'model_group': quota.model_group.name,
            'api_key': new_api_key,
            'masked_api_key': quota.masked_api_key,
            'message': f'配额 {quota.id} 的API Key已重置'
        })
    
    @action(detail=True, methods=['get'])
    def requests(self, request, pk=None):
        """获取指定配额下的所有API请求记录"""
        quota = self.get_object()
        
        # 获取查询参数
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        page_size = int(request.query_params.get('page_size', 20))
        
        # 获取请求记录
        requests_queryset = quota.get_all_requests()
        
        if start_date:
            start_dt = parse_datetime(start_date)
            if start_dt:
                requests_queryset = requests_queryset.filter(created_at__gte=start_dt)
        
        if end_date:
            end_dt = parse_datetime(end_date)
            if end_dt:
                requests_queryset = requests_queryset.filter(created_at__lte=end_dt)
        
        # 分页
        from django.core.paginator import Paginator
        paginator = Paginator(requests_queryset, page_size)
        page_number = request.query_params.get('page', 1)
        page_obj = paginator.get_page(page_number)
        
        # 序列化数据
        serializer = APIRequestSerializer(page_obj.object_list, many=True)
        
        return Response({
            'quota_info': {
                'id': quota.id,
                'user': quota.user.name,
                'model_group': quota.model_group.name,
                'total_quota': quota.total_quota,
                'used_quota': quota.used_quota,
                'remaining_quota': quota.remaining_quota,
            },
            'requests': serializer.data,
            'pagination': {
                'count': paginator.count,
                'page': page_obj.number,
                'pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous(),
            }
        })
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """获取指定配额的使用统计"""
        quota = self.get_object()
        
        # 获取查询参数
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        start_dt = parse_datetime(start_date) if start_date else None
        end_dt = parse_datetime(end_date) if end_date else None
        
        # 获取统计数据
        stats = quota.get_usage_statistics(start_dt, end_dt)
        
        # 序列化统计数据
        stats_serializer = QuotaStatisticsSerializer(stats)
        
        return Response({
            'quota_info': {
                'id': quota.id,
                'user': quota.user.name,
                'model_group': quota.model_group.name,
                'total_quota': quota.total_quota,
                'used_quota': quota.used_quota,
                'remaining_quota': quota.remaining_quota,
            },
            'statistics': stats_serializer.data,
            'period': {
                'start_date': start_date,
                'end_date': end_date,
            }
        })


@api_view(['POST'])
@permission_classes([IsSuperAdminUser])
def reset_user_all_keys(request, user_id):
    """重置指定用户的所有API Key"""
    try:
        user = User.objects.get(id=user_id)
        updated_keys = user.regenerate_all_api_keys()
        
        return Response({
            'user_id': user.id,
            'user_name': user.name,
            'user_email': user.email,
            'updated_keys': updated_keys,
            'message': f'用户 {user.name} 的所有API Key已重置'
        })
    except User.DoesNotExist:
        return Response(
            {'error': '用户不存在'}, 
            status=status.HTTP_404_NOT_FOUND
        )


class UserQuotaLogViewSet(ModelViewSet):
    """用户配额日志视图集"""
    queryset = QuotaUsageLog.objects.all().select_related('quota__user', 'quota__model_group')
    serializer_class = QuotaUsageLogSerializer
    permission_classes = [IsSuperAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 按配额筛选
        quota_id = self.request.query_params.get('quota_id')
        if quota_id:
            queryset = queryset.filter(quota_id=quota_id)
        
        # 按用户筛选
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(quota__user_id=user_id)
        
        # 按操作类型筛选
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset


class UserQuotaAlertViewSet(ModelViewSet):
    """用户配额警告视图集"""
    queryset = QuotaAlert.objects.all().select_related('quota__user', 'quota__model_group')
    serializer_class = QuotaAlertSerializer
    permission_classes = [IsSuperAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 按配额筛选
        quota_id = self.request.query_params.get('quota_id')
        if quota_id:
            queryset = queryset.filter(quota_id=quota_id)
        
        # 按用户筛选
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(quota__user_id=user_id)
        
        # 按状态筛选
        is_resolved = self.request.query_params.get('is_resolved')
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_resolved(self, request, pk=None):
        """标记警告为已解决"""
        alert = self.get_object()
        alert.mark_as_resolved()
        
        return Response({
            'id': alert.id,
            'message': '警告已标记为已解决'
        })
