from django.db import models
from decimal import Decimal
import uuid
from django.utils import timezone


class APIRequest(models.Model):
    """API请求记录"""
    
    # 请求标识
    request_id = models.UUIDField('请求ID', default=uuid.uuid4, unique=True)
    
    # 用户和模型信息
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='api_requests')
    model = models.ForeignKey('ai_models.AIModel', on_delete=models.PROTECT, related_name='requests')
    model_group = models.ForeignKey('groups.ModelGroup', on_delete=models.PROTECT, related_name='requests', null=True)
    
    # 请求信息
    method = models.CharField('请求方法', max_length=10, default='POST')
    endpoint = models.CharField('请求端点', max_length=200)
    
    # 请求和响应数据
    request_data = models.JSONField('请求数据', default=dict)
    response_data = models.JSONField('响应数据', default=dict)
    
    # Token统计
    input_tokens = models.IntegerField('输入tokens', default=0)
    output_tokens = models.IntegerField('输出tokens', default=0)
    total_tokens = models.IntegerField('总tokens', default=0)
    
    # 成本计算
    input_cost = models.DecimalField('输入成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    output_cost = models.DecimalField('输出成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    total_cost = models.DecimalField('总成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    
    # 响应信息
    status_code = models.IntegerField('响应状态码')
    duration_ms = models.IntegerField('请求耗时(毫秒)')
    
    # 请求元信息
    ip_address = models.GenericIPAddressField('IP地址')
    user_agent = models.TextField('User Agent', blank=True)
    
    # 错误信息
    error_type = models.CharField('错误类型', max_length=100, blank=True)
    error_message = models.TextField('错误信息', blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'api_requests'
        verbose_name = 'API请求记录'
        verbose_name_plural = 'API请求记录'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['model', 'created_at']),
            models.Index(fields=['status_code']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.name} - {self.model.name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def calculate_cost(self):
        """计算并更新成本"""
        self.input_cost = (Decimal(self.input_tokens) / Decimal('1000')) * self.model.input_price_per_1k
        self.output_cost = (Decimal(self.output_tokens) / Decimal('1000')) * self.model.output_price_per_1k
        self.total_cost = self.input_cost + self.output_cost
        self.total_tokens = self.input_tokens + self.output_tokens
        
    def save(self, *args, **kwargs):
        # 自动计算成本
        if not self.total_cost:
            self.calculate_cost()
        super().save(*args, **kwargs)
    
    @property
    def is_successful(self):
        """是否成功"""
        return 200 <= self.status_code < 300
    
    @property
    def duration_seconds(self):
        """耗时（秒）"""
        return self.duration_ms / 1000.0


class BillingRecord(models.Model):
    """计费记录"""
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='billing_records')
    quota = models.ForeignKey('quotas.UserQuota', on_delete=models.CASCADE, related_name='billing_records')
    
    # 计费周期
    period_start = models.DateTimeField('计费周期开始')
    period_end = models.DateTimeField('计费周期结束')
    
    # 使用统计
    total_requests = models.IntegerField('总请求数', default=0)
    successful_requests = models.IntegerField('成功请求数', default=0)
    failed_requests = models.IntegerField('失败请求数', default=0)
    
    total_tokens = models.IntegerField('总tokens', default=0)
    total_input_tokens = models.IntegerField('总输入tokens', default=0)
    total_output_tokens = models.IntegerField('总输出tokens', default=0)
    
    # 成本统计
    total_cost = models.DecimalField('总成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    input_cost = models.DecimalField('输入成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    output_cost = models.DecimalField('输出成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    
    # 状态
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('calculated', '已计算'),
        ('paid', '已支付'),
        ('cancelled', '已取消'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'billing_records'
        verbose_name = '计费记录'
        verbose_name_plural = '计费记录'
        ordering = ['-period_start']
        unique_together = ['user', 'quota', 'period_start']
    
    def __str__(self):
        return f"{self.user.name} - {self.period_start.strftime('%Y-%m')} - ${self.total_cost}"
    
    def calculate_statistics(self):
        """计算统计数据"""
        requests = APIRequest.objects.filter(
            user=self.user,
            model__groups=self.quota.model_group,
            created_at__range=[self.period_start, self.period_end]
        )
        
        # 基本统计
        self.total_requests = requests.count()
        self.successful_requests = requests.filter(status_code__range=[200, 299]).count()
        self.failed_requests = self.total_requests - self.successful_requests
        
        # Token统计
        aggregation = requests.aggregate(
            total_tokens=models.Sum('total_tokens'),
            total_input_tokens=models.Sum('input_tokens'),
            total_output_tokens=models.Sum('output_tokens'),
            total_cost=models.Sum('total_cost'),
            input_cost=models.Sum('input_cost'),
            output_cost=models.Sum('output_cost'),
        )
        
        self.total_tokens = aggregation['total_tokens'] or 0
        self.total_input_tokens = aggregation['total_input_tokens'] or 0
        self.total_output_tokens = aggregation['total_output_tokens'] or 0
        self.total_cost = aggregation['total_cost'] or Decimal('0.000000')
        self.input_cost = aggregation['input_cost'] or Decimal('0.000000')
        self.output_cost = aggregation['output_cost'] or Decimal('0.000000')
        
        self.status = 'calculated'
        self.save()


class UsageStatistics(models.Model):
    """使用统计（按日/时维度）"""
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='usage_statistics')
    model = models.ForeignKey('ai_models.AIModel', on_delete=models.PROTECT, related_name='usage_statistics')
    
    # 时间维度
    date = models.DateField('日期')
    hour = models.IntegerField('小时', null=True, blank=True)  # 空表示按日统计
    
    # 统计数据
    request_count = models.IntegerField('请求次数', default=0)
    success_count = models.IntegerField('成功次数', default=0)
    error_count = models.IntegerField('错误次数', default=0)
    
    total_tokens = models.IntegerField('总tokens', default=0)
    input_tokens = models.IntegerField('输入tokens', default=0)
    output_tokens = models.IntegerField('输出tokens', default=0)
    
    total_cost = models.DecimalField('总成本', max_digits=10, decimal_places=6, default=Decimal('0.000000'))
    avg_duration_ms = models.FloatField('平均耗时(毫秒)', default=0)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'usage_statistics'
        verbose_name = '使用统计'
        verbose_name_plural = '使用统计'
        unique_together = ['user', 'model', 'date', 'hour']
        ordering = ['-date', '-hour']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['user', 'date']),
            models.Index(fields=['model', 'date']),
        ]
    
    def __str__(self):
        time_str = f"{self.date}"
        if self.hour is not None:
            time_str += f" {self.hour:02d}:00"
        return f"{self.user.name} - {self.model.name} - {time_str}"
    
    @classmethod
    def aggregate_daily_stats(cls, date, user=None, model=None):
        """聚合指定日期的统计数据"""
        filters = {'date': date}
        if user:
            filters['user'] = user
        if model:
            filters['model'] = model
            
        return cls.objects.filter(**filters).aggregate(
            total_requests=models.Sum('request_count'),
            total_success=models.Sum('success_count'),
            total_errors=models.Sum('error_count'),
            total_tokens=models.Sum('total_tokens'),
            total_cost=models.Sum('total_cost'),
        )


class CostAlert(models.Model):
    """成本警告"""
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='cost_alerts')
    quota = models.ForeignKey('quotas.UserQuota', on_delete=models.CASCADE, related_name='cost_alerts')
    
    # 警告信息
    alert_type = models.CharField('警告类型', max_length=50)
    threshold = models.DecimalField('阈值', max_digits=10, decimal_places=2)
    current_value = models.DecimalField('当前值', max_digits=10, decimal_places=6)
    message = models.TextField('警告信息')
    
    # 状态
    is_active = models.BooleanField('是否激活', default=True)
    is_resolved = models.BooleanField('是否已解决', default=False)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)
    
    class Meta:
        db_table = 'cost_alerts'
        verbose_name = '成本警告'
        verbose_name_plural = '成本警告'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.name} - {self.alert_type} - ${self.current_value}"
    
    def resolve(self):
        """解决警告"""
        self.is_resolved = True
        self.is_active = False
        self.resolved_at = timezone.now()
        self.save()
