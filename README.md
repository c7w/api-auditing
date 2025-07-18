# Token API 审计与管理系统

基于 Django + React 的 AI API 代理审计与管理系统，支持多厂商 AI 模型的统一管理、用户配额控制、成本计算和使用审计。

## 🚀 功能特性

### 后端功能
- **用户管理**: 支持多用户系统，超级管理员和普通用户角色
- **配额管理**: 灵活的配额分配和使用监控
- **API代理**: OpenAI兼容的API接口，支持多厂商模型
- **成本计算**: 精确的Token计算和成本统计
- **使用审计**: 完整的API调用记录和分析
- **权限控制**: 基于JWT的认证和权限管理

### 前端功能
- **仪表盘**: 直观的数据可视化和统计图表
- **用户管理**: 用户创建、编辑、删除和权限管理
- **配额管理**: 配额分配、监控和API Key管理
- **实时监控**: API使用情况实时展示
- **响应式设计**: 支持桌面和移动端访问

## 🛠️ 技术栈

### 后端
- **Django 4.2** - Web框架
- **Django REST Framework** - API框架
- **SQLite** - 数据库（可切换到PostgreSQL/MySQL）
- **JWT** - 身份验证
- **Uvicorn** - ASGI服务器

### 前端
- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Recharts** - 图表库
- **Axios** - HTTP客户端
- **Vite** - 构建工具

## 📦 快速开始

### 环境要求
- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd auditing
```

### 2. 后端设置

#### 创建虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

#### 数据库迁移
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 创建超级用户
```bash
python manage.py createsuperuser
```

#### 启动后端服务
```bash
python manage.py runserver 0.0.0.0:8000
```

### 3. 前端设置

#### 安装依赖
```bash
cd frontend
npm install
```

#### 启动前端开发服务器
```bash
npm run dev
```

### 4. 访问系统

- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs/

## 🔐 默认账户

### 管理员账户
- 邮箱: admin@example.com
- 密码: admin123

### 普通用户账户  
- 邮箱: user@example.com
- 密码: user123

## 📖 API文档

### OpenAPI规范
系统提供完整的OpenAPI 3.0规范文档，包含所有API接口的详细说明。

### 主要接口

#### 认证接口
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `POST /api/auth/change-password/` - 修改密码

#### 用户管理接口（管理员）
- `GET /api/admin/users/` - 获取用户列表
- `POST /api/admin/users/` - 创建用户
- `PUT /api/admin/users/{id}/` - 更新用户
- `DELETE /api/admin/users/{id}/` - 删除用户

#### 配额管理接口（管理员）
- `GET /api/admin/quotas/` - 获取配额列表
- `POST /api/admin/quotas/` - 创建配额
- `PUT /api/admin/quotas/{id}/` - 更新配额
- `POST /api/admin/quotas/{id}/reset_api_key/` - 重置API Key

#### OpenAI兼容接口
- `POST /v1/chat/completions` - 聊天完成
- `GET /v1/models` - 获取模型列表
- `GET /v1/usage` - 查看使用情况

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │  后端 (Django)   │    │  数据库 (SQLite) │
│                 │    │                 │    │                 │
│ • 用户界面       │◄──►│ • REST API      │◄──►│ • 用户数据       │
│ • 状态管理       │    │ • 权限控制       │    │ • 配额信息       │
│ • 数据可视化     │    │ • API代理       │    │ • 使用记录       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 项目结构

```
auditing/
├── apps/                   # Django应用
│   ├── users/             # 用户管理
│   ├── quotas/            # 配额管理
│   └── apis/              # API代理
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── stores/        # 状态管理
│   │   └── types/         # 类型定义
│   └── public/
├── config/                # Django配置
├── requirements.txt       # Python依赖
├── openapi.yaml          # API文档
└── README.md
```

## 🔧 配置说明

### 环境变量
创建 `.env` 文件进行环境配置：

```env
# Django设置
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 数据库设置
DATABASE_URL=sqlite:///db.sqlite3

# JWT设置
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=60  # 分钟
JWT_REFRESH_TOKEN_LIFETIME=1440  # 分钟

# AI服务设置
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 数据库配置
默认使用SQLite，生产环境建议使用PostgreSQL：

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'auditing_db',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 🚀 部署指南

### Docker部署
```bash
# 构建镜像
docker build -t auditing-system .

# 运行容器
docker run -p 8000:8000 -p 3000:3000 auditing-system
```

### 生产环境部署
1. 使用Nginx作为反向代理
2. 使用Gunicorn作为WSGI服务器
3. 使用PostgreSQL作为数据库
4. 配置SSL证书
5. 设置环境变量

## 📊 监控与日志

### 系统监控
- API请求监控
- 配额使用监控
- 错误率统计
- 性能指标

### 日志记录
- 用户操作日志
- API调用日志
- 错误日志
- 系统日志

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请联系：
- 邮箱: admin@example.com
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🗺️ 开发路线图

- [ ] 支持更多AI模型厂商
- [ ] 实时WebSocket通知
- [ ] 高级报表分析
- [ ] 移动端APP
- [ ] 插件系统
- [ ] 多语言支持 