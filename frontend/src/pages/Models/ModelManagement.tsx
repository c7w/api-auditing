import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  message,
  Card,
  Select,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { AIModel, APIProvider } from '@/types';
import { ModelService, APIProviderService } from '@/services';

const { Search } = Input;
const { Text } = Typography;

export const ModelManagement: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<number | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    loadModels();
    loadProviders();
  }, [pagination.current, pagination.pageSize, searchText, selectedProvider]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await ModelService.getModels({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        provider: selectedProvider,
      });
      setModels(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      message.error('加载AI模型列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await APIProviderService.getProviders({ page_size: 1000 });
      setProviders(response.results);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleProviderFilter = (providerId: number | undefined) => {
    setSelectedProvider(providerId);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationConfig: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '模型ID',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '提供商',
      dataIndex: 'provider_name',
      key: 'provider_name',
    },
    {
      title: '输入价格(/1M)',
      dataIndex: 'input_price_per_1m',
      key: 'input_price_per_1m',
      render: (price: string) => `$${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '输出价格(/1M)',
      dataIndex: 'output_price_per_1m',
      key: 'output_price_per_1m',
      render: (price: string) => `$${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '上下文长度',
      dataIndex: 'context_length',
      key: 'context_length',
      render: (length: number) => length ? `${length.toLocaleString()}` : '-',
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
  ];

  return (
    <div>
      <PageHeader
        title="AI模型管理"
        subtitle="查看AI模型信息和定价（模型通过同步方式添加）"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadModels}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      />

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="搜索模型名称"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 300 }}
              onSearch={handleSearch}
            />
            
            <Select
              placeholder="选择提供商"
              allowClear
              style={{ width: 200 }}
              onChange={handleProviderFilter}
            >
              {providers.map(provider => (
                <Select.Option key={provider.id} value={provider.id}>
                  {provider.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={models}
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
    </div>
  );
}; 