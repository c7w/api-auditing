from rest_framework import serializers
from .models import AIModel
from apps.apis.models import APIProvider


class AIModelSerializer(serializers.ModelSerializer):
    """AI模型序列化器"""
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    
    class Meta:
        model = AIModel
        fields = [
            'id', 'provider', 'provider_name', 'name', 'display_name', 'description',
            'input_price_per_1m', 'output_price_per_1m', 'context_length', 
            'max_output_tokens', 'capabilities', 'model_type', 'is_active', 
            'is_available', 'external_id', 'last_updated_from_api',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'provider_name', 'created_at', 'updated_at']


class AIModelCreateSerializer(serializers.ModelSerializer):
    """创建AI模型序列化器"""
    
    class Meta:
        model = AIModel
        fields = [
            'provider', 'name', 'display_name', 'description',
            'input_price_per_1m', 'output_price_per_1m', 'context_length',
            'max_output_tokens', 'capabilities', 'model_type', 'is_active'
        ]


class AIModelUpdateSerializer(serializers.ModelSerializer):
    """更新AI模型序列化器"""
    
    class Meta:
        model = AIModel
        fields = [
            'display_name', 'description', 'input_price_per_1m', 
            'output_price_per_1m', 'context_length', 'max_output_tokens',
            'capabilities', 'model_type', 'is_active', 'is_available'
        ] 