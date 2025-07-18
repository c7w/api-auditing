import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.users.factories import UserFactory

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return UserFactory()

class TestProfileViews:
    def test_get_profile(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('user_profile')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == user.id
        assert response.data['email'] == user.email
        assert response.data['name'] == user.name

    def test_update_profile(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('user_profile')
        data = {
            'username': user.username,
            'name': '新名字',
            'email': 'newemail@example.com'
        }
        response = api_client.put(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == '新名字'
        assert response.data['email'] == 'newemail@example.com'

    def test_get_profile_unauthorized(self, api_client):
        url = reverse('user_profile')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_user_quotas(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('user_quotas')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'user' in response.data
        assert 'quotas' in response.data
        assert response.data['user'] == user.name 