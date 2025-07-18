import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.quotas.factories import UserQuotaFactory, QuotaUsageLogFactory, QuotaAlertFactory
from apps.users.factories import UserFactory

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user():
    return UserFactory(is_super_admin=True)

@pytest.fixture
def normal_user():
    return UserFactory()

@pytest.fixture
def user_quota(normal_user):
    return UserQuotaFactory(user=normal_user)

class TestQuotaViews:
    def test_list_quotas(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        UserQuotaFactory.create_batch(3)  # 创建3个配额记录
        
        url = reverse('admin-quotas-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_create_quota(self, api_client, admin_user, normal_user):
        api_client.force_authenticate(user=admin_user)
        model_group = UserQuotaFactory().model_group  # 使用工厂创建的模型组
        
        url = reverse('admin-quotas-list')
        data = {
            'user': normal_user.id,
            'model_group': model_group.id,
            'total_quota': '100.000000',
            'period_type': 'monthly',
            'rate_limit_per_minute': 60,
            'rate_limit_per_hour': 3600,
            'rate_limit_per_day': 86400,
            'is_active': True,
            'auto_renew': False
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user'] == normal_user.id
        assert response.data['total_quota'] == '100.000000'

    def test_get_quota_detail(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-detail', args=[user_quota.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == user_quota.id
        assert response.data['user'] == user_quota.user.id

    def test_update_quota(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-detail', args=[user_quota.id])
        data = {
            'user': user_quota.user.id,
            'model_group': user_quota.model_group.id,
            'total_quota': '200.000000',
            'period_type': 'weekly',
            'rate_limit_per_minute': 60,
            'rate_limit_per_hour': 3600,
            'rate_limit_per_day': 86400,
            'is_active': True,
            'auto_renew': False
        }
        response = api_client.put(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_quota'] == '200.000000'
        assert response.data['period_type'] == 'weekly'

    def test_delete_quota(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-detail', args=[user_quota.id])
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_reset_api_key(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-reset-api-key', args=[user_quota.id])
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'api_key' in response.data
        assert 'masked_api_key' in response.data

    def test_get_quota_requests(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-requests', args=[user_quota.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'quota_info' in response.data
        assert 'requests' in response.data
        assert 'pagination' in response.data

    def test_get_quota_statistics(self, api_client, admin_user, user_quota):
        api_client.force_authenticate(user=admin_user)
        
        url = reverse('admin-quotas-statistics', args=[user_quota.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'total_requests' in response.data['statistics']
        assert 'total_cost' in response.data['statistics']
        assert 'total_tokens' in response.data['statistics']

    def test_unauthorized_access(self, api_client, normal_user):
        api_client.force_authenticate(user=normal_user)
        
        url = reverse('admin-quotas-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

class TestQuotaAlertViews:
    def test_list_alerts(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        QuotaAlertFactory.create_batch(3)
        
        url = reverse('admin-quota-alerts-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_mark_alert_resolved(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        alert = QuotaAlertFactory()
        
        url = reverse('admin-quota-alerts-mark-resolved', args=[alert.id])
        response = api_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        alert.refresh_from_db()
        assert alert.is_resolved is True 