from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/quotas', views.UserQuotaViewSet, basename='admin-quotas')
router.register(r'admin/quota-logs', views.UserQuotaLogViewSet, basename='admin-quota-logs')
router.register(r'admin/quota-alerts', views.UserQuotaAlertViewSet, basename='admin-quota-alerts')

urlpatterns = [
    # 重置用户所有API Key
    path('admin/users/<int:user_id>/reset-all-keys/', 
         views.reset_user_all_keys, 
         name='admin_reset_user_all_keys'),
    
    # ViewSet路由
    path('', include(router.urls)),
] 