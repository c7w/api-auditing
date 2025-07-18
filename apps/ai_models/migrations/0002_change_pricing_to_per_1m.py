# Generated by Django 5.2.4 on 2025-07-18 09:08

from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_models', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='aimodel',
            name='input_price_per_1k',
        ),
        migrations.RemoveField(
            model_name='aimodel',
            name='output_price_per_1k',
        ),
        migrations.AddField(
            model_name='aimodel',
            name='input_price_per_1m',
            field=models.DecimalField(decimal_places=6, default=Decimal('0.000000'), max_digits=10, verbose_name='输入价格($/1M tokens)'),
        ),
        migrations.AddField(
            model_name='aimodel',
            name='output_price_per_1m',
            field=models.DecimalField(decimal_places=6, default=Decimal('0.000000'), max_digits=10, verbose_name='输出价格($/1M tokens)'),
        ),
    ]
