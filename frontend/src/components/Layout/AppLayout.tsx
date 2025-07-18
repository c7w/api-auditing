import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  BellOutlined,
  ApiOutlined,
  RobotOutlined,
  GroupOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface MenuItemType {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  requireAdmin?: boolean;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // 菜单项配置
  const menuItems: MenuItemType[] = [
    {
      key: '/dashboard',
      label: '仪表盘',
      icon: <DashboardOutlined />,
      path: '/dashboard',
    },
    {
      key: '/users',
      label: '用户管理',
      icon: <UserOutlined />,
      path: '/users',
      requireAdmin: true,
    },
    {
      key: '/apis',
      label: 'API管理',
      icon: <ApiOutlined />,
      path: '/apis',
      requireAdmin: true,
    },
    {
      key: '/models',
      label: '模型管理',
      icon: <RobotOutlined />,
      path: '/models',
      requireAdmin: true,
    },
    {
      key: '/model-groups',
      label: '模型组管理',
      icon: <GroupOutlined />,
      path: '/model-groups',
      requireAdmin: true,
    },
    {
      key: '/quotas',
      label: '配额管理',
      icon: <CreditCardOutlined />,
      path: '/quotas',
      requireAdmin: true,
    },
    {
      key: '/chat-records',
      label: '聊天记录',
      icon: <MessageOutlined />,
      path: '/chat-records',
      requireAdmin: true,
    },
  ];

  // 根据用户权限过滤菜单项
  const filteredMenuItems = menuItems.filter(item => {
    if (item.requireAdmin && !user?.is_super_admin) {
      return false;
    }
    return true;
  });

  // 转换为 Ant Design Menu 需要的格式
  const menuConfig: MenuProps['items'] = filteredMenuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: <Link to={item.path}>{item.label}</Link>,
  }));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link to="/profile">个人资料</Link>,
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div style={{ 
          height: 32, 
          margin: 16, 
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          textAlign: 'center',
          transition: 'all 0.2s'
        }}>
          {collapsed ? 'API' : 'API 审计系统'}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuConfig}
        />
      </Sider>

      {/* 主布局 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        {/* 顶部栏 */}
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </Space>

          <Space>
            <Button 
              type="text" 
              icon={<BellOutlined />}
              style={{ fontSize: '16px' }}
            />
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name || user?.username}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content style={{ 
          margin: '16px',
          padding: '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px - 32px)',
          overflow: 'initial'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}; 