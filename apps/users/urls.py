from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/users', views.UserManagementViewSet, basename='admin-users')

urlpatterns = [
    # 认证相关
    path('auth/login/', views.AuthViewSet.login, name='login'),
    path('auth/logout/', views.AuthViewSet.logout, name='logout'),
    path('auth/change-password/', views.AuthViewSet.change_password, name='change_password'),
    
    # 用户资料和配额
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('quotas/', views.AuthViewSet.get_user_quotas, name='user_quotas'),
    
    # 管理员用户管理
    path('admin/users/<int:pk>/reset-password/', 
         views.UserManagementViewSet.reset_user_password, 
         name='admin_reset_user_password'),
    
    # ViewSet路由
    path('', include(router.urls)),
] 