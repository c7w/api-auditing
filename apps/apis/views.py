from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db import transaction
import requests

from .models import APIProvider
from .serializers import APIProviderSerializer, APIProviderCreateSerializer, APIProviderUpdateSerializer
from apps.users.permissions import IsSuperAdminUser


class APIProviderViewSet(ModelViewSet):
    """API提供商管理视图集"""
    queryset = APIProvider.objects.all()
    permission_classes = [IsSuperAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return APIProviderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return APIProviderUpdateSerializer
        return APIProviderSerializer
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """测试API提供商连接"""
        provider = self.get_object()
        
        try:
            # 测试连接 - 获取模型列表
            headers = {
                'Authorization': f'Bearer {provider.api_key}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(
                f'{provider.base_url}/models',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return Response({
                    'success': True,
                    'message': f'连接成功，API提供商 {provider.name} 工作正常'
                })
            else:
                return Response({
                    'success': False,
                    'message': f'连接失败，状态码: {response.status_code}'
                })
                
        except requests.RequestException as e:
            return Response({
                'success': False,
                'message': f'连接失败: {str(e)}'
            })
    
    @action(detail=True, methods=['post'])
    def sync_models(self, request, pk=None):
        """同步模型列表"""
        provider = self.get_object()
        
        try:
            # 获取模型列表
            headers = {
                'Authorization': f'Bearer {provider.api_key}',
                'Content-Type': 'application/json',
            }
            
            response = requests.get(
                f'{provider.base_url}/models',
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                return Response({
                    'success': False,
                    'message': f'获取模型列表失败，状态码: {response.status_code}'
                })
            
            models_data = response.json().get('data', [])
            
            # 导入AIModel
            from apps.ai_models.models import AIModel
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for model_data in models_data:
                    model_id = model_data.get('id')
                    if not model_id:
                        continue
                        
                    # 提取价格信息 - OpenRouter返回每token价格，需要转换为每1M tokens
                    pricing = model_data.get('pricing', {})
                    input_price_per_token = float(pricing.get('prompt', '0'))
                    output_price_per_token = float(pricing.get('completion', '0'))
                    
                    # 转换为每1M tokens价格 (符合OpenAI标准)
                    input_price_per_1m = input_price_per_token * 1_000_000
                    output_price_per_1m = output_price_per_token * 1_000_000
                    
                    # 特判：如果价格为负数，设置为0（避免decimal.InvalidOperation）
                    if input_price_per_1m < 0:
                        input_price_per_1m = 0
                    if output_price_per_1m < 0:
                        output_price_per_1m = 0
                    
                    # 提取上下文长度
                    context_length = model_data.get('context_length', 0)
                    if not context_length and model_data.get('top_provider'):
                        context_length = model_data['top_provider'].get('context_length', 0)
                    
                    # 提取能力
                    capabilities = []
                    architecture = model_data.get('architecture', {})
                    if architecture:
                        input_modalities = architecture.get('input_modalities', [])
                        output_modalities = architecture.get('output_modalities', [])
                        capabilities = input_modalities + output_modalities
                    
                    # 创建或更新模型
                    model, created = AIModel.objects.update_or_create(
                        provider=provider,
                        name=model_id,
                        defaults={
                            'display_name': model_data.get('name', model_id),
                            'description': model_data.get('description', ''),
                            'input_price_per_1m': str(input_price_per_1m),
                            'output_price_per_1m': str(output_price_per_1m),
                            'context_length': context_length or 4096,
                            'capabilities': capabilities,
                            'is_active': True,
                        }
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
            
            return Response({
                'success': True,
                'message': f'模型同步完成',
                'models_count': created_count + updated_count,
                'created': created_count,
                'updated': updated_count
            })
            
        except requests.RequestException as e:
            return Response({
                'success': False,
                'message': f'同步失败: {str(e)}'
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': f'处理失败: {str(e)}'
            })
