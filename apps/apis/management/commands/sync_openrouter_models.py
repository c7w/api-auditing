import os
import requests
import time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.apis.models import APIProvider, APIProviderLog
from apps.ai_models.models import AIModel


class Command(BaseCommand):
    help = '从OpenRouter API同步所有模型到数据库'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-key',
            type=str,
            default=os.getenv('OPENAI_API_KEY'),
            help='OpenRouter API密钥'
        )
        parser.add_argument(
            '--base-url',
            type=str,
            default=os.getenv('OPENAI_API_BASE', 'https://openrouter.ai/api/v1'),
            help='OpenRouter API基础URL'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制更新现有模型'
        )

    def handle(self, *args, **options):
        api_key = options['api_key']
        base_url = options['base_url']
        force = options['force']

        if not api_key:
            self.stdout.write(
                self.style.ERROR('请提供OpenRouter API密钥')
            )
            return

        # 创建或获取OpenRouter提供商
        provider, created = APIProvider.objects.get_or_create(
            name='OpenRouter',
            defaults={
                'base_url': base_url,
                'api_key': api_key,
                'is_active': True,
            }
        )

        if not created:
            provider.base_url = base_url
            provider.api_key = api_key
            provider.save()

        self.stdout.write(
            self.style.SUCCESS(f'{"✅ 创建" if created else "📄 更新"} OpenRouter提供商')
        )

        # 测试API连接
        self.stdout.write('🔗 测试API连接...')
        connection_result = provider.test_connection()
        
        if not connection_result['success']:
            self.stdout.write(
                self.style.ERROR(f'❌ API连接失败: {connection_result.get("error", "未知错误")}')
            )
            return

        self.stdout.write(self.style.SUCCESS('✅ API连接成功'))

        # 获取模型列表
        self.stdout.write('📡 获取模型列表...')
        start_time = time.time()
        
        try:
            models_data = provider.fetch_models()
            response_time = time.time() - start_time
            
            # 记录同步日志
            APIProviderLog.objects.create(
                provider=provider,
                action='sync_models',
                success=True,
                response_time=response_time,
                details={
                    'models_count': len(models_data),
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = str(e)
            
            # 记录错误日志
            APIProviderLog.objects.create(
                provider=provider,
                action='sync_models',
                success=False,
                response_time=response_time,
                error_message=error_msg,
                details={'timestamp': timezone.now().isoformat()}
            )
            
            self.stdout.write(
                self.style.ERROR(f'❌ 获取模型失败: {error_msg}')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'✅ 获取到 {len(models_data)} 个模型')
        )

        # 同步模型到数据库
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for model_data in models_data:
            try:
                model_id = model_data.get('id')
                if not model_id:
                    continue

                # 解析定价信息
                pricing = model_data.get('pricing', {})
                input_price = self._parse_price(pricing.get('prompt', '0'))
                output_price = self._parse_price(pricing.get('completion', '0'))

                # 准备模型数据
                model_defaults = {
                    'display_name': model_data.get('name', model_id),
                    'description': model_data.get('description', ''),
                    'input_price_per_1k': input_price,
                    'output_price_per_1k': output_price,
                    'context_length': model_data.get('context_length', 4096),
                    'model_type': self._determine_model_type(model_data),
                    'capabilities': {
                        'top_provider': model_data.get('top_provider', {}),
                        'per_request_limits': model_data.get('per_request_limits'),
                        'architecture': model_data.get('architecture', {}),
                    },
                    'is_active': True,
                    'external_id': model_id,
                    'last_updated_from_api': timezone.now(),
                }

                # 创建或更新模型
                model, model_created = AIModel.objects.get_or_create(
                    provider=provider,
                    name=model_id,
                    defaults=model_defaults
                )

                if model_created:
                    created_count += 1
                    self.stdout.write(f'  ✅ 创建模型: {model.display_name}')
                elif force:
                    # 更新现有模型
                    for key, value in model_defaults.items():
                        setattr(model, key, value)
                    model.save()
                    updated_count += 1
                    self.stdout.write(f'  📄 更新模型: {model.display_name}')
                else:
                    skipped_count += 1
                    if skipped_count <= 5:  # 只显示前5个跳过的
                        self.stdout.write(f'  ⏭️  跳过现有模型: {model.display_name}')

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️ 处理模型 {model_id} 时出错: {str(e)}')
                )

        # 更新提供商同步时间
        provider.last_sync_at = timezone.now()
        provider.save()

        # 显示统计信息
        self.stdout.write('\n📊 同步统计:')
        self.stdout.write(f'  新创建: {created_count} 个模型')
        self.stdout.write(f'  已更新: {updated_count} 个模型')
        self.stdout.write(f'  已跳过: {skipped_count} 个模型')
        self.stdout.write(f'  总计: {created_count + updated_count + skipped_count} 个模型')

        self.stdout.write('\n🎉 模型同步完成!')
        
        # 显示一些热门模型
        self._show_popular_models(provider)

    def _parse_price(self, price_str):
        """解析价格字符串为Decimal"""
        try:
            # 移除可能的货币符号和空格
            clean_price = str(price_str).replace('$', '').strip()
            return Decimal(clean_price)
        except:
            return Decimal('0.000000')

    def _determine_model_type(self, model_data):
        """根据模型数据确定模型类型"""
        model_id = model_data.get('id', '').lower()
        
        if 'embedding' in model_id or 'embed' in model_id:
            return 'embedding'
        elif 'dall-e' in model_id or 'midjourney' in model_id or 'stable-diffusion' in model_id:
            return 'image'
        elif any(keyword in model_id for keyword in ['gpt', 'claude', 'gemini', 'llama', 'mistral']):
            return 'chat'
        else:
            return 'text'

    def _show_popular_models(self, provider):
        """显示一些热门模型"""
        popular_keywords = ['gpt-4', 'claude-3', 'gemini', 'llama-3']
        
        self.stdout.write('\n🔥 热门模型:')
        for keyword in popular_keywords:
            models = AIModel.objects.filter(
                provider=provider,
                name__icontains=keyword,
                is_active=True
            )[:3]
            
            for model in models:
                self.stdout.write(
                    f'  • {model.display_name} '
                    f'(输入: ${model.input_price_per_1k}/1k, '
                    f'输出: ${model.output_price_per_1k}/1k)'
                ) 