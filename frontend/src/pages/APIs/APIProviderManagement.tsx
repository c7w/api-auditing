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
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { APIProvider } from '@/types';
import { APIProviderService } from '@/services';

const { Search } = Input;
const { TextArea } = Input;
const { Text } = Typography;

export const APIProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null);
  const [testing, setTesting] = useState<{ [key: number]: boolean }>({});
  const [syncing, setSyncing] = useState<{ [key: number]: boolean }>({});

  const [form] = Form.useForm();

  useEffect(() => {
    loadProviders();
  }, [pagination.current, pagination.pageSize, searchText]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      console.log('开始加载API提供商列表...');
      const response = await APIProviderService.getProviders({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
      });
      console.log('API提供商列表响应:', response);
      setProviders(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      console.error('加载API提供商列表失败:', error);
      message.error(`加载API提供商列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

  const handleCreateProvider = () => {
    setEditingProvider(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditProvider = (provider: APIProvider) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      name: provider.name,
      description: provider.description,
      base_url: provider.base_url,
      api_key: provider.api_key,
      is_active: provider.is_active,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingProvider) {
        // 更新API提供商
        const updatedProvider = await APIProviderService.updateProvider(editingProvider.id, values);
        setProviders(prev => prev.map(provider => 
          provider.id === editingProvider.id ? updatedProvider : provider
        ));
        message.success('API提供商更新成功');
      } else {
        // 创建API提供商
        await APIProviderService.createProvider(values);
        message.success('API提供商创建成功');
        loadProviders(); // 重新加载列表
      }
      
      setIsModalVisible(false);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteProvider = async (id: number) => {
    try {
      await APIProviderService.deleteProvider(id);
      message.success('API提供商删除成功');
      loadProviders();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleTestProvider = async (provider: APIProvider) => {
    setTesting(prev => ({ ...prev, [provider.id]: true }));
    try {
      console.log('开始测试API提供商连接:', provider.id);
      const result = await APIProviderService.testProvider(provider.id);
      console.log('测试连接结果:', result);
      if (result.success) {
        message.success(`连接测试成功: ${result.message}`);
      } else {
        message.error(`连接测试失败: ${result.message}`);
      }
    } catch (error: any) {
      console.error('连接测试异常:', error);
      let errorMessage = '连接测试失败';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    } finally {
      setTesting(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  const handleSyncModels = async (provider: APIProvider) => {
    setSyncing(prev => ({ ...prev, [provider.id]: true }));
    try {
      const result = await APIProviderService.syncModels(provider.id);
      if (result.success) {
        message.success(`模型同步成功: 同步了 ${result.models_count} 个模型`);
      } else {
        message.error(`模型同步失败: ${result.message}`);
      }
    } catch (error) {
      message.error('模型同步失败');
    } finally {
      setSyncing(prev => ({ ...prev, [provider.id]: false }));
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
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'API地址',
      dataIndex: 'base_url',
      key: 'base_url',
      render: (url: string) => (
        <Text code style={{ fontSize: '12px' }}>{url}</Text>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      render: (key: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {key ? `${key.substring(0, 10)}...` : ''}
        </Text>
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
      width: 250,
      render: (_: any, record: APIProvider) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditProvider(record)}
            />
          </Tooltip>
          
          <Tooltip title="测试连接">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              loading={testing[record.id]}
              onClick={() => handleTestProvider(record)}
            />
          </Tooltip>
          
          <Tooltip title="同步模型">
            <Button
              type="text"
              icon={<SyncOutlined />}
              loading={syncing[record.id]}
              onClick={() => handleSyncModels(record)}
            />
          </Tooltip>
          
          <Tooltip title="删除">
            <Popconfirm
              title={`确定要删除API提供商 ${record.name} 吗？`}
              onConfirm={() => handleDeleteProvider(record.id)}
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
        title="API提供商管理"
        subtitle="管理第三方AI API提供商"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadProviders}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateProvider}
            >
              新建提供商
            </Button>
          </Space>
        }
      />

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索提供商名称或描述"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={columns}
          dataSource={providers}
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

      {/* 创建/编辑API提供商模态框 */}
      <Modal
        title={editingProvider ? '编辑API提供商' : '新建API提供商'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="提供商名称"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="base_url"
            label="API基础地址"
            rules={[
              { required: true, message: '请输入API基础地址' },
              { type: 'url', message: '请输入有效的URL地址' },
            ]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="api_key"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="激活" unCheckedChildren="未激活" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 