# Supabase设置指南

本文档介绍如何设置Supabase后端服务。

## 1. 创建Supabase项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - Name: `ecommerce-trend-system`
   - Database Password: 设置一个强密码（请保存好）
   - Region: 选择离你最近的区域
5. 等待项目创建完成（约2分钟）

## 2. 获取API密钥

1. 在项目仪表板中，点击左侧菜单的 "Settings"
2. 选择 "API"
3. 复制以下信息：
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## 3. 配置环境变量

在项目根目录的 `.env.local` 文件中填写：

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. 运行数据库迁移

### 方法1: 使用Supabase SQL编辑器（推荐）

1. 在Supabase仪表板中，点击左侧菜单的 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
4. 粘贴到编辑器中
5. 点击 "Run" 执行
6. 重复步骤2-5，执行 `002_rls_policies.sql`

### 方法2: 使用Supabase CLI

```bash
# 安装Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

## 5. 配置认证

1. 在Supabase仪表板中，点击 "Authentication"
2. 选择 "Providers"
3. 启用 "Email" 提供商
4. 配置邮件模板（可选）：
   - 点击 "Email Templates"
   - 自定义确认邮件、重置密码邮件等

## 6. 验证设置

运行以下命令验证连接：

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000`，如果没有错误，说明设置成功。

## 7. 数据库结构

### 核心表

- **categories**: 商品类目
- **products**: 商品信息
- **trend_history**: 趋势历史数据
- **keywords**: 关键词数据
- **user_preferences**: 用户偏好设置
- **user_favorites**: 用户收藏
- **notifications**: 通知
- **reports**: 报告

### 关系图

```
users (Supabase Auth)
  ├── user_preferences (1:1)
  ├── user_favorites (1:N)
  ├── notifications (1:N)
  └── reports (1:N)

categories
  ├── products (1:N)
  └── keywords (1:N)

products
  ├── trend_history (1:N)
  └── user_favorites (1:N)
```

## 8. Row Level Security (RLS)

系统已配置RLS策略，确保数据安全：

- 用户只能访问自己的偏好、收藏、通知和报告
- 所有认证用户可以查看商品、类目、趋势和关键词数据
- 未认证用户无法访问任何数据

## 9. 常见问题

### Q: 连接失败怎么办？

A: 检查以下几点：
1. 环境变量是否正确配置
2. Supabase项目是否正常运行
3. 网络连接是否正常
4. API密钥是否正确

### Q: 如何重置数据库？

A: 在Supabase仪表板的SQL编辑器中运行：

```sql
-- 警告：这将删除所有数据！
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

然后重新运行迁移脚本。

### Q: 如何备份数据？

A: 
1. 在Supabase仪表板中，点击 "Database"
2. 选择 "Backups"
3. 点击 "Create backup"

## 10. 下一步

- 配置存储桶（用于上传图片和报告文件）
- 设置实时订阅（用于实时通知）
- 配置Edge Functions（用于复杂的服务端逻辑）

## 参考资源

- [Supabase文档](https://supabase.com/docs)
- [Supabase JavaScript客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security指南](https://supabase.com/docs/guides/auth/row-level-security)
