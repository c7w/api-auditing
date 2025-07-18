import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Descriptions,
  Tabs,
  Tag,
  message,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores';
import { AuthService } from '@/services';
import { PageHeader } from '@/components';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }, [user, form]);

  // 修改个人信息
  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 调用API更新用户信息
      updateUser({ ...user!, ...values });
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('新密码与确认密码不匹配');
      return;
    }

    try {
      await AuthService.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
      
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Card title="个人信息">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">
              {user?.username}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {user?.email}
            </Descriptions.Item>
            <Descriptions.Item label="姓名">
              {user?.name}
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              {user?.is_super_admin ? (
                <Tag color="red">超级管理员</Tag>
              ) : (
                <Tag color="blue">普通用户</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {user?.is_active ? (
                <Tag color="green">激活</Tag>
              ) : (
                <Tag color="gray">未激活</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {user?.date_joined ? new Date(user.date_joined).toLocaleString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user?.last_login ? new Date(user.last_login).toLocaleString() : '从未登录'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'edit',
      label: '编辑资料',
      children: (
        <Card title="编辑个人资料">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{
              username: user?.username,
              email: user?.email,
              first_name: user?.first_name,
              last_name: user?.last_name,
            }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              name="first_name"
              label="名"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="姓"
            >
              <Input />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Card title="修改密码">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="old_password"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="new_password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item
              name="new_password_confirm"
              label="确认新密码"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="个人资料"
        subtitle="管理您的个人信息和账户设置"
      />
      
      <Tabs items={tabItems} />
    </div>
  );
}; 