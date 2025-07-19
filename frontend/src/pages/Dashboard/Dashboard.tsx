import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Button,
  Tag,
  Progress,
  message,
  Modal,
  Input,
  Spin,
  Collapse,
  Descriptions,
} from 'antd';
import {
  DollarOutlined,
  ApiOutlined,
  ReloadOutlined,
  KeyOutlined,
  EyeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/stores';
import { DashboardService, QuotaService, BillingService } from '@/services';
import { PageHeader } from '@/components';
import { UserQuota } from '@/types';

const { Text } = Typography;
const { Panel } = Collapse;

// 添加daily_statistics的类型定义
interface DailyStatistic {
  date: string;
  requests: number;
  cost: number;
  tokens: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [userQuotas, setUserQuotas] = useState<UserQuota[]>([]);
  
  // API密钥查看相关状态
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [currentApiKeyData, setCurrentApiKeyData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    if (user?.is_super_admin) {
      loadStatisticsData();
    } else {
      loadUserQuotas();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await DashboardService.getDashboardStats();
      setDashboardData(data);
    } catch (error) {
      message.error('加载仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatisticsData = async () => {
    try {
      const stats = await BillingService.getChatRecordsStatistics();
      setStatisticsData(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadUserQuotas = async () => {
    try {
      const response = await QuotaService.getUserQuotas();
      // 后端返回的是 { user: string, quotas: Array<...> } 格式
      // 我们需要转换为前端期望的格式
      if (response.quotas) {
        const transformedQuotas = response.quotas.map(quota => ({
          id: quota.id,
          user: 0, // 当前用户
          user_name: response.user,
          user_email: '', // 后端没有提供，使用空字符串
          name: '', // 使用模型组名称
          description: '',
          model_group: 0, // 后端没有提供ID
          model_group_name: quota.model_group,
          model_group_description: quota.model_group_description || '',
          total_quota: quota.total_quota,
          used_quota: quota.used_quota,
          remaining_quota: quota.remaining_quota,
          api_key: quota.masked_api_key,
          masked_api_key: quota.masked_api_key,
          usage_percentage: quota.usage_percentage,
          rate_limit_per_minute: 60,
          rate_limit_per_hour: 3600,
          rate_limit_per_day: 86400,
          is_active: quota.is_active,
          is_expired: false,
          expires_at: null,
          created_at: '',
          updated_at: '',
          model_count: quota.model_count || 0,
          models: quota.models || [],
        }));
        setUserQuotas(transformedQuotas);
      }
    } catch (error) {
      console.error('Failed to load user quotas:', error);
      // 如果出错，设置为空数组
      setUserQuotas([]);
    }
  };

  const handleResetApiKey = async (quotaId: number) => {
    try {
      const result = await QuotaService.resetUserApiKey(quotaId);
      message.success('API密钥重置成功');
      
      // 显示新的API Key
      Modal.info({
        title: 'API密钥重置成功',
        content: (
          <div>
            <p><strong>模型组:</strong> {result.model_group}</p>
            
            <p><strong>API Base URL:</strong></p>
            <Input
              value={`${window.location.origin}/v1`}
              readOnly
              style={{ 
                fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                marginBottom: 12
              }}
            />
            
            <p><strong>新的API Key:</strong></p>
            <Input.TextArea
              value={result.api_key}
              readOnly
              rows={3}
              style={{ 
                fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                marginBottom: 12
              }}
            />
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              ⚠️ 请妥善保管您的API Key，不要在不安全的环境中分享。刷新页面后将无法再次查看完整密钥。
            </div>
          </div>
        ),
        width: 600,
      });
      
      loadUserQuotas();
    } catch (error) {
      message.error('重置API密钥失败');
    }
  };

  const handleViewApiKey = async (quotaId: number) => {
    try {
      const result = await QuotaService.getUserApiKey(quotaId);
      
      // 设置数据并显示状态控制的Modal
      setCurrentApiKeyData(result);
      setApiKeyModalVisible(true);
      
    } catch (error) {
      console.error('获取API密钥失败:', error);
      Modal.error({
        title: '获取API密钥失败',
        content: '请稍后重试或联系管理员',
      });
      message.error('获取API密钥失败');
    }
  };

  // 管理员仪表盘
  if (user?.is_super_admin) {
    const usageTrendData = statisticsData?.daily_statistics || [];
    
    // 获取当日数据（今天的日期格式：YYYY-MM-DD）
    const today = new Date().toISOString().split('T')[0];
    const todayData = usageTrendData.find((item: DailyStatistic) => item.date === today);
    const todayRequests = todayData?.requests || 0;
    const todayCost = todayData?.cost || 0;

    return (
      <div>
        <PageHeader 
          title="管理员仪表盘" 
          subtitle="系统概览和数据统计"
          extra={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadDashboardData();
                loadStatisticsData();
              }}
              loading={loading}
            >
              刷新数据
            </Button>
          }
        />

        <Spin spinning={loading}>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="当日请求数"
                  value={todayRequests}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="当日支出数"
                  value={todayCost}
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
                  title="总请求数"
                  value={statisticsData?.total_requests || 0}
                  prefix={<ApiOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总支出"
                  value={statisticsData?.total_cost || 0}
                  prefix={<DollarOutlined />}
                  precision={6}
                  valueStyle={{ color: '#f5222d' }}
                  formatter={(value) => `$${Number(value).toFixed(6)}`}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="费用趋势" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="费用 ($)"
                      dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="调用次数趋势" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#1890ff"
                      strokeWidth={2}
                      name="调用次数"
                      dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    );
  }

  // 普通用户仪表盘
  return (
    <div>
      <PageHeader 
        title="我的仪表盘" 
        subtitle="配额使用情况和API统计"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                loadDashboardData();
                loadUserQuotas();
              }}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      />

      <Spin spinning={loading}>
        {/* 我的配额列表 */}
        <Card title="我的配额" style={{ marginBottom: 24 }}>
          {userQuotas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text type="secondary">
                您还没有任何配额，请等待管理员分配
              </Text>
            </div>
          ) : (
            <Collapse
              bordered={false}
              defaultActiveKey={[]}
              style={{ marginBottom: 24 }}
            >
              {userQuotas.map(quota => (
                <Panel
                  header={
                    <Space>
                      <Text strong>{quota.model_group_name || quota.name || '未命名配额'}</Text>
                      <Tag color={quota.is_active ? 'green' : 'red'}>
                        {quota.is_active ? '激活' : '未激活'}
                      </Tag>
                      <Tag color="blue">{quota.model_count || 0} 个模型</Tag>
                    </Space>
                  }
                  key={quota.id}
                  extra={
                    <Space onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewApiKey(quota.id)}
                      >
                        查看密钥
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        icon={<KeyOutlined />}
                        onClick={() => handleResetApiKey(quota.id)}
                      >
                        重置密钥
                      </Button>
                    </Space>
                  }
                >
                  {/* 配额基本信息 */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={12}>
                      <Card size="small" title="配额信息">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="模型组">{quota.model_group_name}</Descriptions.Item>
                          <Descriptions.Item label="组描述">{quota.model_group_description || '无描述'}</Descriptions.Item>
                          <Descriptions.Item label="总额度">${parseFloat(quota.total_quota).toFixed(2)}</Descriptions.Item>
                          <Descriptions.Item label="已使用">${parseFloat(quota.used_quota).toFixed(4)}</Descriptions.Item>
                          <Descriptions.Item label="剩余">${parseFloat(quota.remaining_quota).toFixed(4)}</Descriptions.Item>
                          <Descriptions.Item label="使用率">
                            <Progress 
                              percent={Math.round(quota.usage_percentage || 0)} 
                              size="small"
                              status={quota.usage_percentage > 90 ? 'exception' : quota.usage_percentage > 80 ? 'active' : 'normal'}
                            />
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card size="small" title="API密钥">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="掩码密钥">
                            <code style={{ fontSize: '12px' }}>{quota.masked_api_key || '未生成'}</code>
                          </Descriptions.Item>
                          <Descriptions.Item label="状态">
                            <Tag color={quota.is_active ? 'green' : 'red'}>
                              {quota.is_active ? '激活' : '未激活'}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>

                  {/* 可用模型列表 */}
                  <Card size="small" title={<Space><RobotOutlined />可用模型 ({quota.model_count || 0})</Space>}>
                    {quota.models && quota.models.length > 0 ? (
                      <Row gutter={[8, 8]}>
                        {quota.models.map((model: any) => (
                          <Col key={model.id} xs={24} sm={12} md={8} lg={6}>
                            <Card 
                              size="small" 
                              hoverable
                              style={{ height: '100%' }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div style={{ marginBottom: 8 }}>
                                <Tag color="blue">{model.provider_name}</Tag>
                                <Tag color="purple">{model.model_type}</Tag>
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <Text strong style={{ fontSize: '14px' }}>{model.display_name}</Text>
                                <br />
                                <Text code style={{ fontSize: '12px' }}>{model.name}</Text>
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                <div>上下文: {model.context_length?.toLocaleString()}</div>
                                <div>输入: ${model.input_price_per_1m}/1M</div>
                                <div>输出: ${model.output_price_per_1m}/1M</div>
                              </div>
                              {model.capabilities && Object.keys(model.capabilities).length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  {Object.entries(model.capabilities).slice(0, 2).map(([key, value]: [string, any]) => (
                                    <Tag key={key} color={value ? 'green' : 'default'}>
                                      {key}
                                    </Tag>
                                  ))}
                                </div>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                        该配额暂无可用模型
                      </div>
                    )}
                  </Card>
                </Panel>
              ))}
            </Collapse>
          )}
        </Card>

        {/* 使用统计 */}
        {dashboardData && (
          <Card title="使用统计">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="今日调用次数"
                  value={dashboardData.today_requests || 0}
                  prefix={<ApiOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="今日费用"
                  value={dashboardData.today_cost || 0}
                  prefix={<DollarOutlined />}
                  precision={4}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="总使用费用"
                  value={dashboardData.total_cost || 0}
                  prefix={<DollarOutlined />}
                  precision={4}
                />
              </Col>
            </Row>
          </Card>
        )}
      </Spin>

      {/* API密钥查看Modal */}
      <Modal
        title="API密钥详情"
        open={apiKeyModalVisible}
        onCancel={() => {
          setApiKeyModalVisible(false);
          setCurrentApiKeyData(null);
        }}
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setApiKeyModalVisible(false);
              setCurrentApiKeyData(null);
            }}
          >
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentApiKeyData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>模型组:</Text> {currentApiKeyData.model_group}
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Text strong>API Base URL:</Text>
            </div>
            <Input
              value={`${window.location.origin}/v1`}
              readOnly
              style={{ 
                fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                marginBottom: 16
              }}
            />
            
            <div style={{ marginBottom: 8 }}>
              <Text strong>完整API Key:</Text>
            </div>
            <Input.TextArea
              value={currentApiKeyData.api_key}
              readOnly
              rows={3}
              style={{ 
                fontFamily: 'Consolas, Monaco, "Courier New", monospace', 
                fontSize: '12px',
                backgroundColor: '#f5f5f5',
                marginBottom: 16
              }}
            />
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <Text type="secondary">
                ⚠️ 请妥善保管您的API Key，不要在不安全的环境中分享。
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}; 