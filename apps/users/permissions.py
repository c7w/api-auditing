from rest_framework.permissions import BasePermission


class IsSuperAdminUser(BasePermission):
    """
    只允许超级管理员用户访问
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_super_admin
        )


class IsOwnerOrSuperAdmin(BasePermission):
    """
    只允许对象所有者或超级管理员访问
    """
    
    def has_object_permission(self, request, view, obj):
        # 超级管理员可以访问所有对象
        if request.user.is_super_admin:
            return True
        
        # 检查是否为对象所有者
        return obj.user == request.user


class IsActiveUser(BasePermission):
    """
    只允许激活的用户访问
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active
        ) 