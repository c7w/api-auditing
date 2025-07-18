import pytest
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.quotas.models import UserQuota, QuotaUsageLog, QuotaAlert
from apps.quotas.factories import UserQuotaFactory, QuotaUsageLogFactory, QuotaAlertFactory
from apps.users.factories import UserFactory
from apps.billing.factories import APIRequestFactory

pytestmark = pytest.mark.django_db

class TestUserQuota:
    def test_create_quota(self):
        user = UserFactory()
        quota = UserQuotaFactory(user=user)
        assert quota.id is not None
        assert quota.user == user
        assert quota.api_key.startswith('sk-audit-test-')
        assert quota.used_quota == Decimal('0.000000')
        assert quota.is_active is True

    def test_remaining_quota(self):
        quota = UserQuotaFactory(
            total_quota=Decimal('100.000000'),
            used_quota=Decimal('30.000000')
        )
        assert quota.remaining_quota == Decimal('70.000000')

    def test_usage_percentage(self):
        quota = UserQuotaFactory(
            total_quota=Decimal('100.000000'),
            used_quota=Decimal('30.000000')
        )
        assert quota.usage_percentage == 30.0

    def test_usage_percentage_zero_total(self):
        quota = UserQuotaFactory(
            total_quota=Decimal('0.000000'),
            used_quota=Decimal('0.000000')
        )
        assert quota.usage_percentage == 100.0

    def test_is_expired(self):
        # 未过期配额
        quota = UserQuotaFactory(
            expires_at=timezone.now() + timezone.timedelta(days=1)
        )
        assert quota.is_expired is False

        # 已过期配额
        quota = UserQuotaFactory(
            expires_at=timezone.now() - timezone.timedelta(days=1)
        )
        assert quota.is_expired is True

        # 无过期时间配额
        quota = UserQuotaFactory(expires_at=None)
        assert quota.is_expired is False

    def test_masked_api_key(self):
        quota = UserQuotaFactory()
        masked_key = quota.masked_api_key
        assert masked_key.startswith('sk-audit-test-')
        assert '*' in masked_key
        assert len(masked_key) == len(quota.api_key)
        assert masked_key[-4:] == quota.api_key[-4:]

    def test_regenerate_api_key(self):
        quota = UserQuotaFactory()
        old_key = quota.api_key
        new_key = quota.regenerate_api_key()
        assert new_key != old_key
        assert new_key.startswith('sk-audit-test-')
        assert len(new_key) == len(old_key)

    def test_check_rate_limit(self):
        quota = UserQuotaFactory(
            rate_limit_per_minute=2,
            rate_limit_per_hour=5,
            rate_limit_per_day=10
        )

        # 创建一些请求记录
        for _ in range(3):
            APIRequestFactory(
                user=quota.user,
                model_group=quota.model_group,
                created_at=timezone.now()
            )

        assert quota.check_rate_limit('minute') is False
        assert quota.check_rate_limit('hour') is True
        assert quota.check_rate_limit('day') is True

        with pytest.raises(ValueError):
            quota.check_rate_limit('invalid')

    def test_check_quota(self):
        # 正常配额
        quota = UserQuotaFactory(
            is_active=True,
            total_quota=Decimal('100.000000'),
            used_quota=Decimal('30.000000')
        )
        is_valid, message = quota.check_quota()
        assert is_valid is True
        assert message is None

        # 未激活配额
        quota.is_active = False
        is_valid, message = quota.check_quota()
        assert is_valid is False
        assert message == "配额未激活"

        # 已过期配额
        quota.is_active = True
        quota.expires_at = timezone.now() - timezone.timedelta(days=1)
        is_valid, message = quota.check_quota()
        assert is_valid is False
        assert message == "配额已过期"

        # 已用完配额
        quota.expires_at = None
        quota.used_quota = quota.total_quota
        is_valid, message = quota.check_quota()
        assert is_valid is False
        assert message == "配额已用完"

    def test_deduct_quota(self):
        quota = UserQuotaFactory(
            total_quota=Decimal('100.000000'),
            used_quota=Decimal('30.000000')
        )
        
        # 正常扣除
        quota.deduct_quota(Decimal('20.000000'))
        assert quota.used_quota == Decimal('50.000000')
        assert QuotaUsageLog.objects.filter(quota=quota).count() == 1

        # 扣除金额为0
        with pytest.raises(ValueError):
            quota.deduct_quota(Decimal('0.000000'))

        # 扣除金额超过剩余配额
        with pytest.raises(ValueError):
            quota.deduct_quota(Decimal('100.000000'))

    def test_check_and_create_alerts(self):
        quota = UserQuotaFactory(
            total_quota=Decimal('100.000000'),
            used_quota=Decimal('95.000000')  # 95%使用率
        )
        
        # 测试配额超限警告
        quota.check_and_create_alerts()
        assert QuotaAlert.objects.filter(
            quota=quota,
            alert_type='quota_exceeded'
        ).exists()

        # 测试即将过期警告
        quota.expires_at = timezone.now() + timezone.timedelta(days=2)
        quota.check_and_create_alerts()
        assert QuotaAlert.objects.filter(
            quota=quota,
            alert_type='expiring_soon'
        ).exists()

        # 测试不重复创建警告
        alert_count = QuotaAlert.objects.filter(quota=quota).count()
        quota.check_and_create_alerts()
        assert QuotaAlert.objects.filter(quota=quota).count() == alert_count


class TestQuotaUsageLog:
    def test_create_log(self):
        log = QuotaUsageLogFactory()
        assert log.id is not None
        assert log.quota is not None
        assert log.action in ['deduct', 'refund']
        assert isinstance(log.amount, Decimal)
        assert isinstance(log.remaining, Decimal)
        assert log.request_id is not None


class TestQuotaAlert:
    def test_create_alert(self):
        alert = QuotaAlertFactory()
        assert alert.id is not None
        assert alert.quota is not None
        assert alert.alert_type in ['quota_exceeded', 'expiring_soon']
        assert alert.is_read is False
        assert alert.is_resolved is False
        assert alert.resolved_at is None

    def test_mark_as_resolved(self):
        alert = QuotaAlertFactory()
        alert.mark_as_resolved()
        assert alert.is_resolved is True
        assert alert.resolved_at is not None
