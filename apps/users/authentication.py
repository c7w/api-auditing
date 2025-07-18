from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class APIKeyAuthentication(BaseAuthentication):
    """
    API Key认证
    客户端应该在HTTP Authorization头中传递token:
    Authorization: Bearer sk-audit-{32位字符}
    """
    keyword = 'Bearer'
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
            
        try:
            keyword, token = auth_header.split()
        except ValueError:
            return None
            
        if keyword.lower() != self.keyword.lower():
            return None
            
        return self.authenticate_credentials(token, request)
    
    def authenticate_credentials(self, key, request):
        from apps.quotas.models import UserQuota
        
        try:
            quota = UserQuota.objects.select_related('user', 'model_group').get(
                api_key=key, 
                is_active=True,
                user__is_active=True
            )
        except UserQuota.DoesNotExist:
            raise AuthenticationFailed(_('Invalid API key'))
        
        # 将当前配额信息附加到request上，方便后续使用
        request.current_quota = quota
        
        return (quota.user, quota)
    
    def authenticate_header(self, request):
        return f'{self.keyword} realm="api"' 