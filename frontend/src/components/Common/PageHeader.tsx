import React from 'react';
import { Typography, Space, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  extra,
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: 24 }}>
      <Space
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Space align="center">
          {showBack && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            />
          )}
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Typography.Text type="secondary">
                {subtitle}
              </Typography.Text>
            )}
          </div>
        </Space>
        
        {extra && <div>{extra}</div>}
      </Space>
    </div>
  );
}; 