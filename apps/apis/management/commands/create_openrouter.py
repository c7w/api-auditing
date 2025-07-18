from django.core.management.base import BaseCommand
from apps.apis.models import APIProvider


class Command(BaseCommand):
    help = '创建OpenRouter API提供商'

    def handle(self, *args, **options):
        openrouter, created = APIProvider.objects.get_or_create(
            name='OpenRouter',
            defaults={
                'description': 'OpenRouter 统一AI模型接入平台',
                'base_url': 'https://openrouter.ai/api/v1',
                'api_key': 'your-openrouter-api-key-here',
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'OpenRouter API提供商创建成功: {openrouter.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'OpenRouter API提供商已存在: {openrouter.name}')
            ) 