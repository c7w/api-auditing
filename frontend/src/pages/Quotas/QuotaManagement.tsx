import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  Tag,
  Progress,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  KeyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { UserQuota, User, ModelGroup } from '@/types';
import { QuotaService, UserService, ModelGroupService } from '@/services';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

export const QuotaManagement: React.FC = () => {
  const [quotas, setQuotas] = useState<UserQuota[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterUserId, setFilterUserId] = useState<number | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingQuota, setEditingQuota] = useState<UserQuota | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<UserQuota | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadQuotas();
    loadUsers();
    loadModelGroups();
  }, [pagination.current, pagination.pageSize, searchText, filterUserId]);

  const loadQuotas = async () => {
    setLoading(true);
    try {
      const response = await QuotaService.getQuotas({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
      });
      setQuotas(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      message.error('加载配额列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers({ page_size: 1000 });
      setUsers(response.results);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadModelGroups = async () => {
    try {
      const response = await ModelGroupService.getModelGroups({ page_size: 1000 });
      setModelGroups(response.results);
    } catch (error) {
      console.error('Failed to load model groups:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleUserFilter = (userId: number | undefined) => {
    setFilterUserId(userId);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const handleCreateQuota = () => {
    setEditingQuota(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditQuota = (quota: UserQuota) => {
    setEditingQuota(quota);
    form.setFieldsValue({
      name: quota.name,
      description: quota.description,
      user: quota.user,
      model_group: quota.model_group,
      total_quota: parseFloat(quota.total_quota),
      rate_limit_per_minute: quota.rate_limit_per_minute || 60,
      rate_limit_per_hour: quota.rate_limit_per_hour || 3600,
      rate_limit_per_day: quota.rate_limit_per_day || 86400,
      is_active: quota.is_active,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换数据格式
      const quotaData = {
        ...values,
        total_quota: values.total_quota.toString(),
      };

      if (editingQuota) {
        // 更新配额
        await QuotaService.updateQuota(editingQuota.id, quotaData);
        message.success('配额更新成功');
      } else {
        // 创建配额
        await QuotaService.createQuota(quotaData);
        message.success('配额创建成功');
      }
      
      loadQuotas();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteQuota = async (id: number) => {
    try {
      await QuotaService.deleteQuota(id);
      message.success('配额删除成功');
      loadQuotas();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleResetApiKey = async (quota: UserQuota) => {
    try {
      await QuotaService.resetApiKey(quota.id);
      message.success('API密钥重置成功');
      loadQuotas();
    } catch (error) {
      message.error('重置API密钥失败');
    }
  };

  const handleViewDetails = (quota: UserQuota) => {
    setSelectedQuota(quota);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '配额名称',
      key: 'quota_info',
      render: (_: any, record: UserQuota) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user_info',
      render: (_: any, record: UserQuota) => (
        <div>
          <div>{record.user_name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.user_email}
          </Text>
        </div>
      ),
    },
    {
      title: '模型组',
      dataIndex: 'model_group_name',
      key: 'model_group_name',
    },
    {
      title: 'API Key',
      dataIndex: 'masked_api_key',
      key: 'masked_api_key',
      render: (text: string) => <code style={{ fontSize: '12px' }}>{text}</code>,
    },
    {
      title: '配额使用',
      key: 'quota_usage',
      render: (_: any, record: UserQuota) => (
        <div style={{ width: '150px' }}>
          <Progress 
            percent={record.usage_percentage} 
            size="small"
            status={record.usage_percentage > 90 ? 'exception' : 
                   record.usage_percentage > 80 ? 'active' : 'normal'}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            ${record.used_quota} / ${record.total_quota}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: UserQuota) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? '激活' : '未激活'}
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
      width: 180,
      render: (_: any, record: UserQuota) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="编辑配额">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditQuota(record)}
            />
          </Tooltip>
          
          <Tooltip title="重置API Key">
            <Popconfirm
              title="确定要重置此配额的API Key吗？"
              onConfirm={() => handleResetApiKey(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" icon={<KeyOutlined />} />
            </Popconfirm>
          </Tooltip>
          
          <Tooltip title="删除配额">
            <Popconfirm
              title={`确定要删除用户 ${record.user_name} 的 ${record.model_group_name} 配额吗？`}
              onConfirm={() => handleDeleteQuota(record.id)}
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

  // 统计数据
  const stats = {
    totalQuotas: quotas.length,
    activeQuotas: quotas.filter(q => q.is_active).length,
    totalCost: quotas.reduce((sum, q) => sum + parseFloat(q.used_quota), 0),
    avgUsage: quotas.length > 0 ? 
      quotas.reduce((sum, q) => sum + q.usage_percentage, 0) / quotas.length : 0,
  };

  return (
    <div>
      <PageHeader
        title="配额管理"
        subtitle="管理用户API配额和使用情况（无限期配额，用完需管理员手动充值）"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadQuotas}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateQuota}
            >
              新建配额
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总配额数"
              value={stats.totalQuotas}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="激活配额"
              value={stats.activeQuotas}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总消费"
              value={stats.totalCost}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均使用率"
              value={stats.avgUsage}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats.avgUsage > 80 ? '#ff4d4f' : '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {/* 过滤器 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索用户或模型组"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择用户"
              allowClear
              style={{ width: '100%' }}
              onChange={handleUserFilter}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={quotas}
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

      {/* 创建/编辑配额模态框 */}
      <Modal
        title={editingQuota ? '编辑配额' : '新建配额'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="配额名称"
            rules={[{ required: true, message: '请输入配额名称' }]}
          >
            <Input placeholder="请输入配额名称，如：基础套餐、高级开发包等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="配额描述"
          >
            <Input.TextArea 
              placeholder="请输入配额描述，可选填"
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user"
                label="用户"
                rules={[{ required: true, message: '请选择用户' }]}
              >
                <Select
                  placeholder="选择用户"
                  showSearch
                  disabled={!!editingQuota}
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model_group"
                label="模型组"
                rules={[{ required: true, message: '请选择模型组' }]}
              >
                <Select
                  placeholder="选择模型组"
                  showSearch
                  disabled={!!editingQuota}
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {modelGroups.map(group => (
                    <Option key={group.id} value={group.id}>
                      {group.name} (${group.default_quota} 默认配额)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="total_quota"
            label="总配额额度 ($)"
            rules={[{ required: true, message: '请输入配额额度' }]}
          >
            <InputNumber
              placeholder="配额额度"
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rate_limit_per_minute"
                label="每分钟限制"
                initialValue={60}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rate_limit_per_hour"
                label="每小时限制"
                initialValue={3600}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rate_limit_per_day"
                label="每日限制"
                initialValue={86400}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="激活" unCheckedChildren="未激活" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 配额详情模态框 */}
      <Modal
        title="配额详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedQuota && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="基本信息" size="small">
                  <p><strong>用户:</strong> {selectedQuota.user_name} ({selectedQuota.user_email})</p>
                  <p><strong>模型组:</strong> {selectedQuota.model_group_name}</p>
                  <p><strong>API Key:</strong> <code>{selectedQuota.masked_api_key}</code></p>
                  <p><strong>创建时间:</strong> {new Date(selectedQuota.created_at).toLocaleString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="配额信息" size="small">
                  <p><strong>总配额:</strong> ${selectedQuota.total_quota}</p>
                  <p><strong>已使用:</strong> ${selectedQuota.used_quota}</p>
                  <p><strong>剩余配额:</strong> ${selectedQuota.remaining_quota}</p>
                  <p><strong>使用率:</strong> {selectedQuota.usage_percentage}%</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="速率限制" size="small">
                  <p><strong>每分钟:</strong> {selectedQuota.rate_limit_per_minute || '无限制'} 次</p>
                  <p><strong>每小时:</strong> {selectedQuota.rate_limit_per_hour || '无限制'} 次</p>
                  <p><strong>每日:</strong> {selectedQuota.rate_limit_per_day || '无限制'} 次</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="状态信息" size="small">
                  <p><strong>状态:</strong> 
                    <Tag color={selectedQuota.is_active ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {selectedQuota.is_active ? '激活' : '未激活'}
                    </Tag>
                  </p>
                  <p><strong>配额类型:</strong> 无限期配额（用完需手动充值）</p>
                  <p><strong>更新时间:</strong> {new Date(selectedQuota.updated_at).toLocaleString()}</p>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}; 