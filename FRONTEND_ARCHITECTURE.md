# 前端架构设计 - Token API 审计与管理系统

## 🎯 总体架构

### 技术栈选择

**核心框架**: React 18 + TypeScript
- **状态管理**: Zustand (轻量级，适合中等规模应用)
- **路由**: React Router v6
- **UI组件库**: Ant Design (企业级，组件丰富)
- **HTTP客户端**: Axios
- **表单处理**: React Hook Form + Zod (类型安全)
- **图表库**: Recharts (React原生)
- **代码格式化**: Prettier + ESLint
- **构建工具**: Vite

### 项目结构

```
frontend/
├── public/
├── src/
│   ├── components/          # 公共组件
│   │   ├── Layout/         # 布局组件
│   │   ├── Charts/         # 图表组件
│   │   ├── Forms/          # 表单组件
│   │   └── Common/         # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── Auth/           # 认证页面
│   │   ├── Dashboard/      # 仪表盘
│   │   ├── Users/          # 用户管理
│   │   ├── Quotas/         # 配额管理
│   │   ├── Models/         # 模型管理
│   │   └── Reports/        # 报表页面
│   ├── hooks/              # 自定义Hooks
│   ├── services/           # API服务
│   ├── stores/             # 状态管理
│   ├── types/              # TypeScript类型
│   ├── utils/              # 工具函数
│   └── constants/          # 常量定义
├── package.json
└── vite.config.ts
```

## 🏗️ 核心功能模块

### 1. 认证与授权模块

**功能**: 登录、权限控制、路由守卫

```typescript
// 认证状态管理
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// 路由守卫
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole === 'admin' && !user?.is_super_admin) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 2. 仪表盘模块

**核心组件**:
- 系统概览卡片
- 使用量趋势图表
- 成本分析图表
- 实时监控面板

```typescript
// 仪表盘数据结构
interface DashboardData {
  overview: {
    totalUsers: number;
    totalQuotas: number;
    totalCost: number;
    activeModels: number;
  };
  usageChart: {
    date: string;
    requests: number;
    cost: number;
  }[];
  topModels: {
    name: string;
    usage: number;
    cost: number;
  }[];
}
```

### 3. 用户管理模块

**功能**: 
- 用户列表与搜索
- 用户创建/编辑
- 配额分配
- API Key管理

```typescript
// 用户管理组件结构
const UserManagement = () => {
  return (
    <PageContainer>
      <UserFilters />
      <UserTable 
        onEdit={handleEdit}
        onResetKeys={handleResetAllKeys}
        onAssignQuota={handleAssignQuota}
      />
      <UserModal />
      <QuotaAssignModal />
    </PageContainer>
  );
};
```

### 4. 配额管理模块

**重点功能**:
- 配额列表（按用户-模型组分组）
- 使用量监控
- API Key重置
- 历史数据查看

```typescript
// 配额管理核心组件
const QuotaManagement = () => {
  const [selectedQuota, setSelectedQuota] = useState<UserQuota | null>(null);
  
  return (
    <Row gutter={16}>
      <Col span={8}>
        <QuotaList onSelect={setSelectedQuota} />
      </Col>
      <Col span={16}>
        {selectedQuota && (
          <QuotaDetails quota={selectedQuota} />
        )}
      </Col>
    </Row>
  );
};
```

### 5. API请求监控模块

**功能**:
- 按配额分组的请求记录
- 实时请求日志
- 错误监控
- 性能分析

```typescript
// 请求监控组件
const RequestMonitor = () => {
  return (
    <Tabs>
      <TabPane tab="实时监控" key="realtime">
        <RealtimeRequestList />
      </TabPane>
      <TabPane tab="历史记录" key="history">
        <RequestHistory />
      </TabPane>
      <TabPane tab="错误分析" key="errors">
        <ErrorAnalysis />
      </TabPane>
    </Tabs>
  );
};
```

## 🎨 UI/UX 设计原则

### 1. 响应式设计
- 桌面优先设计
- 支持平板和手机端访问
- 断点: 1200px, 768px, 576px

### 2. 主题设计
```typescript
// 主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
  },
};
```

### 3. 交互设计
- 加载状态指示
- 操作确认弹窗
- 友好的错误提示
- 快捷键支持

## 📊 数据可视化

### 1. 图表组件

```typescript
// 使用量趋势图
const UsageTrendChart = ({ data }: { data: UsageData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="requests" stroke="#8884d8" />
        <Line type="monotone" dataKey="cost" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
};

// 成本分布饼图
const CostDistributionChart = ({ data }: { data: CostData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### 2. 实时更新
- WebSocket连接用于实时数据
- 定时轮询备选方案
- 数据缓存策略

## 🔌 API集成

### 1. API客户端配置

```typescript
// API客户端
class ApiClient {
  private axios: AxiosInstance;
  
  constructor() {
    this.axios = axios.create({
      baseURL: '/api',
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器 - 添加认证头
    this.axios.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // 响应拦截器 - 错误处理
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### 2. API服务模块

```typescript
// 用户服务
export class UserService {
  static async getUsers(params?: UserListParams): Promise<UserListResponse> {
    const response = await apiClient.get('/admin/users/', { params });
    return response.data;
  }
  
  static async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/admin/users/', userData);
    return response.data;
  }
  
  static async resetUserKeys(userId: number): Promise<ResetKeysResponse> {
    const response = await apiClient.post(`/admin/users/${userId}/reset-all-keys/`);
    return response.data;
  }
}

// 配额服务
export class QuotaService {
  static async getQuotas(params?: QuotaListParams): Promise<QuotaListResponse> {
    const response = await apiClient.get('/admin/quotas/', { params });
    return response.data;
  }
  
  static async getQuotaRequests(quotaId: number, params?: RequestParams): Promise<RequestListResponse> {
    const response = await apiClient.get(`/admin/quotas/${quotaId}/requests/`, { params });
    return response.data;
  }
}
```

## 🚀 开发与部署

### 1. 开发环境设置

```bash
# 项目初始化
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# 依赖安装
npm install antd zustand react-router-dom axios react-hook-form @hookform/resolvers zod recharts
npm install -D @types/node prettier eslint

# 启动开发服务器
npm run dev
```

### 2. 环境配置

```typescript
// src/config/env.ts
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws',
  APP_NAME: 'Token API 审计管理系统',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};
```

### 3. 构建与部署

```bash
# 生产构建
npm run build

# 静态文件服务
# 构建后的文件可以通过 Django 的静态文件服务提供
# 或者使用 Nginx 独立部署
```

## 📱 移动端适配

### 1. 响应式布局
```typescript
// 响应式断点
const breakpoints = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
};

// 移动端优化组件
const MobileOptimizedTable = () => {
  const isMobile = useMediaQuery(breakpoints.xs);
  
  return isMobile ? <CardList /> : <Table />;
};
```

### 2. 触摸优化
- 更大的点击区域
- 手势支持
- 滑动操作

## 🔐 安全考虑

### 1. 数据保护
- 敏感信息加密
- API Key掩码显示
- XSS防护

### 2. 权限控制
```typescript
// 权限验证Hook
const usePermission = (requiredPermission: Permission) => {
  const { user } = useAuthStore();
  
  return useMemo(() => {
    if (!user) return false;
    if (user.is_super_admin) return true;
    return user.permissions?.includes(requiredPermission) ?? false;
  }, [user, requiredPermission]);
};

// 使用示例
const UserManagementPage = () => {
  const canManageUsers = usePermission('manage_users');
  
  if (!canManageUsers) {
    return <UnauthorizedAccess />;
  }
  
  return <UserManagement />;
};
```

## 📈 性能优化

### 1. 代码分割
```typescript
// 路由级代码分割
const Dashboard = lazy(() => import('../pages/Dashboard'));
const UserManagement = lazy(() => import('../pages/UserManagement'));

// 组件级懒加载
const HeavyChart = lazy(() => import('../components/HeavyChart'));
```

### 2. 数据缓存
```typescript
// 使用 React Query 进行数据缓存
const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: UserService.getUsers,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};
```

## 🧪 测试策略

### 1. 单元测试
- React Testing Library
- Jest
- 组件测试覆盖率 > 80%

### 2. 集成测试
- API模拟
- 端到端流程测试
- Playwright

### 3. 用户体验测试
- 可访问性测试
- 性能测试
- 跨浏览器兼容性

---

## 💡 实现建议

1. **分阶段开发**: 
   - Phase 1: 认证 + 基础布局
   - Phase 2: 用户管理 + 配额管理
   - Phase 3: 监控 + 报表
   - Phase 4: 高级功能 + 优化

2. **重点关注**:
   - 配额管理的直观展示
   - API Key的安全管理
   - 实时数据更新
   - 丰富的图表和统计

3. **用户体验**:
   - 快速加载
   - 直观的导航
   - 清晰的数据展示
   - 友好的错误处理

这个前端架构将为你的Token API审计与管理系统提供现代化、用户友好且功能强大的管理界面！ 