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
  Switch,
  Card,
  Select,
  InputNumber,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components';
import { ModelGroup, AIModel } from '@/types';
import { ModelGroupService, ModelService } from '@/services';

const { Search } = Input;
const { TextArea } = Input;

export const ModelGroupManagement: React.FC = () => {
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModelGroup | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadModelGroups();
    loadModels();
  }, [pagination.current, pagination.pageSize, searchText]);

  const loadModelGroups = async () => {
    setLoading(true);
    try {
      const response = await ModelGroupService.getModelGroups({
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
      });
      setModelGroups(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count,
      }));
    } catch (error) {
      message.error('加载模型组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const response = await ModelService.getModels({ page_size: 1000, is_active: true });
      setModels(response.results);
    } catch (error) {
      console.error('Failed to load models:', error);
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

  const handleCreateGroup = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditGroup = (group: ModelGroup) => {
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      description: group.description,
      models: group.ai_models,
      default_quota: parseFloat(group.default_quota),
      is_active: group.is_active,
    });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 转换数据格式，将models字段映射为model_ids
      const groupData = {
        name: values.name,
        description: values.description,
        model_ids: values.models, // 将models字段转换为model_ids
        default_quota: values.default_quota.toString(),
        is_active: values.is_active,
      };

      if (editingGroup) {
        // 更新模型组
        const updatedGroup = await ModelGroupService.updateModelGroup(editingGroup.id, groupData);
        setModelGroups(prev => prev.map(group => 
          group.id === editingGroup.id ? updatedGroup : group
        ));
        message.success('模型组更新成功');
      } else {
        // 创建模型组
        await ModelGroupService.createModelGroup(groupData);
        message.success('模型组创建成功');
        loadModelGroups(); // 重新加载列表
      }
      
      setIsModalVisible(false);
    } catch (error) {
      message.error('操作失败');
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
      title: '组名称',
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
      title: '包含模型',
      dataIndex: 'model_names',
      key: 'model_names',
      width: 250,
      render: (modelNames: string[]) => {
        const displayNames = (modelNames || []).slice(0, 2);
        const remainingCount = (modelNames || []).length - 2;
        
        const allModelsTooltip = (
          <div style={{ maxWidth: 300 }}>
            {(modelNames || []).map((name, index) => (
              <div key={index} style={{ marginBottom: 2 }}>
                • {name}
              </div>
            ))}
          </div>
        );
        
        return (
          <div>
            {displayNames.map((name, index) => (
              <Tag 
                key={index} 
                style={{ 
                  marginBottom: 4, 
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}
                title={name}
              >
                {name}
              </Tag>
            ))}
            {remainingCount > 0 && (
              <Tooltip title={allModelsTooltip} placement="topLeft">
                <Tag color="blue" style={{ cursor: 'pointer' }}>
                  +{remainingCount} 更多
                </Tag>
              </Tooltip>
            )}
            {(modelNames || []).length === 0 && (
              <Tag color="default">无模型</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '模型数量',
      dataIndex: 'model_count',
      key: 'model_count',
    },
    {
      title: '默认配额',
      dataIndex: 'default_quota',
      key: 'default_quota',
      render: (quota: string) => `$${parseFloat(quota).toFixed(2)}`,
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
      width: 100,
      render: (_: any, record: ModelGroup) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditGroup(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="模型组管理"
        subtitle="管理AI模型分组和默认配额"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadModelGroups}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateGroup}
            >
              新建模型组
            </Button>
          </Space>
        }
      />

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索模型组名称或描述"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={columns}
          dataSource={modelGroups}
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

      {/* 创建/编辑模型组模态框 */}
      <Modal
        title={editingGroup ? '编辑模型组' : '新建模型组'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模型组名称"
            rules={[{ required: true, message: '请输入模型组名称' }]}
          >
            <Input placeholder="如：GPT模型组" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="模型组的用途和说明" />
          </Form.Item>

          <Form.Item
            name="models"
            label="包含模型"
            rules={[{ required: true, message: '请选择至少一个模型' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择要包含的AI模型"
              showSearch
              optionFilterProp="children"
            >
              {models.map(model => (
                <Select.Option key={model.id} value={model.id}>
                  {model.display_name} ({model.name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="default_quota"
            label="默认配额 (USD)"
            rules={[{ required: true, message: '请输入默认配额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={10}
              precision={2}
              placeholder="100.00"
            />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="激活" unCheckedChildren="未激活" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 