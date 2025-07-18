from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal
import requests
import traceback
import json
import logging

from apps.users.authentication import APIKeyAuthentication
from apps.apis.models import APIProvider
from apps.billing.models import APIRequest
from apps.ai_models.models import AIModel

logger = logging.getLogger(__name__)


class ChatCompletionView(APIView):
    """聊天完成API（兼容OpenAI）"""
    
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []  # 由APIKeyAuthentication处理认证
    
    def post(self, request):
        try:
            # 获取当前配额（由认证中间件设置）
            current_quota = getattr(request, 'current_quota', None)
            if not current_quota:
                return Response(
                    {'error': 'Authentication failed'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # 解析请求数据
            if hasattr(request, 'data'):
                data = request.data
            else:
                import json
                data = json.loads(request.body)
            model_name = data.get('model')
            if not model_name:
                return Response(
                    {'error': 'Model parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 查找模型
            try:
                ai_model = AIModel.objects.select_related('provider').get(
                    name=model_name,
                    provider__is_active=True
                )
            except AIModel.DoesNotExist:
                return Response(
                    {'error': f'Model "{model_name}" not found or not available'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 检查模型是否在用户的配额中
            if not current_quota.model_group.ai_models.filter(id=ai_model.id).exists():
                return Response(
                    {'error': f'Model "{model_name}" not available in your plan'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 检查配额是否充足（基于美元额度）
            if current_quota.used_quota >= current_quota.total_quota:
                return Response(
                    {'error': 'Quota exceeded'}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # 转发请求到 AI 提供商
            provider = ai_model.provider
            response_data, usage_data = self._forward_request(provider, data)
            
            # 记录API请求
            api_request = self._record_request(
                current_quota, ai_model, data, response_data, usage_data, request
            )
            
            # 更新配额使用量（更新美元成本）
            if usage_data:
                # 计算本次请求的成本
                input_tokens = int(usage_data.get('prompt_tokens', 0))
                output_tokens = int(usage_data.get('completion_tokens', 0))
                
                input_cost = (Decimal(str(input_tokens)) / Decimal('1000')) * ai_model.input_price_per_1k
                output_cost = (Decimal(str(output_tokens)) / Decimal('1000')) * ai_model.output_price_per_1k
                request_cost = input_cost + output_cost
                
                current_quota.used_quota += request_cost
                current_quota.save()
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Chat completion error: {str(e)}")
            logger.error(traceback.print_exc())
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _forward_request(self, provider, data):
        """转发请求到AI提供商"""
        url = f"{provider.base_url.rstrip('/')}/chat/completions"
        headers = provider.get_auth_headers()
        
        try:
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=provider.timeout
            )
            response.raise_for_status()
            
            response_data = response.json()
            usage_data = response_data.get('usage', {})
            
            return response_data, usage_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Provider request failed: {str(e)}")
            raise Exception(f"Failed to communicate with AI provider: {str(e)}")
    
    def _record_request(self, quota, model, request_data, response_data, usage_data, request):
        """记录API请求"""
        
        # 计算成本
        input_tokens = int(usage_data.get('prompt_tokens', 0))
        output_tokens = int(usage_data.get('completion_tokens', 0))
        
        input_cost = (Decimal(str(input_tokens)) / Decimal('1000')) * model.input_price_per_1k
        output_cost = (Decimal(str(output_tokens)) / Decimal('1000')) * model.output_price_per_1k
        total_cost = input_cost + output_cost
        
        # 获取客户端IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
        
        # 创建请求记录
        api_request = APIRequest.objects.create(
            user=quota.user,
            model=model,
            model_group=quota.model_group,
            endpoint='/v1/chat/completions',
            request_data=request_data,
            response_data=response_data,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=int(usage_data.get('total_tokens', input_tokens + output_tokens)),
            input_cost=input_cost,
            output_cost=output_cost,
            total_cost=total_cost,
            status_code=200,
            duration_ms=0,  # 暂时设为0，后续可以添加计时功能
            ip_address=ip_address,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            created_at=timezone.now()
        )
        
        return api_request


class ModelsListView(APIView):
    """模型列表API（兼容OpenAI）"""
    
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []  # 由APIKeyAuthentication处理认证
    
    def get(self, request):
        try:
            current_quota = getattr(request, 'current_quota', None)
            if not current_quota:
                return Response(
                    {'error': 'Authentication failed'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # 获取用户配额中的可用模型
            models = current_quota.model_group.ai_models.filter(
                provider__is_active=True
            ).select_related('provider')
            
            # 构造OpenAI兼容的响应格式
            model_list = []
            for model in models:
                model_list.append({
                    'id': model.name,
                    'object': 'model',
                    'created': int(model.created_at.timestamp()) if hasattr(model, 'created_at') else 0,
                    'owned_by': model.provider.name.lower(),
                    'permission': []
                })
            
            return Response({
                'object': 'list',
                'data': model_list
            })
            
        except Exception as e:
            logger.error(f"Models list error: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UsageView(APIView):
    """使用情况API"""
    
    authentication_classes = [APIKeyAuthentication]
    permission_classes = []  # 由APIKeyAuthentication处理认证
    
    def get(self, request):
        try:
            current_quota = getattr(request, 'current_quota', None)
            if not current_quota:
                return Response(
                    {'error': 'Authentication failed'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # 获取最近的请求统计
            recent_requests = APIRequest.objects.filter(
                user=current_quota.user,
                model_group=current_quota.model_group
            ).order_by('-created_at')[:10]
            
            total_cost = sum(req.total_cost for req in recent_requests)
            
            return Response({
                'quota': {
                    'total_quota': float(current_quota.total_quota),
                    'used_quota': float(current_quota.used_quota),
                    'remaining_quota': float(current_quota.total_quota - current_quota.used_quota),
                    'model_group': current_quota.model_group.name,
                    'period_type': current_quota.period_type,
                    'expires_at': current_quota.expires_at.isoformat() if current_quota.expires_at else None
                },
                'recent_requests': len(recent_requests),
                'recent_cost': float(total_cost)
            })
            
        except Exception as e:
            logger.error(f"Usage view error: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
