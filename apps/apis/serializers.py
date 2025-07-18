from rest_framework import serializers
from .models import APIProvider


class APIProviderSerializer(serializers.ModelSerializer):
    """API提供商序列化器"""
    
    class Meta:
        model = APIProvider
        fields = [
            'id', 'name', 'description', 'base_url', 'api_key',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class APIProviderCreateSerializer(serializers.ModelSerializer):
    """创建API提供商序列化器"""
    
    class Meta:
        model = APIProvider
        fields = [
            'name', 'description', 'base_url', 'api_key', 'is_active'
        ]


class APIProviderUpdateSerializer(serializers.ModelSerializer):
    """更新API提供商序列化器"""
    
    class Meta:
        model = APIProvider
        fields = [
            'name', 'description', 'base_url', 'api_key', 'is_active'
        ] 