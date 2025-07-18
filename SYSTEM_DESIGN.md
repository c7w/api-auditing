# Token API 审计与管理系统 - 系统设计文档

## 系统架构概述

### 技术栈
- **后端**: Django + Django REST Framework
- **数据库**: PostgreSQL (推荐) / MySQL / SQLite (开发)
- **认证**: JWT Token + API Key
- **前端**: React/Vue.js (你选择)
- **部署**: Docker + Nginx

### 模块架构
```
auditing/
├── apps/
│   ├── users/          # 用户管理模块
│   ├── apis/           # API管理模块  
│   ├── models/         # 模型管理模块
│   ├── groups/         # 模型组管理模块
│   ├── quotas/         # 配额管理模块
│   ├── proxy/          # API代理转发模块
│   ├── billing/        # 计费审计模块
│   └── dashboard/      # 仪表盘模块
├── core/               # 核心配置
├── utils/              # 工具函数
└── frontend/           # 前端代码
```

## 数据库模型设计

### 1. 用户模型 (User)
```python
class User(AbstractUser):
    email = EmailField(unique=True)
    name = CharField(max_length=100)
    api_key = CharField(max_length=64, unique=True)  # sk-...格式
    is_super_admin = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    is_active = BooleanField(default=True)
```

### 2. API配置模型 (APIProvider)
```python
class APIProvider:
    name = CharField(max_length=100)  # OpenAI, Claude, etc.
    base_url = URLField()
    api_key = CharField(max_length=200)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### 3. 模型信息 (AIModel)
```python
class AIModel:
    provider = ForeignKey(APIProvider)
    name = CharField(max_length=100)  # gpt-4o, claude-3-sonnet
    display_name = CharField(max_length=100)
    input_price_per_1k = DecimalField()  # 输入价格/1k tokens
    output_price_per_1k = DecimalField() # 输出价格/1k tokens
    context_length = IntegerField()
    capabilities = JSONField()  # 支持的功能
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
```

### 4. 模型组 (ModelGroup)
```python
class ModelGroup:
    name = CharField(max_length=100)
    description = TextField()
    models = ManyToManyField(AIModel)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
```

### 5. 用户配额 (UserQuota)
```python
class UserQuota:
    user = ForeignKey(User)
    model_group = ForeignKey(ModelGroup)
    total_quota = DecimalField()  # 总配额 ($)
    used_quota = DecimalField(default=0)  # 已使用
    remaining_quota = DecimalField()  # 剩余
    expires_at = DateTimeField(null=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
```

### 6. API请求记录 (APIRequest)
```python
class APIRequest:
    user = ForeignKey(User)
    model = ForeignKey(AIModel)
    request_id = UUIDField(default=uuid4)
    method = CharField(max_length=10)
    endpoint = CharField(max_length=200)
    request_data = JSONField()
    response_data = JSONField()
    input_tokens = IntegerField(default=0)
    output_tokens = IntegerField(default=0)
    total_cost = DecimalField()
    status_code = IntegerField()
    duration_ms = IntegerField()  # 请求耗时
    ip_address = GenericIPAddressField()
    user_agent = TextField()
    created_at = DateTimeField(auto_now_add=True)
```

## API接口设计

### 认证相关
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `POST /api/auth/refresh-key/` - 重置API Key

### 用户管理 (超级管理员)
- `GET /api/admin/users/` - 获取用户列表
- `POST /api/admin/users/` - 创建用户
- `PUT /api/admin/users/{id}/` - 更新用户
- `DELETE /api/admin/users/{id}/` - 删除用户
- `POST /api/admin/users/{id}/reset-key/` - 重置用户Key

### API管理
- `GET /api/admin/providers/` - API提供商列表
- `POST /api/admin/providers/` - 添加API提供商
- `PUT /api/admin/providers/{id}/` - 更新API配置
- `POST /api/admin/providers/{id}/sync-models/` - 同步模型

### 模型管理
- `GET /api/admin/models/` - 模型列表
- `POST /api/admin/models/` - 添加模型
- `PUT /api/admin/models/{id}/` - 更新模型

### 模型组管理
- `GET /api/admin/model-groups/` - 模型组列表
- `POST /api/admin/model-groups/` - 创建模型组
- `PUT /api/admin/model-groups/{id}/` - 更新模型组

### 配额管理
- `GET /api/admin/quotas/` - 配额列表
- `POST /api/admin/quotas/` - 分配配额
- `PUT /api/admin/quotas/{id}/` - 更新配额

### 代理API (用户使用)
- `POST /api/v1/chat/completions` - 聊天完成 (兼容OpenAI)
- `GET /api/v1/models` - 获取可用模型
- `GET /api/v1/usage` - 查看使用情况

### 统计分析
- `GET /api/admin/stats/overview/` - 系统概览
- `GET /api/admin/stats/users/{id}/requests/` - 用户请求统计
- `GET /api/admin/stats/billing/` - 计费统计

## 安全考虑

1. **API Key格式**: `sk-audit-{32位随机字符}`
2. **请求限制**: 实现速率限制和配额检查
3. **数据加密**: 敏感信息加密存储
4. **审计日志**: 所有操作记录日志
5. **权限控制**: 基于角色的访问控制

## 核心业务流程

### 1. 用户请求流程
```
用户API请求 → 验证API Key → 检查配额 → 转发到目标API → 记录使用量 → 返回结果
```

### 2. 配额管理流程
```
管理员创建模型组 → 为用户分配配额 → 用户消费配额 → 实时扣减 → 配额预警
```

### 3. 计费流程
```
API调用 → Token计算 → 价格计算 → 配额扣减 → 生成账单记录
```

这个设计满足了你的所有需求。接下来我们可以开始实现，你觉得这个架构设计如何？有什么需要调整的地方吗？ 