from rest_framework import serializers
from .models import UserQuota, QuotaUsageLog, QuotaAlert
from apps.groups.models import ModelGroup
from apps.users.models import User


class UserQuotaSerializer(serializers.ModelSerializer):
    """用户配额序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    model_group_name = serializers.CharField(source='model_group.name', read_only=True)
    remaining_quota = serializers.DecimalField(max_digits=10, decimal_places=6, read_only=True)
    usage_percentage = serializers.FloatField(read_only=True)
    masked_api_key = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserQuota
        fields = [
            'id', 'user', 'user_name', 'user_email', 'model_group', 'model_group_name',
            'api_key', 'masked_api_key', 'total_quota', 'used_quota', 'remaining_quota',
            'usage_percentage', 'period_type', 'period_start', 'expires_at',
            'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day',
            'is_active', 'auto_renew', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'api_key', 'masked_api_key', 'remaining_quota', 'usage_percentage', 'created_at', 'updated_at']


class UserQuotaCreateSerializer(serializers.ModelSerializer):
    """创建用户配额序列化器"""
    
    class Meta:
        model = UserQuota
        fields = [
            'user', 'model_group', 'total_quota', 'period_type', 'expires_at',
            'rate_limit_per_minute', 'rate_limit_per_hour', 'rate_limit_per_day',
            'is_active', 'auto_renew'
        ]
    
    def validate(self, attrs):
        # 检查用户和模型组的组合是否已存在
        user = attrs['user']
        model_group = attrs['model_group']
        
        if UserQuota.objects.filter(user=user, model_group=model_group).exists():
            raise serializers.ValidationError(
                f"用户 {user.name} 在模型组 {model_group.name} 中已有配额"
            )
        
        return attrs


class QuotaUsageLogSerializer(serializers.ModelSerializer):
    """配额使用日志序列化器"""
    user_name = serializers.CharField(source='quota.user.name', read_only=True)
    model_group_name = serializers.CharField(source='quota.model_group.name', read_only=True)
    
    class Meta:
        model = QuotaUsageLog
        fields = [
            'id', 'quota', 'user_name', 'model_group_name', 'action', 
            'amount', 'remaining', 'request_id', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'user_name', 'model_group_name', 'created_at']


class QuotaAlertSerializer(serializers.ModelSerializer):
    """配额警告序列化器"""
    user_name = serializers.CharField(source='quota.user.name', read_only=True)
    model_group_name = serializers.CharField(source='quota.model_group.name', read_only=True)
    
    class Meta:
        model = QuotaAlert
        fields = [
            'id', 'quota', 'user_name', 'model_group_name', 'alert_type',
            'message', 'is_read', 'is_resolved', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'user_name', 'model_group_name', 'created_at']


class QuotaStatisticsSerializer(serializers.Serializer):
    """配额统计序列化器"""
    total_requests = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=6)
    total_tokens = serializers.IntegerField()
    total_input_tokens = serializers.IntegerField()
    total_output_tokens = serializers.IntegerField()
    avg_duration = serializers.FloatField()
    success_requests = serializers.IntegerField()
    success_rate = serializers.FloatField()


class APIKeyResetSerializer(serializers.Serializer):
    """API Key重置序列化器"""
    quota_id = serializers.IntegerField(required=False)
    
    def validate_quota_id(self, value):
        if value and not UserQuota.objects.filter(id=value).exists():
            raise serializers.ValidationError("配额不存在")
        return value 