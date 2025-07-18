> Code is cheap, show me the talk.
> 
> Prompt see PROMPT.md

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
