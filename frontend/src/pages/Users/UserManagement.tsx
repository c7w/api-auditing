import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Tag,
  message,
  Popconfirm,
  Switch,
  Card,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { User } from '@/types';
import { UserService } from '@/services';
import { handleFormError } from '@/utils/errorHandler';

const { Search } = Input;
const { Text } = Typography;

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await UserService.getUsers({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
      });
      setUsers(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const getUserDisplayName = (user: User) => {
    return user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username;
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.setFieldsValue({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      is_active: true,
      is_staff: false,
      is_superuser: false,
    });
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // 更新用户
        const updatedUser = await UserService.updateUser(editingUser.id, values);
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ));
        message.success('用户更新成功');
      } else {
        // 创建用户
        await UserService.createUser(values);
        message.success('用户创建成功');
        loadUsers(); // 重新加载列表
      }
      
      setIsModalVisible(false);
    } catch (error: any) {
      handleFormError(error, form, editingUser ? '用户更新失败' : '用户创建失败');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await UserService.deleteUser(id);
      message.success('用户删除成功');
      loadUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleResetPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (editingUser) {
        await UserService.resetUserPassword(editingUser.id, values.new_password);
        message.success('密码重置成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error: any) {
      handleFormError(error, passwordForm, '密码重置失败');
    }
  };

  const handleResetAllKeys = async (userId: number) => {
    try {
      const result = await UserService.resetUserAllKeys(userId);
      message.success(`成功重置用户 ${result.user_name} 的所有API Key`);
      Modal.info({
        title: 'API Key重置结果',
        content: (
          <div>
            <p>用户: {result.user_name} ({result.user_email})</p>
            <p>共重置 {result.updated_keys.length} 个API Key</p>
            <div style={{ marginTop: 16 }}>
              {result.updated_keys.map((key, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <Text strong>{key.model_group}:</Text>
                  <br />
                  <code style={{ fontSize: '12px' }}>{key.new_key}</code>
                </div>
              ))}
            </div>
          </div>
        ),
        width: 600,
      });
    } catch (error) {
      message.error('重置API Key失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: User) => (
        <div>
          <div style={{ fontWeight: 500 }}>{username}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {getUserDisplayName(record)}
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '配额数',
      dataIndex: 'quota_count',
      key: 'quota_count',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'is_super_admin',
      key: 'is_super_admin',
      render: (isAdmin: boolean) => (
        <Tag color={isAdmin ? 'red' : 'blue'}>
          {isAdmin ? '超级管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          <Tooltip title="编辑用户">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          
          <Tooltip title="重置密码">
            <Button
              type="text"
              icon={<LockOutlined />}
              onClick={() => {
                setEditingUser(record);
                setPasswordModalVisible(true);
              }}
            />
          </Tooltip>
          
          <Tooltip title="重置所有API Key">
            <Popconfirm
              title={`确定要重置用户 ${getUserDisplayName(record)} 的所有API Key吗？`}
              onConfirm={() => handleResetAllKeys(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" icon={<ReloadOutlined />} />
            </Popconfirm>
          </Tooltip>
          
          <Tooltip title="删除用户">
            <Popconfirm
              title={`确定要删除用户 ${getUserDisplayName(record)} 吗？`}
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="用户管理"
        subtitle="管理系统用户账户"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadUsers}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              新建用户
            </Button>
          </Space>
        }
      />

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索用户名或邮箱"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 创建/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度至少6位' },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="password_confirm"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item name="is_super_admin" valuePropName="checked">
            <Switch checkedChildren="超级管理员" unCheckedChildren="普通用户" />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="激活" unCheckedChildren="未激活" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码模态框 */}
      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onOk={handleResetPassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm_password"
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
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 