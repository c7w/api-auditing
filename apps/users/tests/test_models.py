import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from apps.users.factories import UserFactory

pytestmark = pytest.mark.django_db

User = get_user_model()

class TestUser:
    def test_create_user(self):
        user = UserFactory()
        assert user.id is not None
        assert user.email is not None
        assert user.name is not None
        assert user.is_active is True
        assert user.is_super_admin is False

    def test_create_superadmin(self):
        user = UserFactory(is_super_admin=True)
        assert user.is_super_admin is True

    def test_user_str(self):
        user = UserFactory(name='测试用户')
        assert str(user) == '测试用户'

    def test_email_unique(self):
        user1 = UserFactory()
        with pytest.raises(IntegrityError):
            UserFactory(email=user1.email)

    def test_username_unique(self):
        user1 = UserFactory()
        with pytest.raises(IntegrityError):
            UserFactory(username=user1.username)

    def test_password_hashing(self):
        raw_password = 'testpassword123'
        user = UserFactory(password=raw_password)
        assert user.check_password(raw_password) is True
        assert user.check_password('wrongpassword') is False

    def test_set_password(self):
        user = UserFactory()
        new_password = 'newpassword123'
        user.set_password(new_password)
        user.save()
        assert user.check_password(new_password) is True

    def test_user_permissions(self):
        normal_user = UserFactory()
        super_admin = UserFactory(is_super_admin=True)

        assert normal_user.has_perm('users.add_user') is False
        assert super_admin.has_perm('users.add_user') is True

        assert normal_user.has_perm('users.change_user') is False
        assert super_admin.has_perm('users.change_user') is True

        assert normal_user.has_perm('users.delete_user') is False
        assert super_admin.has_perm('users.delete_user') is True

    def test_user_quotas(self):
        user = UserFactory()
        assert user.quotas.count() == 0

        # 创建配额
        from apps.quotas.factories import UserQuotaFactory
        quota = UserQuotaFactory(user=user)
        assert user.quotas.count() == 1
        assert user.quotas.first() == quota
