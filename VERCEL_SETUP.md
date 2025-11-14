# Vercel 环境变量配置指南

## 🔑 你的 Supabase 配置

根据你提供的信息，以下是你需要在 Vercel 中配置的环境变量：

### 必需的环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://rfoztyyzbgdqtlzijxtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmb3p0eXl6YmdkcXRsemlqeHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjUwMjEsImV4cCI6MjA3NjcwMTAyMX0.Lq2jdTt8gAre8eaT1EQTzZguPQxLNlBUc6bWZBj8qfY

# 应用配置（替换为你的 Vercel 域名）
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api

# 环境
NODE_ENV=production
```

### 可选的环境变量

```bash
# Service Role Key（用于管理操作，从 Supabase Dashboard 获取）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cron Job 密钥（生成一个随机字符串）
CRON_SECRET=your_random_secret_here

# 数据加密密钥（运行 npm run generate:key 生成）
ENCRYPTION_KEY=your_64_character_hex_key_here
```

## 📝 配置步骤

### 步骤 1：在 Vercel 添加环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 逐个添加上述环境变量：
   - 变量名：`NEXT_PUBLIC_SUPABASE_URL`
   - 值：`https://rfoztyyzbgdqtlzijxtk.supabase.co`
   - 环境：勾选 **Production**, **Preview**, **Development**
   - 点击 **Save**
5. 重复添加其他变量

### 步骤 2：获取 Service Role Key（可选但推荐）

1. 在 Supabase Dashboard 进入 **Settings** → **API**
2. 找到 **service_role** key（标记为 secret）
3. 点击 **Reveal** 显示密钥
4. 复制并添加到 Vercel 环境变量：
   - 变量名：`SUPABASE_SERVICE_ROLE_KEY`
   - 值：复制的 service_role key
   - 环境：只勾选 **Production**（不要暴露在客户端）

### 步骤 3：重新部署

环境变量更新后，必须重新部署才能生效：

**方法 1：在 Vercel Dashboard**
1. 进入 **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 确认重新部署

**方法 2：推送代码触发部署**
```bash
git commit --allow-empty -m "Update environment variables"
git push
```

### 步骤 4：初始化数据库

在 Supabase Dashboard 执行数据库迁移：

1. 进入 **SQL Editor**
2. 点击 **New query**
3. 依次执行以下文件的内容：
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/004_crawl_logs.sql`
   - 其他迁移文件...

或使用 Supabase CLI：
```bash
supabase link --project-ref rfoztyyzbgdqtlzijxtk
supabase db push
```

### 步骤 5：创建管理员账号

部署完成后，使用以下方法之一创建管理员：

**方法 1：在 Supabase Dashboard**
1. 进入 **Authentication** → **Users**
2. 点击 **Add user** → **Create new user**
3. 填写你的邮箱和密码
4. 勾选 **Auto Confirm User**
5. 点击 **Create user**

**方法 2：使用本地脚本**
```bash
# 临时修改 .env.local 指向生产环境
NEXT_PUBLIC_SUPABASE_URL=https://rfoztyyzbgdqtlzijxtk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 运行脚本
npm run create:admin

# 完成后改回本地配置
```

**方法 3：直接在网站注册**
- 访问你的 Vercel 部署地址
- 进入注册页面
- 使用你的邮箱注册

## ✅ 验证配置

部署完成后，访问你的网站并打开浏览器控制台（F12）：

### 检查 1：环境变量
在 Console 中输入：
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```
应该显示：`https://rfoztyyzbgdqtlzijxtk.supabase.co`

### 检查 2：网络请求
1. 打开 **Network** 标签
2. 尝试注册或登录
3. 查看请求是否发送到 `rfoztyyzbgdqtlzijxtk.supabase.co`
4. 检查响应状态码（应该是 200 或 201）

### 检查 3：认证功能
- ✅ 可以注册新账号
- ✅ 可以登录
- ✅ 可以访问受保护的页面

## 🐛 常见问题

### 问题 1：仍然显示 "Failed to fetch"

**原因**：环境变量未生效

**解决**：
1. 确认 Vercel 环境变量已保存
2. 确认已重新部署
3. 清除浏览器缓存
4. 使用无痕模式测试

### 问题 2：注册成功但无法登录

**原因**：Supabase 启用了邮箱验证

**解决**：
1. 在 Supabase Dashboard 进入 **Authentication** → **Settings**
2. 找到 **Email Auth**
3. 关闭 **Enable email confirmations**
4. 或者在 Supabase Dashboard 手动确认用户邮箱

### 问题 3：数据库错误

**原因**：数据库迁移未执行

**解决**：
1. 检查 Supabase Dashboard 的 **Table Editor**
2. 确认表已创建（products, categories, users 等）
3. 如果没有，执行数据库迁移

## 📞 下一步

配置完成后：

1. ✅ 测试注册和登录功能
2. ✅ 运行 `npm run seed` 初始化示例数据（可选）
3. ✅ 创建管理员账号
4. ✅ 开始使用系统

## 🔒 安全提示

- ❌ 不要将 Service Role Key 暴露在客户端代码中
- ❌ 不要将 Service Role Key 提交到 Git
- ✅ 只在服务端使用 Service Role Key
- ✅ 定期更换密钥
- ✅ 启用 Supabase RLS（Row Level Security）

---

**当前配置状态**：
- Supabase URL: ✅ 已获取
- Anon Key: ✅ 已获取
- Service Role Key: ⏳ 需要从 Dashboard 获取
- 数据库迁移: ⏳ 需要执行
- 管理员账号: ⏳ 需要创建
