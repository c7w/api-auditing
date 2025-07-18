# API Key 管理功能

## 问题描述
用户在仪表盘中只能看到掩码后的API key（如 `sk-audit-****...abcd`），但需要完整的API key来调用API服务。

## 解决方案
添加了用户查看和重置自己API key的功能。

### 新增后端接口

1. **查看完整API Key**
   - 路径: `GET /api/quotas/{quota_id}/api_key/`
   - 权限: 用户只能查看自己的配额
   - 返回: 完整的API key

2. **重置API Key**
   - 路径: `POST /api/quotas/{quota_id}/reset_api_key/`
   - 权限: 用户只能重置自己的配额
   - 返回: 新生成的完整API key

### 前端功能

在用户仪表盘的"我的配额"部分，为每个配额添加了两个操作按钮：

1. **查看密钥** (眼睛图标)
   - 显示当前配额的完整API key
   - 弹出Modal显示详情
   - 包含安全提示

2. **重置密钥** (钥匙图标)
   - 生成新的API key
   - 弹出Modal显示新密钥
   - 提示用户保存新密钥

### 安全考虑

- 用户只能访问自己的配额
- 权限验证确保用户无法查看其他用户的API key
- 完整API key只在用户主动请求时显示
- 提供安全提示引导用户保护API key

### 使用流程

1. 用户登录系统
2. 进入仪表盘查看配额
3. 点击"查看密钥"按钮查看完整API key
4. 如需重置，点击"重置密钥"按钮生成新key
5. 复制并保存API key用于API调用

### API调用示例

```bash
# 使用完整API key调用AI服务
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer sk-audit-your-full-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

现在用户可以方便地查看和管理自己的API密钥了！ 