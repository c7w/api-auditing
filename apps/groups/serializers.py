from rest_framework import serializers
from .models import ModelGroup
from apps.ai_models.models import AIModel


class ModelGroupSerializer(serializers.ModelSerializer):
    """模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    model_ids = serializers.SerializerMethodField()
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'model_ids', 'default_quota',
            'is_public', 'allowed_users', 'is_active', 'created_at', 
            'updated_at', 'model_count', 'models_info', 'model_names'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'model_count', 'models_info', 'model_names', 'model_ids']
    
    def get_model_ids(self, obj):
        """获取关联的模型ID列表"""
        return list(obj.ai_models.values_list('id', flat=True))
    
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
        return [f"[{model.provider.name}] {model.display_name}" for model in obj.ai_models.select_related('provider').all()]


class ModelGroupCreateSerializer(serializers.ModelSerializer):
    """创建模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    model_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='模型ID列表'
    )
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'model_ids', 'default_quota',
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
        return [f"[{model.provider.name}] {model.display_name}" for model in obj.ai_models.select_related('provider').all()]
    
    def create(self, validated_data):
        """创建模型组时处理model_ids字段"""
        model_ids = validated_data.pop('model_ids', [])
        instance = super().create(validated_data)
        
        # 设置模型关联
        if model_ids:
            from apps.ai_models.models import AIModel
            models = AIModel.objects.filter(id__in=model_ids)
            instance.ai_models.set(models)
        
        return instance


class ModelGroupUpdateSerializer(serializers.ModelSerializer):
    """更新模型组序列化器"""
    model_count = serializers.SerializerMethodField()
    models_info = serializers.SerializerMethodField()
    model_names = serializers.SerializerMethodField()
    model_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='模型ID列表'
    )
    
    class Meta:
        model = ModelGroup
        fields = [
            'id', 'name', 'description', 'model_ids', 'default_quota',
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
        return [f"[{model.provider.name}] {model.display_name}" for model in obj.ai_models.select_related('provider').all()]
    
    def update(self, instance, validated_data):
        """更新模型组时处理model_ids字段"""
        model_ids = validated_data.pop('model_ids', None)
        updated_instance = super().update(instance, validated_data)
        
        # 如果提供了model_ids，则更新模型关联
        if model_ids is not None:
            from apps.ai_models.models import AIModel
            models = AIModel.objects.filter(id__in=model_ids)
            updated_instance.ai_models.set(models)
        
        return updated_instance 