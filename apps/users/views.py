from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction

from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    LoginSerializer, PasswordChangeSerializer, APIKeySerializer
)
from .permissions import IsSuperAdminUser

User = get_user_model()


class AuthViewSet:
    """认证相关视图"""
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([permissions.AllowAny])
    def login(request):
        """用户登录"""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([permissions.AllowAny])
    def logout(request):
        """用户登出"""
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': '成功登出'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': '登出失败'}, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    @api_view(['GET'])
    @permission_classes([permissions.IsAuthenticated])
    def get_user_quotas(request):
        """获取当前用户的所有配额信息"""
        user = request.user
        quotas = user.quotas.filter(is_active=True).select_related('model_group').prefetch_related(
            'model_group__ai_models__provider'
        )
        
        quota_data = []
        for quota in quotas:
            # 获取模型组中的活跃模型
            models_info = []
            for model in quota.model_group.ai_models.filter(is_active=True, is_available=True):
                models_info.append({
                    'id': model.id,
                    'name': model.name,
                    'display_name': model.display_name,
                    'provider_name': model.provider.name,
                    'model_type': model.model_type,
                    'context_length': model.context_length,
                    'input_price_per_1m': str(model.input_price_per_1m),
                    'output_price_per_1m': str(model.output_price_per_1m),
                    'capabilities': model.capabilities,
                })
            
            quota_data.append({
                'id': quota.id,
                'name': quota.name,
                'description': quota.description,
                'model_group': quota.model_group.name,
                'model_group_description': quota.model_group.description,
                'masked_api_key': quota.masked_api_key,
                'total_quota': quota.total_quota,
                'used_quota': quota.used_quota,
                'remaining_quota': quota.remaining_quota,
                'usage_percentage': quota.usage_percentage,
                'is_active': quota.is_active,
                'model_count': len(models_info),
                'models': models_info,
            })
        
        return Response({
            'user': user.name,
            'quotas': quota_data
        })
    
    @staticmethod
    @api_view(['GET'])
    @permission_classes([permissions.IsAuthenticated])
    def get_dashboard_stats(request):
        """获取用户仪表盘统计数据"""
        user = request.user
        
        # 导入模型
        from apps.billing.models import APIRequest
        from django.utils import timezone
        from django.db.models import Sum, Count
        from datetime import datetime, timedelta
        
        today = timezone.now().date()
        
        # 获取今日和总统计
        today_requests = APIRequest.objects.filter(
            user=user,
            created_at__date=today
        )
        
        all_requests = APIRequest.objects.filter(user=user)
        
        today_stats = today_requests.aggregate(
            count=Count('id'),
            cost=Sum('total_cost')
        )
        
        total_stats = all_requests.aggregate(
            count=Count('id'),
            cost=Sum('total_cost')
        )
        
        return Response({
            'today_requests': today_stats['count'] or 0,
            'today_cost': float(today_stats['cost'] or 0),
            'total_requests': total_stats['count'] or 0,
            'total_cost': float(total_stats['cost'] or 0),
        })
    
    @staticmethod
    @api_view(['POST'])
    @permission_classes([permissions.IsAuthenticated])
    def change_password(request):
        """修改密码"""
        serializer = PasswordChangeSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({'message': '密码修改成功'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    @api_view(['POST'])
    @permission_classes([permissions.IsAuthenticated])
    def reset_api_key(request, quota_id):
        """用户重置自己的API Key"""
        try:
            from apps.quotas.models import UserQuota
            
            # 只能重置自己的配额
            quota = UserQuota.objects.get(
                id=quota_id, 
                user=request.user,
                is_active=True
            )
            
            new_api_key = quota.regenerate_api_key()
            
            return Response({
                'quota_id': quota.id,
                'model_group': quota.model_group.name,
                'api_key': new_api_key,
                'masked_api_key': quota.masked_api_key,
                'message': f'配额 {quota.model_group.name} 的API Key已重置'
            })
            
        except UserQuota.DoesNotExist:
            return Response(
                {'error': '配额不存在或无权限访问'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'重置失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @staticmethod
    @api_view(['GET'])
    @permission_classes([permissions.IsAuthenticated])
    def get_api_key(request, quota_id):
        """用户查看自己的完整API Key"""
        try:
            from apps.quotas.models import UserQuota
            
            # 只能查看自己的配额
            quota = UserQuota.objects.get(
                id=quota_id, 
                user=request.user,
                is_active=True
            )
            
            return Response({
                'quota_id': quota.id,
                'model_group': quota.model_group.name,
                'api_key': quota.api_key,
                'masked_api_key': quota.masked_api_key,
            })
            
        except UserQuota.DoesNotExist:
            return Response(
                {'error': '配额不存在或无权限访问'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserManagementViewSet(ModelViewSet):
    """用户管理视图集（仅超级管理员可用）"""
    queryset = User.objects.all()
    permission_classes = [IsSuperAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        """创建用户"""
        with transaction.atomic():
            user = serializer.save()
            return user
    

    
    @api_view(['POST'])
    def reset_user_password(request, pk):
        """重置指定用户的密码"""
        try:
            user = User.objects.get(pk=pk)
            new_password = request.data.get('new_password')
            
            if not new_password:
                return Response(
                    {'error': '请提供新密码'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(new_password)
            user.save()
            
            return Response({
                'user_id': user.id,
                'message': f'用户 {user.name} 的密码已重置'
            })
        except User.DoesNotExist:
            return Response(
                {'error': '用户不存在'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """用户个人资料视图"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
