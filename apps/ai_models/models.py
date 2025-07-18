from django.db import models
from decimal import Decimal


class AIModel(models.Model):
    """AI模型信息"""
    
    provider = models.ForeignKey(
        'apis.APIProvider', 
        on_delete=models.CASCADE, 
        related_name='models',
        verbose_name='API提供商'
    )
    
    # 基本信息
    name = models.CharField('模型名称', max_length=100)  # 如：gpt-4o, claude-3-sonnet
    display_name = models.CharField('显示名称', max_length=100)
    description = models.TextField('模型描述', blank=True)
    
    # 定价信息 (参考OpenRouter)
    input_price_per_1k = models.DecimalField(
        '输入价格($/1k tokens)', 
        max_digits=10, 
        decimal_places=6,
        default=Decimal('0.000000')
    )
    output_price_per_1k = models.DecimalField(
        '输出价格($/1k tokens)', 
        max_digits=10, 
        decimal_places=6,
        default=Decimal('0.000000')
    )
    
    # 技术参数
    context_length = models.IntegerField('上下文长度', default=4096)
    max_output_tokens = models.IntegerField('最大输出tokens', null=True, blank=True)
    
    # 能力特性
    capabilities = models.JSONField('能力特性', default=dict, help_text='如：{"vision": true, "function_calling": true}')
    
    # 模型元数据
    model_type = models.CharField(
        '模型类型', 
        max_length=50, 
        choices=[
            ('text', '文本生成'),
            ('chat', '对话模型'), 
            ('embedding', '嵌入模型'),
            ('image', '图像生成'),
            ('multimodal', '多模态'),
        ],
        default='chat'
    )
    
    # 状态管理
    is_active = models.BooleanField('是否启用', default=True)
    is_available = models.BooleanField('是否可用', default=True)
    
    # 同步信息
    external_id = models.CharField('外部ID', max_length=200, blank=True)
    last_updated_from_api = models.DateTimeField('最后从API更新', null=True, blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'ai_models'
        verbose_name = 'AI模型'
        verbose_name_plural = 'AI模型'
        unique_together = ['provider', 'name']
        ordering = ['provider__name', 'name']
    
    def __str__(self):
        return f"{self.provider.name}/{self.name}"
    
    @property
    def full_name(self):
        """完整模型名称"""
        return f"{self.provider.name}/{self.display_name}"
    
    def calculate_cost(self, input_tokens, output_tokens):
        """计算调用成本"""
        input_cost = (Decimal(input_tokens) / Decimal('1000')) * self.input_price_per_1k
        output_cost = (Decimal(output_tokens) / Decimal('1000')) * self.output_price_per_1k
        return input_cost + output_cost
    
    @classmethod
    def create_from_api_data(cls, provider, api_data):
        """从API数据创建模型实例"""
        # 处理不同API提供商的数据格式
        if provider.name.lower() == 'openai':
            return cls._create_from_openai_data(provider, api_data)
        elif provider.name.lower() == 'anthropic':
            return cls._create_from_anthropic_data(provider, api_data)
        else:
            return cls._create_from_generic_data(provider, api_data)
    
    @classmethod
    def _create_from_openai_data(cls, provider, data):
        """从OpenAI API数据创建"""
        return cls.objects.update_or_create(
            provider=provider,
            name=data.get('id'),
            defaults={
                'display_name': data.get('id'),
                'external_id': data.get('id'),
                'model_type': 'chat' if 'gpt' in data.get('id', '').lower() else 'text',
                'capabilities': {
                    'created': data.get('created'),
                    'owned_by': data.get('owned_by'),
                }
            }
        )
    
    @classmethod  
    def _create_from_anthropic_data(cls, provider, data):
        """从Anthropic API数据创建"""
        return cls.objects.update_or_create(
            provider=provider,
            name=data.get('id'),
            defaults={
                'display_name': data.get('display_name', data.get('id')),
                'external_id': data.get('id'),
                'model_type': 'chat',
            }
        )
    
    @classmethod
    def _create_from_generic_data(cls, provider, data):
        """从通用API数据创建"""
        return cls.objects.update_or_create(
            provider=provider,
            name=data.get('id', data.get('name')),
            defaults={
                'display_name': data.get('display_name', data.get('name', data.get('id'))),
                'external_id': data.get('id'),
                'description': data.get('description', ''),
                'context_length': data.get('context_length', 4096),
                'input_price_per_1k': Decimal(str(data.get('pricing', {}).get('prompt', 0))),
                'output_price_per_1k': Decimal(str(data.get('pricing', {}).get('completion', 0))),
            }
        )
