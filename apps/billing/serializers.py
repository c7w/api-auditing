from rest_framework import serializers
from .models import APIRequest, BillingRecord, UsageStatistics, CostAlert


class APIRequestSerializer(serializers.ModelSerializer):
    """API请求记录序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    model_display_name = serializers.CharField(source='model.display_name', read_only=True)
    model_group_name = serializers.CharField(source='model_group.name', read_only=True)
    duration_seconds = serializers.FloatField(read_only=True)
    is_successful = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = APIRequest
        fields = [
            'id', 'request_id', 'user', 'user_name', 'model', 'model_name', 
            'model_display_name', 'model_group', 'model_group_name',
            'method', 'endpoint', 'request_data', 'response_data',
            'input_tokens', 'output_tokens', 'total_tokens',
            'input_cost', 'output_cost', 'total_cost',
            'status_code', 'duration_ms', 'duration_seconds', 'is_successful',
            'ip_address', 'user_agent', 'error_type', 'error_message',
            'created_at'
        ]
        read_only_fields = ['id', 'request_id', 'duration_seconds', 'is_successful', 'created_at']


class BillingRecordSerializer(serializers.ModelSerializer):
    """计费记录序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    quota_info = serializers.SerializerMethodField()
    
    class Meta:
        model = BillingRecord
        fields = [
            'id', 'user', 'user_name', 'quota', 'quota_info',
            'period_start', 'period_end', 'total_requests', 'successful_requests', 'failed_requests',
            'total_tokens', 'total_input_tokens', 'total_output_tokens',
            'total_cost', 'input_cost', 'output_cost', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_name', 'quota_info', 'created_at', 'updated_at']
    
    def get_quota_info(self, obj):
        return {
            'id': obj.quota.id,
            'model_group': obj.quota.model_group.name,
            'total_quota': obj.quota.total_quota,
        }


class UsageStatisticsSerializer(serializers.ModelSerializer):
    """使用统计序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    model_name = serializers.CharField(source='model.name', read_only=True)
    model_display_name = serializers.CharField(source='model.display_name', read_only=True)
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = UsageStatistics
        fields = [
            'id', 'user', 'user_name', 'model', 'model_name', 'model_display_name',
            'date', 'hour', 'request_count', 'success_count', 'error_count', 'success_rate',
            'total_tokens', 'input_tokens', 'output_tokens', 'total_cost', 'avg_duration_ms',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_name', 'model_name', 'model_display_name', 'success_rate', 'created_at', 'updated_at']
    
    def get_success_rate(self, obj):
        if obj.request_count > 0:
            return round((obj.success_count / obj.request_count) * 100, 2)
        return 0


class CostAlertSerializer(serializers.ModelSerializer):
    """成本警告序列化器"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    quota_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CostAlert
        fields = [
            'id', 'user', 'user_name', 'quota', 'quota_info',
            'alert_type', 'threshold', 'current_value', 'message',
            'is_active', 'is_resolved', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'user_name', 'quota_info', 'created_at']
    
    def get_quota_info(self, obj):
        return {
            'id': obj.quota.id,
            'model_group': obj.quota.model_group.name,
        } 