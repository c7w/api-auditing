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

class TestAuthViews:
    def test_login_success(self, api_client, user):
        url = reverse('login')
        data = {
            'email': user.email,
            'password': 'password123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data
        assert 'user' in response.data

    def test_login_invalid_credentials(self, api_client):
        url = reverse('login')
        data = {
            'email': 'invalid@example.com',
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout(self, api_client, user):
        # 先登录获取token
        login_url = reverse('login')
        login_data = {
            'email': user.email,
            'password': 'password123'
        }
        login_response = api_client.post(login_url, login_data)
        refresh_token = login_response.data['refresh_token']

        # 测试登出
        url = reverse('logout')
        data = {'refresh_token': refresh_token}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK

    def test_change_password(self, api_client, user):
        # 先登录
        api_client.force_authenticate(user=user)
        
        url = reverse('change_password')
        data = {
            'old_password': 'password123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK

        # 验证新密码可以登录
        login_url = reverse('login')
        login_data = {
            'email': user.email,
            'password': 'newpassword123'
        }
        login_response = api_client.post(login_url, login_data)
        assert login_response.status_code == status.HTTP_200_OK

    def test_change_password_wrong_old_password(self, api_client, user):
        api_client.force_authenticate(user=user)
        
        url = reverse('change_password')
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_mismatch_confirm(self, api_client, user):
        api_client.force_authenticate(user=user)
        
        url = reverse('change_password')
        data = {
            'old_password': 'password123',
            'new_password': 'newpassword123',
            'new_password_confirm': 'differentpassword'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST 