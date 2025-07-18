# Token API 审计与管理系统

基于 Django 的 AI API 代理审计与管理系统，支持多厂商 AI 模型的统一管理、用户配额控制、成本计算和使用审计。

## 🚀 功能特性

### ✅ 已实现功能

- **用户管理系统**
  - 超级管理员与普通用户权限控制
  - 用户认证（JWT + API Key双重认证）
  - 基于配额的API密钥管理（每个用户-模型组-配额组合生成独立密钥）

- **API 提供商管理**
  - 支持多个第三方API提供商（OpenAI、Claude等）
  - API连接测试与模型同步
  - 配置管理与状态监控

- **AI 模型管理**
  - 自动同步模型信息
  - 定价配置（输入/输出token价格）
  - 模型能力标记

- **模型组管理**
  - 将多个模型打包成组
  - 灵活的访问权限控制
  - 默认配额设置

- **用户配额系统**
  - 多周期配额支持（月/周/日/不限期）
  - 实时配额消费与监控
  - 速率限制控制
  - 配额警告与自动续费

- **计费与审计**
  - 详细的API请求记录
  - 自动成本计算
  - 使用统计报表
  - 成本警告机制

### 🔄 进行中

- **API 代理转发服务** - 兼容 OpenAI 格式的代理接口

### 📋 待开发

- **前端管理界面** - React/Vue.js 管理后台
- **仪表盘与报表** - 数据可视化
- **API 接口文档** - 完整的 API 文档

## 🛠 技术栈

- **后端**: Django 5.2.4 + Django REST Framework
- **数据库**: PostgreSQL / MySQL / SQLite
- **认证**: JWT + API Key
- **缓存**: Redis
- **文档**: Django 自动生成 API 文档

## 📦 安装与使用

### 1. 环境准备

```bash
# 克隆项目
git clone <your-repo-url>
cd auditing

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境

```bash
# 复制环境变量配置
cp env.example .env

# 编辑 .env 文件配置数据库等信息
```

### 3. 数据库初始化

```bash
# 应用数据库迁移
python manage.py migrate

# 创建超级管理员
python manage.py create_superadmin
```

### 4. 启动开发服务器

```bash
python manage.py runserver
```

服务将在 `http://127.0.0.1:8000` 启动。

## 🔑 默认管理员账户

- **邮箱**: admin@example.com
- **密码**: admin123456

### API Key获取方式

系统采用基于配额的API Key管理：

1. **创建模型组配额**: 超级管理员需要为用户分配模型组配额
2. **自动生成API Key**: 每个【用户+模型组+配额】组合自动生成独立的API Key
3. **细粒度权限控制**: 不同的模型组可以有不同的访问权限和配额限制

> **重要**: 新的API Key管理方式实现了更细粒度的权限控制和数据隔离，每个模型组配额都有独立的API Key和使用记录

## 📚 API 接口

### 用户认证
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `GET /api/quotas/` - 获取当前用户的配额信息

### 用户管理（超级管理员）
- `GET /api/admin/users/` - 获取用户列表
- `POST /api/admin/users/` - 创建用户
- `PUT /api/admin/users/{id}/` - 更新用户
- `POST /api/admin/users/{id}/reset-all-keys/` - 重置用户所有API Key

### 配额管理（超级管理员）
- `GET /api/admin/quotas/` - 获取配额列表
- `POST /api/admin/quotas/` - 创建用户配额
- `POST /api/admin/quotas/{id}/reset_api_key/` - 重置单个配额的API Key
- `GET /api/admin/quotas/{id}/requests/` - 获取配额下的所有请求记录
- `GET /api/admin/quotas/{id}/statistics/` - 获取配额使用统计

### 代理API（兼容OpenAI格式）
- `POST /v1/chat/completions` - 聊天完成
- `GET /v1/models` - 获取模型列表
- `GET /v1/usage` - 查看使用情况

## 🏗 项目结构

```
auditing/
├── apps/
│   ├── users/          # 用户管理模块
│   ├── apis/           # API管理模块  
│   ├── ai_models/      # AI模型管理模块
│   ├── groups/         # 模型组管理模块
│   ├── quotas/         # 配额管理模块
│   ├── proxy/          # API代理转发模块
│   ├── billing/        # 计费审计模块
│   └── dashboard/      # 仪表盘模块
├── core/               # 核心配置
├── utils/              # 工具函数
├── requirements.txt    # 依赖列表
└── README.md          # 项目说明
```

## 📊 数据模型

系统包含以下核心数据模型：

- **User**: 用户信息（支持超级管理员）
- **APIProvider**: API提供商配置
- **AIModel**: AI模型信息与定价
- **ModelGroup**: 模型分组
- **UserQuota**: 用户配额管理
- **APIRequest**: API请求记录
- **BillingRecord**: 计费记录

详细的系统设计请查看 `SYSTEM_DESIGN.md`。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 