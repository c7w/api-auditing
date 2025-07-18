import factory
from decimal import Decimal
from django.utils import timezone
from faker import Faker
from .models import UserQuota, QuotaUsageLog, QuotaAlert
from apps.users.factories import UserFactory
from apps.groups.models import ModelGroup

fake = Faker('zh_CN')

class ModelGroupFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ModelGroup

    name = factory.LazyFunction(lambda: fake.word())
    description = factory.LazyFunction(lambda: fake.text())
    is_active = True

class UserQuotaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserQuota

    user = factory.SubFactory(UserFactory)
    model_group = factory.SubFactory(ModelGroupFactory)
    total_quota = factory.LazyFunction(lambda: Decimal(str(fake.random_int(min=100, max=1000))))
    used_quota = factory.LazyFunction(lambda: Decimal('0.000000'))
    period_type = 'monthly'
    period_start = factory.LazyFunction(lambda: timezone.now())
    expires_at = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=30))
    rate_limit_per_minute = 60
    rate_limit_per_hour = 3600
    rate_limit_per_day = 86400
    is_active = True
    auto_renew = False

class QuotaUsageLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = QuotaUsageLog

    quota = factory.SubFactory(UserQuotaFactory)
    action = 'deduct'
    amount = factory.LazyFunction(lambda: Decimal(str(fake.random_int(min=1, max=100))))
    remaining = factory.LazyFunction(lambda: Decimal(str(fake.random_int(min=0, max=1000))))
    request_id = factory.LazyFunction(lambda: fake.uuid4())
    notes = factory.LazyFunction(lambda: fake.text())

class QuotaAlertFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = QuotaAlert

    quota = factory.SubFactory(UserQuotaFactory)
    alert_type = factory.LazyFunction(lambda: fake.random_element(['quota_exceeded', 'expiring_soon']))
    message = factory.LazyFunction(lambda: fake.text())
    is_read = False
    is_resolved = False 