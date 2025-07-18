from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from decouple import config

User = get_user_model()


class Command(BaseCommand):
    help = '创建默认超级管理员用户'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default=config('SUPER_ADMIN_USERNAME', default='admin'),
            help='超级管理员用户名'
        )
        parser.add_argument(
            '--email',
            type=str,
            default=config('SUPER_ADMIN_EMAIL', default='admin@example.com'),
            help='超级管理员邮箱'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=config('SUPER_ADMIN_PASSWORD', default='admin123456'),
            help='超级管理员密码'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制创建，如果用户已存在则更新'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        force = options['force']

        try:
            user = User.objects.get(email=email)
            if force:
                user.username = username
                user.name = '系统管理员'
                user.is_super_admin = True
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'超级管理员 "{email}" 已更新')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'用户 "{email}" 已存在，使用 --force 来强制更新')
                )
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=username,
                email=email,
                name='系统管理员',
                password=password,
                is_super_admin=True,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'超级管理员 "{email}" 创建成功')
            )

        # 显示用户信息
        self.stdout.write('\n超级管理员信息:')
        self.stdout.write(f'  用户名: {user.username}')
        self.stdout.write(f'  邮箱: {user.email}')
        self.stdout.write(f'  超级管理员权限: {user.is_super_admin}')
        
        # 显示配额信息
        quotas = user.quotas.all()
        if quotas.exists():
            self.stdout.write('\n关联的配额和API Keys:')
            for quota in quotas:
                self.stdout.write(f'  模型组: {quota.model_group.name}')
                self.stdout.write(f'  API Key: {quota.api_key}')
                self.stdout.write(f'  掩码 API Key: {quota.masked_api_key}')
        else:
            self.stdout.write('\n注意: 超级管理员账户已创建，但尚未分配任何配额。')
            self.stdout.write('请通过管理后台为用户分配模型组配额以获得API访问权限。')
        
        self.stdout.write('\n可以使用以下信息登录管理后台:')
        self.stdout.write(f'  邮箱: {user.email}')
        self.stdout.write(f'  密码: {password}') 