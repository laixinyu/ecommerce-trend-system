# Supabase集成

本目录包含Supabase后端服务的集成代码。

## 文件说明

- `client.ts` - Supabase客户端实例
- `helpers.ts` - 数据库操作辅助函数
- `__tests__/` - 测试文件

## 使用方法

### 1. 基本查询

```typescript
import { supabase } from '@/lib/supabase/client';

// 查询商品
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('platform', 'amazon')
  .limit(10);
```

### 2. 使用辅助函数

```typescript
import { getCategories, getUserFavorites } from '@/lib/supabase/helpers';

// 获取类目
const categories = await getCategories(0);

// 获取用户收藏
const favorites = await getUserFavorites(userId);
```

### 3. 实时订阅

```typescript
import { supabase } from '@/lib/supabase/client';

// 订阅通知更新
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New notification:', payload.new);
    }
  )
  .subscribe();

// 取消订阅
channel.unsubscribe();
```

### 4. 认证

```typescript
import { supabase } from '@/lib/supabase/client';

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// 登出
await supabase.auth.signOut();

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser();
```

## 最佳实践

1. **错误处理**: 始终检查error对象
2. **类型安全**: 使用TypeScript类型定义
3. **RLS策略**: 依赖Row Level Security保护数据
4. **性能优化**: 使用select()指定需要的字段
5. **批量操作**: 使用upsert()和批量插入

## 常用查询示例

### 分页查询

```typescript
const page = 1;
const pageSize = 20;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### 关联查询

```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    categories (
      id,
      name
    ),
    trend_history (
      date,
      search_volume
    )
  `)
  .eq('id', productId)
  .single();
```

### 聚合查询

```typescript
const { data, error } = await supabase
  .from('products')
  .select('platform, count')
  .eq('platform', 'amazon');
```

## 调试技巧

1. 启用详细日志：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true,
  },
});
```

2. 查看生成的SQL：

在Supabase仪表板的"Logs"中查看实际执行的SQL语句。

3. 测试RLS策略：

```sql
-- 在SQL编辑器中测试
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id"}';
SELECT * FROM user_preferences;
```

## 参考资源

- [Supabase JavaScript客户端文档](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase查询指南](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
