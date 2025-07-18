from rest_framework import serializers
from .models import ModelGroup
from apps.ai_models.models import AIModel


class ModelGroupSerializer(serializers.ModelSerializer):
    """模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'ai_models', 'default_quota',
            'is_public', 'allowed_users', 'is_active', 'created_at', 
            'updated_at', 'model_count', 'models_info', 'model_names'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'model_count', 'models_info', 'model_names']
    
    def get_model_count(self, obj):
        return obj.get_model_count()
    
    def get_models_info(self, obj):
        return [
            {
                'id': model.id,
                'name': model.name,
                'display_name': model.display_name,
                'provider_name': model.provider.name
            }
            for model in obj.ai_models.select_related('provider').all()[:5]  # 只显示前5个
        ]
    
    def get_model_names(self, obj):
        """获取模型名称列表用于表格显示"""
        return [model.display_name for model in obj.ai_models.all()]


class ModelGroupCreateSerializer(serializers.ModelSerializer):
    """创建模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'ai_models', 'default_quota',
            'is_public', 'allowed_users', 'is_active', 'created_at', 
            'updated_at', 'model_count', 'models_info', 'model_names'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'model_count', 'models_info', 'model_names']
        
    def get_model_count(self, obj):
        return obj.get_model_count()
    
    def get_models_info(self, obj):
        return [
            {
                'id': model.id,
                'name': model.name,
                'display_name': model.display_name,
                'provider_name': model.provider.name
            }
            for model in obj.ai_models.select_related('provider').all()[:5]  # 只显示前5个
        ]
    
    def get_model_names(self, obj):
        """获取模型名称列表用于表格显示"""
        return [model.display_name for model in obj.ai_models.all()]


class ModelGroupUpdateSerializer(serializers.ModelSerializer):
    """更新模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'ai_models', 'default_quota',
            'is_public', 'allowed_users', 'is_active', 'created_at', 
            'updated_at', 'model_count', 'models_info', 'model_names'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'model_count', 'models_info', 'model_names']
        
    def get_model_count(self, obj):
        return obj.get_model_count()
    
    def get_models_info(self, obj):
        return [
            {
                'id': model.id,
                'name': model.name,
                'display_name': model.display_name,
                'provider_name': model.provider.name
            }
            for model in obj.ai_models.select_related('provider').all()[:5]  # 只显示前5个
        ]
    
    def get_model_names(self, obj):
        """获取模型名称列表用于表格显示"""
        return [model.display_name for model in obj.ai_models.all()] 