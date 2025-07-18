import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  message,
  Card,
  Modal,
  Typography,
  Tooltip,
  Row,
  Col,
  Statistic,
  Select,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { APIRequest } from '@/types/api';
import { BillingService, UserService, ModelService } from '@/services';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;

export const ChatRecordsManagement: React.FC = () => {
  const [records, setRecords] = useState<APIRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [selectedModel, setSelectedModel] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 统计数据
  const [statistics, setStatistics] = useState<{
    total_requests: number;
    successful_requests: number;
    success_rate: number;
    total_cost: number;
    total_tokens: number;
    avg_duration_ms: number;
    daily_statistics: Array<{
      date: string;
      requests: number;
      cost: number;
      tokens: number;
    }>;
    message: string;
  } | null>(null);

  // 详情模态框
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<APIRequest | null>(null);

  // 用户和模型列表（用于筛选）
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    loadChatRecords();
    loadStatistics();
    loadUsers();
    loadModels();
  }, [pagination.current, pagination.pageSize, searchText, selectedUser, selectedModel, selectedStatus]);

  const loadChatRecords = async () => {
    setLoading(true);
    try {
      const response = await BillingService.getChatRecords({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        user: selectedUser,
        model: selectedModel,
        status_code: selectedStatus,
      });
      setRecords(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      message.error('加载聊天记录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await BillingService.getChatRecordsStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 设置默认值以避免类型错误
      setStatistics({
        total_requests: 0,
        successful_requests: 0,
        success_rate: 0,
        total_cost: 0,
        total_tokens: 0,
        avg_duration_ms: 0,
        daily_statistics: [],
        message: 'Failed to load statistics'
      });
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers({ page_size: 1000 });
      setUsers(response.results);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadModels = async () => {
    try {
      const response = await ModelService.getModels({ page_size: 1000 });
      setModels(response.results);
    } catch (error) {
      console.error('加载模型列表失败:', error);
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

  const handleViewDetails = (record: APIRequest) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const formatCost = (cost: string | number) => {
    return `$${Number(cost).toFixed(6)}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const columns: ColumnsType<APIRequest> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '用户',
      key: 'user_info',
      width: 120,
      render: (_, record) => (
        <div>
          <Text strong>{record.user_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.user}
          </Text>
        </div>
      ),
    },
    {
      title: '模型',
      key: 'model_info',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.model_display_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.model_name}
          </Text>
        </div>
      ),
    },
    {
      title: 'Token使用',
      key: 'tokens',
      width: 120,
      render: (_, record) => (
        <div>
          <div>总计: <Text strong>{record.total_tokens}</Text></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            输入: {record.input_tokens} | 输出: {record.output_tokens}
          </div>
        </div>
      ),
    },
    {
      title: '成本',
      key: 'cost',
      width: 120,
      render: (_, record) => (
        <div>
          <div>总计: <Text strong>{formatCost(record.total_cost)}</Text></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            输入: {formatCost(record.input_cost)} | 输出: {formatCost(record.output_cost)}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status_code',
      key: 'status_code',
      width: 100,
      render: (status: number, record) => (
        <div>
          <Tag color={status === 200 ? 'green' : 'red'}>{status}</Tag>
          {record.is_successful ? (
            <Tag color="green" style={{ marginTop: 4 }}>成功</Tag>
          ) : (
            <Tag color="red" style={{ marginTop: 4 }}>失败</Tag>
          )}
        </div>
      ),
    },
    {
      title: '请求时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => (
        <div>
          <div>{new Date(date).toLocaleDateString()}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="聊天记录管理"
        subtitle="查看和管理所有用户的AI对话记录"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadChatRecords}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总请求数"
              value={statistics?.total_requests || 0}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总支出"
              value={statistics?.total_cost || 0}
              prefix={<DollarOutlined />}
              precision={6}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `$${Number(value).toFixed(6)}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总Token数"
              value={statistics?.total_tokens || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功率"
              value={statistics?.success_rate || 0}
              suffix="%"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* API使用趋势图表 */}
      {statistics?.daily_statistics && statistics.daily_statistics.length > 0 && (
        <Card title="API使用趋势" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 0' }}>
            {statistics.daily_statistics.map((item, _) => {
              const maxRequests = Math.max(...statistics.daily_statistics.map(d => d.requests));
              const barWidth = maxRequests > 0 ? (item.requests / maxRequests) * 100 : 0;
              
              return (
                <div key={item.date} style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <Text strong>{item.date}</Text>
                    <Text>{item.requests} 次请求</Text>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      backgroundColor: '#1890ff',
                      borderRadius: '10px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '2px'
                  }}>
                    <span>成本: {formatCost(item.cost)}</span>
                    <span>Token: {item.tokens}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        {/* 筛选器 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索用户或模型"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择用户"
              allowClear
              style={{ width: '100%' }}
              onChange={setSelectedUser}
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
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择模型"
              allowClear
              style={{ width: '100%' }}
              onChange={setSelectedModel}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {models.map(model => (
                <Option key={model.id} value={model.id}>
                  {model.display_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="状态码"
              allowClear
              style={{ width: '100%' }}
              onChange={setSelectedStatus}
            >
              <Option value={200}>200 - 成功</Option>
              <Option value={400}>400 - 客户端错误</Option>
              <Option value={401}>401 - 未授权</Option>
              <Option value={403}>403 - 禁止访问</Option>
              <Option value={500}>500 - 服务器错误</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range?.[0]}-${range?.[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="聊天记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="基本信息" size="small">
                  <p><strong>请求ID:</strong> {selectedRecord.request_id}</p>
                  <p><strong>用户:</strong> {selectedRecord.user_name} (ID: {selectedRecord.user})</p>
                  <p><strong>模型:</strong> {selectedRecord.model_display_name}</p>
                  <p><strong>请求方法:</strong> {selectedRecord.method}</p>
                  <p><strong>端点:</strong> {selectedRecord.endpoint}</p>
                  <p><strong>IP地址:</strong> {selectedRecord.ip_address}</p>
                  <p><strong>请求时间:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="使用统计" size="small">
                  <p><strong>状态码:</strong> 
                    <Tag color={selectedRecord.status_code === 200 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {selectedRecord.status_code}
                    </Tag>
                  </p>
                  <p><strong>输入Token:</strong> {selectedRecord.input_tokens}</p>
                  <p><strong>输出Token:</strong> {selectedRecord.output_tokens}</p>
                  <p><strong>总Token:</strong> {selectedRecord.total_tokens}</p>
                  <p><strong>输入成本:</strong> {formatCost(selectedRecord.input_cost)}</p>
                  <p><strong>输出成本:</strong> {formatCost(selectedRecord.output_cost)}</p>
                  <p><strong>总成本:</strong> {formatCost(selectedRecord.total_cost)}</p>
                  <p><strong>请求耗时:</strong> {formatDuration(selectedRecord.duration_ms)}</p>
                </Card>
              </Col>
            </Row>
            
            {selectedRecord.error_type && (
              <Card title="错误信息" size="small" style={{ marginTop: 16 }}>
                <p><strong>错误类型:</strong> {selectedRecord.error_type}</p>
                <p><strong>错误信息:</strong> {selectedRecord.error_message}</p>
              </Card>
            )}

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="请求数据" size="small">
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {selectedRecord.request_data ? 
                      JSON.stringify(selectedRecord.request_data, null, 2) : 
                      '暂无请求数据'
                    }
                  </pre>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="响应数据" size="small">
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {selectedRecord.response_data ? 
                      JSON.stringify(selectedRecord.response_data, null, 2) : 
                      '暂无响应数据'
                    }
                  </pre>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}; 