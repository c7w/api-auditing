import pytest
from rest_framework.test import APIClient
from apps.users.factories import UserFactory
from apps.quotas.factories import UserQuotaFactory, QuotaUsageLogFactory, QuotaAlertFactory
from apps.ai_models.models import AIModel
from apps.apis.models import APIProvider


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def admin_user():
    return UserFactory(is_super_admin=True)


@pytest.fixture
def normal_user():
    return UserFactory()


@pytest.fixture
def user_quota(normal_user):
    return UserQuotaFactory(user=normal_user)


@pytest.fixture
def openai_model():
    provider = APIProvider.objects.create(
        name='OpenAI',
        base_url='https://api.openai.com/v1',
        api_key='sk-test'
    )
    return AIModel.objects.create(
        provider=provider,
        name='gpt-4o',
        display_name='GPT-4 Optimized',
        input_price_per_1k='0.010000',
        output_price_per_1k='0.030000'
    )


@pytest.fixture
def user_quota_with_model(user_quota, openai_model):
    user_quota.model_group.ai_models.add(openai_model)
    return user_quota 