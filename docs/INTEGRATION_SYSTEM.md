# 集成管理系统文档

## 概述

集成管理系统是数字化能力扩展的核心基础设施，负责管理与第三方服务的连接、OAuth认证、凭证存储和API调用。

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用                              │
│  - 集成配置界面                                          │
│  - OAuth授权流程                                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 集成管理API                              │
│  /api/integrations/*                                    │
│  /api/integrations/oauth/*                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                核心服务层                                │
│  - OAuthManager: OAuth 2.0认证                          │
│  - Encryption: 凭证加密/解密                            │
│  - RateLimiter: API速率限制                             │
│  - RetryWithBackoff: 重试机制                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                数据存储层                                │
│  - integrations表: 集成配置和凭证                       │
│  - 其他业务表: 同步的数据                               │
└─────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. 数据库Schema

**integrations表**
- 存储所有第三方服务集成的配置
- 凭证使用AES-256-GCM加密存储
- 支持多种服务类型：marketing, crm, content, supply_chain, analytics

### 2. OAuth管理器 (OAuthManager)

**功能**:
- 初始化OAuth授权流程
- 处理OAuth回调
- 交换授权码获取access token
- 自动刷新过期的token
- 撤销token

**使用示例**:
```typescript
import { oauthManager } from '@/lib/integrations/oauth-manager';

// 初始化授权
const authUrl = await oauthManager.initiateAuth('meta_ads', userId);

// 处理回调
const { tokens, userId, serviceName } = await oauthManager.handleCallback(code, state);

// 刷新token
const newTokens = await oauthManager.refreshToken('meta_ads', refreshToken);
```

### 3. 加密工具 (Encryption)

**功能**:
- 使用AES-256-GCM加密敏感数据
- 支持字符串和对象加密
- 生成安全的随机token

**使用示例**:
```typescript
import { Encryption } from '@/lib/security/encryption';

// 加密对象
const encrypted = Encryption.encryptObject({ api_key: 'secret' });

// 解密对象
const decrypted = Encryption.decryptObject(encrypted);

// 生成密钥
const key = Encryption.generateKey();
```

### 4. 速率限制器 (RateLimiter)

**功能**:
- 控制API调用频率
- 支持不同服务的自定义配置
- 自动排队和重试

**使用示例**:
```typescript
import { rateLimiter } from '@/lib/integrations/rate-limiter';

// 使用速率限制执行API调用
const result = await rateLimiter.throttle('meta_ads', async () => {
  return await fetchMetaAdsData();
});

// 批量执行
const results = await rateLimiter.throttleBatch('meta_ads', items, processItem);
```

### 5. 重试机制 (RetryWithBackoff)

**功能**:
- 指数退避重试策略
- 可配置的重试次数和延迟
- 条件重试支持

**使用示例**:
```typescript
import { retryWithBackoff, isRetryableError } from '@/lib/utils/retry';

// 基本重试
const result = await retryWithBackoff(
  () => apiCall(),
  { maxRetries: 3, baseDelay: 1000 }
);

// 条件重试
const result = await retryIf(
  () => apiCall(),
  (error) => isRetryableError(error),
  { maxRetries: 3 }
);
```

## API端点

### 集成管理

**GET /api/integrations**
- 获取用户的所有集成
- 查询参数: `service_type`, `status`

**POST /api/integrations**
- 创建新的集成
- 请求体: `{ service_name, service_type, credentials, config }`

**GET /api/integrations/[id]**
- 获取单个集成详情

**PATCH /api/integrations/[id]**
- 更新集成
- 请求体: `{ status?, credentials?, config?, last_sync_at? }`

**DELETE /api/integrations/[id]**
- 删除集成

### OAuth认证

**POST /api/integrations/oauth/initiate**
- 初始化OAuth授权流程
- 请求体: `{ service_name, additional_params? }`
- 返回: `{ auth_url }`

**GET /api/integrations/oauth/callback**
- OAuth回调处理
- 查询参数: `code`, `state`

**POST /api/integrations/[id]/refresh-token**
- 刷新access token

## 环境变量配置

### 必需配置

```bash
# 加密密钥（使用 npm run generate:key 生成）
ENCRYPTION_KEY=your_64_character_hex_key

# 应用URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### OAuth服务配置

```bash
# Meta (Facebook/Instagram)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Google Ads
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# HubSpot
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

## 安全最佳实践

### 1. 凭证加密
- 所有API密钥和token使用AES-256-GCM加密存储
- 加密密钥通过环境变量配置，不提交到代码库
- 使用认证标签(auth tag)确保数据完整性

### 2. 行级安全(RLS)
- 所有集成表启用RLS策略
- 用户只能访问自己的集成数据
- 通过Supabase Auth自动验证用户身份

### 3. OAuth安全
- 使用state参数防止CSRF攻击
- state token有10分钟过期时间
- 使用后立即删除state token

### 4. API安全
- 所有API端点验证用户身份
- 不在响应中返回实际凭证
- 记录所有API调用日志

## 使用指南

### 1. 初始化

```bash
# 生成加密密钥
npm run generate:key

# 应用数据库迁移
npm run migration:007
```

### 2. 配置OAuth应用

为每个第三方服务创建OAuth应用：

**Meta (Facebook)**
1. 访问 https://developers.facebook.com
2. 创建应用，选择"Business"类型
3. 添加"Marketing API"产品
4. 配置OAuth重定向URI: `{APP_URL}/api/integrations/oauth/callback`
5. 获取App ID和App Secret

**Google Ads**
1. 访问 https://console.cloud.google.com
2. 创建项目并启用Google Ads API
3. 创建OAuth 2.0客户端ID
4. 配置授权重定向URI
5. 获取Client ID和Client Secret

### 3. 集成流程

```typescript
// 1. 初始化OAuth授权
const response = await fetch('/api/integrations/oauth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ service_name: 'meta_ads' })
});
const { auth_url } = await response.json();

// 2. 重定向用户到授权页面
window.location.href = auth_url;

// 3. 用户授权后，系统自动处理回调并保存凭证

// 4. 使用集成
const credentials = await getIntegrationCredentials(integrationId, userId);
```

### 4. 使用集成凭证

```typescript
import { getIntegrationCredentials } from '@/lib/integrations/integration-helper';
import { rateLimiter } from '@/lib/integrations/rate-limiter';
import { retryWithBackoff } from '@/lib/utils/retry';

// 获取凭证（自动刷新过期token）
const credentials = await getIntegrationCredentials(integrationId, userId);

// 使用速率限制和重试机制调用API
const data = await rateLimiter.throttle('meta_ads', async () => {
  return await retryWithBackoff(async () => {
    const response = await fetch('https://graph.facebook.com/v18.0/act_xxx/campaigns', {
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`
      }
    });
    return response.json();
  });
});
```

## 故障排查

### 问题: OAuth回调失败

**可能原因**:
- 重定向URI配置不匹配
- state token过期
- 应用权限不足

**解决方案**:
1. 检查OAuth应用配置中的重定向URI
2. 确保用户在10分钟内完成授权
3. 检查应用权限范围(scopes)

### 问题: Token刷新失败

**可能原因**:
- refresh_token不存在或无效
- 用户撤销了授权
- 服务配置错误

**解决方案**:
1. 检查集成是否有refresh_token
2. 要求用户重新授权
3. 验证OAuth配置

### 问题: 速率限制错误

**可能原因**:
- 超过API调用限制
- 速率限制配置不正确

**解决方案**:
1. 检查速率限制配置
2. 启用请求队列
3. 增加重试延迟

## 扩展新服务

要添加新的第三方服务集成：

1. **添加OAuth配置**
```typescript
// lib/integrations/oauth-manager.ts
const configs: Record<string, OAuthConfig> = {
  new_service: {
    client_id: process.env.NEW_SERVICE_CLIENT_ID || '',
    client_secret: process.env.NEW_SERVICE_CLIENT_SECRET || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/callback`,
    authorization_endpoint: 'https://...',
    token_endpoint: 'https://...',
    scopes: ['scope1', 'scope2'],
  },
};
```

2. **配置速率限制**
```typescript
// lib/integrations/rate-limiter.ts
rateLimiter.setConfig('new_service', {
  maxRequests: 100,
  windowMs: 60000,
  queueEnabled: true,
});
```

3. **添加环境变量**
```bash
NEW_SERVICE_CLIENT_ID=...
NEW_SERVICE_CLIENT_SECRET=...
```

4. **实现服务特定的API客户端**
```typescript
// lib/integrations/new-service-client.ts
export class NewServiceClient {
  async fetchData(credentials: EncryptedCredentials) {
    // 实现API调用
  }
}
```

## 相关文档

- [需求文档](../../.kiro/specs/digital-capabilities-expansion/requirements.md)
- [设计文档](../../.kiro/specs/digital-capabilities-expansion/design.md)
- [任务列表](../../.kiro/specs/digital-capabilities-expansion/tasks.md)
