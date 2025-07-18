import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.quotas.factories import UserQuotaFactory
from apps.ai_models.models import AIModel
from apps.apis.models import APIProvider

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_quota():
    quota = UserQuotaFactory()
    # 创建API提供商和模型
    provider = APIProvider.objects.create(
        name='OpenAI',
        base_url='https://api.openai.com/v1',
        api_key='sk-test'
    )
    model = AIModel.objects.create(
        provider=provider,
        name='gpt-4o',
        display_name='GPT-4 Optimized',
        input_price_per_1k='0.010000',
        output_price_per_1k='0.030000'
    )
    quota.model_group.ai_models.add(model)
    return quota

class TestOpenAICompatibleViews:
    def test_chat_completion_success(self, api_client, user_quota, mocker):
        # Mock外部API调用
        mock_response = mocker.Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 'chatcmpl-123',
            'object': 'chat.completion',
            'created': 1677858242,
            'model': 'gpt-4o',
            'usage': {
                'prompt_tokens': 10,
                'completion_tokens': 20,
                'total_tokens': 30
            },
            'choices': [
                {
                    'message': {
                        'role': 'assistant',
                        'content': 'This is a test response.'
                    },
                    'finish_reason': 'stop',
                    'index': 0
                }
            ]
        }
        mocker.patch('requests.post', return_value=mock_response)

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_quota.api_key}')
        url = reverse('chat_completions')
        data = {
            'model': 'gpt-4o',
            'messages': [
                {'role': 'user', 'content': 'Hello!'}
            ]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['choices'][0]['message']['content'] == 'This is a test response.'

    def test_chat_completion_invalid_model(self, api_client, user_quota):
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_quota.api_key}')
        url = reverse('chat_completions')
        data = {
            'model': 'invalid-model',
            'messages': [
                {'role': 'user', 'content': 'Hello!'}
            ]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_chat_completion_quota_exceeded(self, api_client, user_quota):
        # 设置已用完的配额
        user_quota.used_quota = user_quota.total_quota
        user_quota.save()

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_quota.api_key}')
        url = reverse('chat_completions')
        data = {
            'model': 'gpt-4o',
            'messages': [
                {'role': 'user', 'content': 'Hello!'}
            ]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_list_models(self, api_client, user_quota):
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_quota.api_key}')
        url = reverse('models_list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['object'] == 'list'
        assert len(response.data['data']) > 0
        assert response.data['data'][0]['id'] == 'gpt-4o'

    def test_get_usage(self, api_client, user_quota):
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_quota.api_key}')
        url = reverse('usage')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'quota' in response.data
        assert 'recent_requests' in response.data
        assert 'recent_cost' in response.data
        assert response.data['quota']['total_quota'] == float(user_quota.total_quota)

    def test_unauthorized_access(self, api_client):
        url = reverse('chat_completions')
        data = {
            'model': 'gpt-4o',
            'messages': [
                {'role': 'user', 'content': 'Hello!'}
            ]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_api_key(self, api_client):
        api_client.credentials(HTTP_AUTHORIZATION='Bearer invalid-key')
        url = reverse('chat_completions')
        data = {
            'model': 'gpt-4o',
            'messages': [
                {'role': 'user', 'content': 'Hello!'}
            ]
        }
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED 