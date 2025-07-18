from django.db import models
import requests
import json


class APIProvider(models.Model):
    """API提供商模型"""
    
    class Meta:
        app_label = 'apis'
        db_table = 'api_providers'
        verbose_name = 'API提供商'
        verbose_name_plural = 'API提供商'
        ordering = ['name']

    name = models.CharField('提供商名称', max_length=100, unique=True)
    description = models.TextField('描述', blank=True, default='')
    base_url = models.URLField('基础URL', help_text='API的基础URL，如：https://api.openai.com/v1')
    api_key = models.CharField('API密钥', max_length=200)
    
    # 额外配置
    headers = models.JSONField('额外请求头', default=dict, blank=True)
    timeout = models.IntegerField('超时时间(秒)', default=30)
    max_retries = models.IntegerField('最大重试次数', default=3)
    
    # 状态
    is_active = models.BooleanField('是否启用', default=True)
    last_sync_at = models.DateTimeField('最后同步时间', null=True, blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    def __str__(self):
        return self.name
    
    def get_auth_headers(self):
        """获取认证头"""
        auth_headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }
        auth_headers.update(self.headers)
        return auth_headers
    
    def test_connection(self):
        """测试API连接"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(
                f"{self.base_url.rstrip('/')}/models",
                headers=headers,
                timeout=self.timeout
            )
            return {
                'success': response.status_code == 200,
                'status_code': response.status_code,
                'response': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def fetch_models(self):
        """从API获取模型列表"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(
                f"{self.base_url.rstrip('/')}/models",
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                # 不同API提供商的模型数据结构可能不同
                if 'data' in data:
                    return data['data']  # OpenAI格式
                elif isinstance(data, list):
                    return data  # 直接列表格式
                else:
                    return [data]  # 单个对象
            else:
                raise Exception(f"API返回错误: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"获取模型失败: {str(e)}")


class APIProviderLog(models.Model):
    """API提供商日志"""
    
    provider = models.ForeignKey(APIProvider, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField('操作类型', max_length=50)  # test, sync, etc.
    success = models.BooleanField('是否成功')
    response_time = models.FloatField('响应时间(秒)', null=True)
    error_message = models.TextField('错误信息', blank=True)
    details = models.JSONField('详细信息', default=dict)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'api_provider_logs'
        verbose_name = 'API提供商日志'
        verbose_name_plural = 'API提供商日志'
        ordering = ['-created_at']
