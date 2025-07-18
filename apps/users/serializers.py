from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    quota_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'quota_count',
            'is_super_admin', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quota_count', 'created_at', 'updated_at']
    
    def get_quota_count(self, obj):
        """获取用户的配额数量"""
        return obj.quotas.filter(is_active=True).count()


class UserCreateSerializer(serializers.ModelSerializer):
    """创建用户序列化器"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'name', 'password', 'password_confirm',
            'is_super_admin', 'is_active'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("密码确认不匹配")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """更新用户序列化器"""
    
    class Meta:
        model = User
        fields = ['username', 'email', 'name', 'is_super_admin', 'is_active']


class PasswordChangeSerializer(serializers.Serializer):
    """修改密码序列化器"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("新密码确认不匹配")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("原密码错误")
        return value


class LoginSerializer(serializers.Serializer):
    """登录序列化器"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    if not user.is_active:
                        raise serializers.ValidationError('用户账户已被禁用')
                    attrs['user'] = user
                    return attrs
                else:
                    raise serializers.ValidationError('邮箱或密码错误')
            except User.DoesNotExist:
                raise serializers.ValidationError('邮箱或密码错误')
        else:
            raise serializers.ValidationError('必须提供邮箱和密码')


class APIKeySerializer(serializers.Serializer):
    """API Key序列化器"""
    api_key = serializers.CharField(read_only=True)
    
    class Meta:
        fields = ['api_key'] 