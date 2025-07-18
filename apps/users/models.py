from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """用户模型"""
    
    # 基本信息
    name = models.CharField('姓名', max_length=100)
    email = models.EmailField('邮箱', unique=True)
    
    # 权限
    is_super_admin = models.BooleanField(
        '是否为超级管理员',
        default=False,
        help_text='超级管理员拥有所有权限'
    )
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # 如果是超级管理员，自动设置is_staff和is_superuser
        if self.is_super_admin:
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)
    
    def has_perm(self, perm, obj=None):
        """权限检查"""
        if self.is_super_admin:
            return True
        return super().has_perm(perm, obj)
    
    def regenerate_all_api_keys(self):
        """重新生成所有API Key"""
        updated_keys = []
        for quota in self.quotas.all():
            old_key = quota.api_key
            new_key = quota.regenerate_api_key()
            updated_keys.append({
                'quota_id': quota.id,
                'model_group': quota.model_group.name,
                'old_key': old_key,
                'new_key': new_key
            })
        return updated_keys
