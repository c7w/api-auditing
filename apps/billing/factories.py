import factory
from decimal import Decimal
from django.utils import timezone
from faker import Faker
from .models import APIRequest
from apps.users.factories import UserFactory
from apps.ai_models.models import AIModel
from apps.apis.models import APIProvider

fake = Faker('zh_CN')

class APIRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = APIRequest

    user = factory.SubFactory(UserFactory)
    model = factory.LazyAttribute(lambda _: AIModel.objects.first() or AIModel.objects.create(
        provider=APIProvider.objects.create(
            name='Test Provider',
            base_url='https://api.test.com/v1',
            api_key='test-key'
        ),
        name='test-model',
        display_name='Test Model',
        input_price_per_1k=Decimal('0.010000'),
        output_price_per_1k=Decimal('0.030000')
    ))
    model_group = factory.SelfAttribute('user.quotas.first.model_group')
    method = 'POST'
    endpoint = '/v1/chat/completions'
    request_data = factory.LazyFunction(lambda: {'messages': [{'role': 'user', 'content': fake.text()}]})
    response_data = factory.LazyFunction(lambda: {'choices': [{'message': {'content': fake.text()}}]})
    input_tokens = factory.LazyFunction(lambda: fake.random_int(min=10, max=1000))
    output_tokens = factory.LazyFunction(lambda: fake.random_int(min=10, max=1000))
    total_tokens = factory.LazyAttribute(lambda o: o.input_tokens + o.output_tokens)
    input_cost = factory.LazyAttribute(lambda o: (Decimal(o.input_tokens) / Decimal('1000')) * o.model.input_price_per_1k)
    output_cost = factory.LazyAttribute(lambda o: (Decimal(o.output_tokens) / Decimal('1000')) * o.model.output_price_per_1k)
    total_cost = factory.LazyAttribute(lambda o: o.input_cost + o.output_cost)
    status_code = 200
    duration_ms = factory.LazyFunction(lambda: fake.random_int(min=100, max=5000))
    ip_address = factory.LazyFunction(lambda: fake.ipv4())
    user_agent = factory.LazyFunction(lambda: fake.user_agent())
    created_at = factory.LazyFunction(lambda: timezone.now()) 