from django.db import models
from django.utils import timezone
from decimal import Decimal
import uuid
import secrets
import string
from django.conf import settings
from django.db.models import Sum, Count, Avg, Q


def generate_api_key():
    """生成API Key"""
    prefix = getattr(settings, 'API_KEY_PREFIX', 'sk-audit-')
    length = getattr(settings, 'API_KEY_LENGTH', 32)
    chars = string.ascii_letters + string.digits
    random_str = ''.join(secrets.choice(chars) for _ in range(length))
    return f"{prefix}{random_str}"


class UserQuota(models.Model):
    """用户配额"""
    
    class Meta:
        app_label = 'quotas'
        db_table = 'user_quotas'
        verbose_name = '用户配额'
        verbose_name_plural = '用户配额'
        ordering = ['-created_at']
        unique_together = ['user', 'model_group']
        indexes = [
            models.Index(fields=['user', 'model_group']),
            models.Index(fields=['api_key']),
            models.Index(fields=['created_at']),
        ]

    # 用户和模型组
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='quotas')
    model_group = models.ForeignKey('groups.ModelGroup', on_delete=models.CASCADE, related_name='quotas')
    
    # API密钥
    api_key = models.CharField('API密钥', max_length=100, unique=True, default=generate_api_key)
    
    # 配额信息
    total_quota = models.DecimalField('总配额($)', max_digits=10, decimal_places=6)
    used_quota = models.DecimalField('已使用配额($)', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    
    # 配额周期
    PERIOD_CHOICES = [
        ('monthly', '每月'),
        ('weekly', '每周'),
        ('daily', '每日'),
        ('unlimited', '不限期'),
    ]
    period_type = models.CharField('周期类型', max_length=20, choices=PERIOD_CHOICES, default='monthly')
    period_start = models.DateTimeField('周期开始时间', default=timezone.now)
    expires_at = models.DateTimeField('过期时间', null=True, blank=True)
    
    # 速率限制
    rate_limit_per_minute = models.IntegerField('每分钟请求限制', default=60)
    rate_limit_per_hour = models.IntegerField('每小时请求限制', default=3600)
    rate_limit_per_day = models.IntegerField('每日请求限制', default=86400)
    
    # 状态
    is_active = models.BooleanField('是否激活', default=True)
    auto_renew = models.BooleanField('是否自动续费', default=False)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    def __str__(self):
        return f"{self.user.name} - {self.model_group.name} - ${self.total_quota}"
    
    @property
    def remaining_quota(self):
        """剩余配额"""
        return self.total_quota - self.used_quota
    
    @property
    def usage_percentage(self):
        """使用百分比"""
        if self.total_quota == 0:
            return 100.0
        return float((self.used_quota / self.total_quota) * 100)
    
    @property
    def is_expired(self):
        """是否过期"""
        if not self.expires_at:
            return False
        return timezone.now() >= self.expires_at
    
    @property
    def masked_api_key(self):
        """掩码后的API Key"""
        if not self.api_key:
            return None
        prefix = getattr(settings, 'API_KEY_PREFIX', 'sk-audit-')
        visible_chars = 4
        key_length = len(self.api_key)
        prefix_length = len(prefix)
        return f"{prefix}{'*' * (key_length - prefix_length - visible_chars)}{self.api_key[-visible_chars:]}"
    
    def regenerate_api_key(self):
        """重新生成API Key"""
        self.api_key = generate_api_key()
        self.save()
        return self.api_key
    
    def get_all_requests(self):
        """获取所有API请求记录"""
        return self.user.api_requests.filter(model_group=self.model_group)
    
    def check_rate_limit(self, period='minute'):
        """检查速率限制"""
        now = timezone.now()
        requests = self.get_all_requests()
        
        if period == 'minute':
            count = requests.filter(created_at__gte=now - timezone.timedelta(minutes=1)).count()
            return count < self.rate_limit_per_minute
        elif period == 'hour':
            count = requests.filter(created_at__gte=now - timezone.timedelta(hours=1)).count()
            return count < self.rate_limit_per_hour
        elif period == 'day':
            count = requests.filter(created_at__gte=now - timezone.timedelta(days=1)).count()
            return count < self.rate_limit_per_day
        else:
            raise ValueError(f"不支持的速率限制周期: {period}")
    
    def check_quota(self):
        """检查配额是否充足"""
        if not self.is_active:
            return False, "配额未激活"
        
        if self.is_expired:
            return False, "配额已过期"
        
        if self.used_quota >= self.total_quota:
            return False, "配额已用完"
        
        return True, None
    
    def deduct_quota(self, amount):
        """扣除配额"""
        if amount <= 0:
            raise ValueError("扣除金额必须大于0")
        
        if self.used_quota + amount > self.total_quota:
            raise ValueError("配额不足")
        
        self.used_quota += amount
        self.save()
        
        # 记录使用日志
        QuotaUsageLog.objects.create(
            quota=self,
            action='deduct',
            amount=amount,
            remaining=self.remaining_quota
        )
        
        # 检查是否需要发送警告
        self.check_and_create_alerts()
    
    def check_and_create_alerts(self):
        """检查并创建警告"""
        # 配额使用超过90%
        if self.usage_percentage >= 90 and not QuotaAlert.objects.filter(
            quota=self,
            alert_type='quota_exceeded',
            is_resolved=False
        ).exists():
            QuotaAlert.objects.create(
                quota=self,
                alert_type='quota_exceeded',
                message=f'配额即将用完，当前使用率: {self.usage_percentage:.1f}%'
            )
        
        # 配额即将过期（3天内）
        if self.expires_at and not self.is_expired:
            days_left = (self.expires_at - timezone.now()).days
            if days_left <= 3 and not QuotaAlert.objects.filter(
                quota=self,
                alert_type='expiring_soon',
                is_resolved=False
            ).exists():
                QuotaAlert.objects.create(
                    quota=self,
                    alert_type='expiring_soon',
                    message=f'配额将在 {days_left} 天后过期'
                )

    def get_usage_statistics(self, start_date=None, end_date=None):
        """获取使用统计"""
        requests = self.get_all_requests()
        
        if start_date:
            requests = requests.filter(created_at__gte=start_date)
        if end_date:
            requests = requests.filter(created_at__lte=end_date)
        
        stats = requests.aggregate(
            total_requests=Count('id'),
            total_cost=Sum('total_cost'),
            total_tokens=Sum('total_tokens'),
            total_input_tokens=Sum('input_tokens'),
            total_output_tokens=Sum('output_tokens'),
            avg_duration=Avg('duration_ms'),
            success_requests=Count('id', filter=Q(status_code__range=[200, 299])),
        )
        
        # 处理空值
        for key in stats:
            if stats[key] is None:
                if key in ['total_requests', 'success_requests']:
                    stats[key] = 0
                elif key in ['total_cost', 'total_tokens', 'total_input_tokens', 'total_output_tokens']:
                    stats[key] = Decimal('0.000000')
                elif key == 'avg_duration':
                    stats[key] = 0
        
        # 计算成功率
        stats['success_rate'] = (
            float(stats['success_requests'] / stats['total_requests'] * 100)
            if stats['total_requests'] > 0 else 0.0
        )
        
        return stats


class QuotaUsageLog(models.Model):
    """配额使用日志"""
    
    class Meta:
        app_label = 'quotas'
        db_table = 'quota_usage_logs'
        verbose_name = '配额使用日志'
        verbose_name_plural = '配额使用日志'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['quota', 'created_at']),
            models.Index(fields=['action']),
        ]

    quota = models.ForeignKey(UserQuota, on_delete=models.CASCADE, related_name='usage_logs')
    action = models.CharField('操作类型', max_length=50)  # deduct, refund, etc.
    amount = models.DecimalField('金额', max_digits=10, decimal_places=6)
    remaining = models.DecimalField('剩余配额', max_digits=10, decimal_places=6)
    request_id = models.UUIDField('请求ID', default=uuid.uuid4)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    def __str__(self):
        return f"{self.quota.user.name} - {self.action} - ${self.amount}"


class QuotaAlert(models.Model):
    """配额警告"""
    
    class Meta:
        app_label = 'quotas'
        db_table = 'quota_alerts'
        verbose_name = '配额警告'
        verbose_name_plural = '配额警告'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['quota', 'created_at']),
            models.Index(fields=['alert_type']),
            models.Index(fields=['is_resolved']),
        ]

    quota = models.ForeignKey(UserQuota, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField('警告类型', max_length=50)  # quota_exceeded, expiring_soon
    message = models.TextField('警告信息')
    is_read = models.BooleanField('是否已读', default=False)
    is_resolved = models.BooleanField('是否已解决', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)
    
    def __str__(self):
        return f"{self.quota.user.name} - {self.alert_type}"
    
    def mark_as_resolved(self):
        """标记为已解决"""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()
