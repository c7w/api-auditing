from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate
from decimal import Decimal

from .models import APIRequest
from .serializers import APIRequestSerializer
from apps.users.permissions import IsSuperAdminUser


class APIRequestViewSet(ReadOnlyModelViewSet):
    """管理员API请求记录查看器"""
    queryset = APIRequest.objects.select_related('user', 'model').all()
    serializer_class = APIRequestSerializer
    permission_classes = [IsSuperAdminUser]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取统计信息"""
        queryset = self.get_queryset()
        
        # 基本统计
        total_requests = queryset.count()
        successful_requests = queryset.filter(status_code__gte=200, status_code__lt=300).count()
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        # 聚合统计
        aggregates = queryset.aggregate(
            total_cost=Sum('total_cost'),
            total_tokens=Sum('total_tokens'),
            avg_duration=Avg('duration_ms')
        )
        
        # 按天统计
        daily_stats = list(queryset.extra(
            select={'date': "DATE(created_at)"}
        ).values('date').annotate(
            requests=Count('id'),
            cost=Sum('total_cost'),
            tokens=Sum('total_tokens')
        ).order_by('date'))
        
        return Response({
            'total_requests': total_requests,
            'successful_requests': successful_requests,
            'success_rate': round(success_rate, 2),
            'total_cost': float(aggregates['total_cost'] or Decimal('0')),
            'total_tokens': aggregates['total_tokens'] or 0,
            'avg_duration_ms': float(aggregates['avg_duration'] or 0),
            'daily_statistics': daily_stats,
            'message': 'Statistics loaded successfully'
        })
