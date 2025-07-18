import factory
from django.contrib.auth import get_user_model
from faker import Faker

fake = Faker('zh_CN')

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.LazyFunction(lambda: fake.user_name())
    email = factory.LazyFunction(lambda: fake.email())
    name = factory.LazyFunction(lambda: fake.name())
    password = factory.PostGenerationMethodCall('set_password', 'password123')
    is_super_admin = False
    is_active = True 