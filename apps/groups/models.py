from django.db import models


class ModelGroup(models.Model):
    """模型组"""
    
    name = models.CharField('组名称', max_length=100, unique=True)
    description = models.TextField('组描述', blank=True)
    
    # 包含的模型
    ai_models = models.ManyToManyField(
        'ai_models.AIModel',
        related_name='groups',
        verbose_name='包含模型',
        blank=True
    )
    
    # 组配置
    default_quota = models.DecimalField(
        '默认配额($)', 
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        help_text='为该组分配给新用户的默认配额'
    )
    
    # 访问控制
    is_public = models.BooleanField('是否公开', default=False, help_text='公开组所有用户都能看到')
    allowed_users = models.ManyToManyField(
        'users.User',
        related_name='accessible_groups',
        blank=True,
        verbose_name='允许访问的用户'
    )
    
    # 状态
    is_active = models.BooleanField('是否启用', default=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'model_groups'
        verbose_name = '模型组'
        verbose_name_plural = '模型组'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_model_count(self):
        """获取模型数量"""
        return self.ai_models.count()
    
    def get_active_models(self):
        """获取活跃的模型"""
        return self.ai_models.filter(is_active=True)
    
    def calculate_total_quota_used(self):
        """计算该组的总配额使用量"""
        from apps.quotas.models import UserQuota
        return UserQuota.objects.filter(
            model_group=self,
            is_active=True
        ).aggregate(
            total_used=models.Sum('used_quota')
        )['total_used'] or 0
    
    def get_users_with_access(self):
        """获取有访问权限的用户"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if self.is_public:
            return User.objects.filter(is_active=True)
        else:
            return self.allowed_users.filter(is_active=True)
    
    def add_user_access(self, user):
        """为用户添加访问权限"""
        if not self.is_public:
            self.allowed_users.add(user)
    
    def remove_user_access(self, user):
        """移除用户访问权限"""
        if not self.is_public:
            self.allowed_users.remove(user)


class ModelGroupUsageLog(models.Model):
    """模型组使用日志"""
    
    group = models.ForeignKey(ModelGroup, on_delete=models.CASCADE, related_name='usage_logs')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    model = models.ForeignKey('ai_models.AIModel', on_delete=models.CASCADE)
    
    # 使用统计
    request_count = models.IntegerField('请求次数', default=0)
    total_tokens = models.IntegerField('总token数', default=0)
    total_cost = models.DecimalField('总成本', max_digits=10, decimal_places=6, default=0)
    
    # 时间维度
    date = models.DateField('日期')
    hour = models.IntegerField('小时', null=True, blank=True)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'model_group_usage_logs'
        verbose_name = '模型组使用日志'
        verbose_name_plural = '模型组使用日志'
        unique_together = ['group', 'user', 'model', 'date', 'hour']
        ordering = ['-date', '-hour']
    
    def __str__(self):
        return f"{self.group.name} - {self.user.name} - {self.date}"
