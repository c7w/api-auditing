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
        quotas = user.quotas.filter(is_active=True).select_related('model_group')
        
        quota_data = []
        for quota in quotas:
            quota_data.append({
                'id': quota.id,
                'model_group': quota.model_group.name,
                'masked_api_key': quota.masked_api_key,
                'total_quota': quota.total_quota,
                'used_quota': quota.used_quota,
                'remaining_quota': quota.remaining_quota,
                'usage_percentage': quota.usage_percentage,
                'is_expired': quota.is_expired,
                'expires_at': quota.expires_at,
            })
        
        return Response({
            'user': user.name,
            'quotas': quota_data
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
