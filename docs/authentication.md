# 认证系统文档

本文档介绍电商流行趋势系统的认证实现。

## 架构概述

系统使用Supabase Auth作为认证服务，提供以下功能：

- 邮箱密码登录
- 用户注册
- 密码重置
- 会话管理
- 受保护路由

## 核心组件

### 1. AuthProvider

位置: `lib/auth/auth-context.tsx`

提供全局认证状态和方法的React Context。

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, session, loading, signIn, signUp, signOut } = useAuth();
  
  // 使用认证状态和方法
}
```

### 2. Middleware

位置: `middleware.ts`

保护需要认证的路由，自动重定向未登录用户。

**受保护的路径:**
- `/dashboard`
- `/products`
- `/search`
- `/compare`
- `/reports`
- `/profile`

**认证路径:**
- `/login`
- `/register`

### 3. ProtectedRoute组件

位置: `components/auth/protected-route.tsx`

客户端组件，用于保护特定页面内容。

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>受保护的内容</div>
    </ProtectedRoute>
  );
}
```

## 使用指南

### 用户注册

```typescript
const { signUp } = useAuth();

const handleRegister = async () => {
  const { error } = await signUp('user@example.com', 'password');
  
  if (error) {
    console.error('注册失败:', error.message);
  } else {
    console.log('注册成功，请查看邮箱验证');
  }
};
```

### 用户登录

```typescript
const { signIn } = useAuth();

const handleLogin = async () => {
  const { error } = await signIn('user@example.com', 'password');
  
  if (error) {
    console.error('登录失败:', error.message);
  } else {
    console.log('登录成功');
  }
};
```

### 用户登出

```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
  router.push('/');
};
```

### 获取当前用户

```typescript
const { user, loading } = useAuth();

if (loading) {
  return <div>加载中...</div>;
}

if (!user) {
  return <div>未登录</div>;
}

return <div>欢迎, {user.email}</div>;
```

### 密码重置

```typescript
const { resetPassword } = useAuth();

const handleResetPassword = async () => {
  const { error } = await resetPassword('user@example.com');
  
  if (error) {
    console.error('发送重置邮件失败:', error.message);
  } else {
    console.log('重置邮件已发送');
  }
};
```

## 页面实现

### 登录页面

路径: `/login`
文件: `app/(auth)/login/page.tsx`

功能:
- 邮箱密码登录
- 记住我选项
- 忘记密码链接
- 注册链接
- 错误提示

### 注册页面

路径: `/register`
文件: `app/(auth)/register/page.tsx`

功能:
- 邮箱密码注册
- 密码确认
- 服务条款同意
- 登录链接
- 成功提示

### 仪表板页面

路径: `/dashboard`
文件: `app/dashboard/page.tsx`

功能:
- 显示用户信息
- 退出登录按钮
- 数据概览
- 快速操作

## 安全特性

### 1. Row Level Security (RLS)

所有用户数据表都启用了RLS策略：

```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. 会话管理

- 会话自动刷新
- 会话持久化到Cookie
- 安全的会话存储

### 3. 密码要求

- 最小长度: 6个字符
- 建议使用强密码

### 4. HTTPS

生产环境强制使用HTTPS传输。

## 错误处理

常见错误及处理：

### 1. 邮箱已存在

```typescript
if (error?.message.includes('already registered')) {
  setError('该邮箱已被注册');
}
```

### 2. 密码错误

```typescript
if (error?.message.includes('Invalid login credentials')) {
  setError('邮箱或密码错误');
}
```

### 3. 网络错误

```typescript
if (error?.message.includes('network')) {
  setError('网络连接失败，请重试');
}
```

## 测试

### 手动测试流程

1. 访问 `/register` 注册新账号
2. 查看邮箱验证邮件（开发环境可能不发送）
3. 访问 `/login` 登录
4. 验证重定向到 `/dashboard`
5. 测试退出登录
6. 验证访问受保护页面时重定向到登录页

### 自动化测试

```typescript
// 测试登录功能
describe('Authentication', () => {
  it('should login successfully', async () => {
    const { signIn } = useAuth();
    const { error } = await signIn('test@example.com', 'password');
    expect(error).toBeNull();
  });
});
```

## 最佳实践

1. **始终检查loading状态**: 避免在加载时显示错误内容
2. **处理所有错误**: 提供友好的错误提示
3. **使用受保护路由**: 确保敏感页面需要认证
4. **安全存储凭据**: 不要在客户端存储密码
5. **实现登出功能**: 允许用户安全退出

## 常见问题

### Q: 如何自定义邮件模板？

A: 在Supabase仪表板的Authentication > Email Templates中配置。

### Q: 如何添加第三方登录？

A: 在Supabase仪表板的Authentication > Providers中启用相应提供商。

### Q: 如何实现记住我功能？

A: Supabase默认会持久化会话，无需额外配置。

### Q: 如何处理邮箱验证？

A: Supabase会自动发送验证邮件，用户点击链接后账号激活。

## 参考资源

- [Supabase Auth文档](https://supabase.com/docs/guides/auth)
- [Next.js认证最佳实践](https://nextjs.org/docs/authentication)
- [React Context API](https://react.dev/reference/react/useContext)
