# 📦 Vercel 部署完整指南

这是一份详细的 Vercel 部署指南，帮助你将电商趋势分析系统部署到生产环境。

## 📋 目录

1. [前置准备](#前置准备)
2. [快速部署](#快速部署)
3. [配置 Supabase](#配置-supabase)
4. [配置环境变量](#配置环境变量)
5. [验证部署](#验证部署)
6. [常见问题](#常见问题)

---

## 前置准备

### 1. 需要的账号

- ✅ GitHub 账号（用于托管代码）
- ✅ Vercel 账号（用于部署）- [注册地址](https://vercel.com/signup)
- ✅ Supabase 账号（用于数据库）- [注册地址](https://supabase.com)

### 2. 本地准备

确保你的代码已经推送到 GitHub：

```bash
# 进入项目目录
cd ecommerce-trend-system

# 提交所有更改
git add .
git commit -m "准备部署到 Vercel"

# 推送到 GitHub
git push origin main
```

---

## 快速部署

### 方法一：通过 Vercel 网站部署（推荐）

#### 步骤 1: 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 选择 **"Import Git Repository"**
4. 找到你的 GitHub 仓库并点击 **"Import"**

#### 步骤 2: 配置项目

在配置页面：

- **Project Name**: 保持默认或自定义（例如：`ecommerce-trend-system`）
- **Framework Preset**: 自动检测为 **Next.js**
- **Root Directory**: 选择 `ecommerce-trend-system`（如果项目在子目录）
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

#### 步骤 3: 添加环境变量（临时占位符）

点击 **"Environment Variables"**，先添加基础变量以完成首次部署：

```bash
# 基础配置（使用占位符）
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
CRON_SECRET=temporary-secret-change-later
NODE_ENV=production
```

> 💡 **提示**: 这些占位符值可以让项目成功构建，稍后我们会配置真实的 Supabase 凭据。

#### 步骤 4: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 看到 "🎉 Congratulations!" 表示部署成功

你会得到一个类似这样的 URL：`https://your-project.vercel.app`

---

### 方法二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 进入项目目录
cd ecommerce-trend-system

# 部署
vercel

# 部署到生产环境
vercel --prod
```

---

## 配置 Supabase

现在需要配置真实的数据库，让应用完全可用。

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **"New Project"**
3. 填写项目信息：
   - **Name**: `ecommerce-trend-system`
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离你最近的区域（例如：东京、新加坡）
4. 点击 **"Create new project"**
5. 等待项目初始化（约 2 分钟）

### 步骤 2: 获取 API 凭据

项目创建完成后：

1. 进入项目的 **Settings** → **API**
2. 找到以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` （很长的字符串）
   - **service_role key**: `eyJhbGc...` （仅用于服务端）

> ⚠️ **重要**: `service_role` 密钥拥有完全权限，不要暴露在客户端！

### 步骤 3: 执行数据库迁移

有两种方法执行迁移：

#### 方法 A: 使用 Supabase SQL Editor（推荐）

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 **"New query"**
3. 依次复制并执行以下迁移文件的内容：

```bash
# 按顺序执行这些文件：
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/004_crawl_logs.sql
supabase/migrations/005_update_amazon_categories.sql
supabase/migrations/006_platform_categories.sql
supabase/migrations/007_digital_capabilities.sql
supabase/migrations/008_content_management.sql
supabase/migrations/009_content_assets.sql
supabase/migrations/010_user_settings.sql
```

每个文件执行后，确认没有错误再继续下一个。

#### 方法 B: 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 推送迁移
supabase db push
```

### 步骤 4: 配置存储桶（用于内容资产管理）

1. 在 Supabase Dashboard 中，进入 **Storage**
2. 点击 **"Create a new bucket"**
3. 创建名为 `content-assets` 的存储桶
4. 设置为 **Public** 或配置适当的访问策略

---

## 配置环境变量

现在更新 Vercel 中的环境变量为真实值。

### 步骤 1: 进入 Vercel 项目设置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**

### 步骤 2: 更新必需的环境变量

删除或更新之前的占位符，添加以下真实值：

#### 核心配置（必需）

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# 应用 URL（替换为你的 Vercel 域名）
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api

# Cron 密钥（生成一个随机字符串）
CRON_SECRET=your_secure_random_secret_here

# 数据加密密钥（64位十六进制字符串）
ENCRYPTION_KEY=your_64_character_hex_key_here

# 环境
NODE_ENV=production
```

> 💡 **生成安全密钥**:
> ```bash
> # 生成 CRON_SECRET
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> 
> # 生成 ENCRYPTION_KEY
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

#### 可选配置（根据需要添加）

```bash
# AI 服务（用于内容生成）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Meta 广告集成
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Google Ads 集成
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Shopify 集成
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret

# HubSpot CRM 集成
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
```

### 步骤 3: 设置环境变量作用域

对于每个环境变量，选择适用的环境：

- ✅ **Production** - 生产环境（必选）
- ✅ **Preview** - 预览部署（推荐）
- ⬜ **Development** - 本地开发（可选）

### 步骤 4: 重新部署

环境变量更新后：

1. 进入 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **"..."** → **"Redeploy"**
4. 选择 **"Use existing Build Cache"** 或 **"Rebuild"**
5. 点击 **"Redeploy"**

---

## 验证部署

### 1. 检查网站可访问性

访问你的 Vercel URL：`https://your-project.vercel.app`

应该能看到：
- ✅ 首页正常加载
- ✅ 登录/注册页面可访问
- ✅ 样式和图片正常显示

### 2. 测试用户功能

1. **注册新用户**:
   - 访问 `/register`
   - 填写邮箱和密码
   - 检查是否能成功注册

2. **登录**:
   - 使用刚注册的账号登录
   - 确认能进入仪表板

3. **测试功能**:
   - 查看趋势数据
   - 测试搜索功能
   - 尝试生成报告

### 3. 检查 Cron Jobs

Vercel 会自动识别 `vercel.json` 中的定时任务配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "0 */2 * * *"  // 每2小时执行
    },
    {
      "path": "/api/cron/detect-trends",
      "schedule": "0 0 * * *"  // 每天午夜执行
    }
  ]
}
```

查看 Cron 日志：
1. 进入 Vercel 项目的 **Logs** 标签
2. 筛选 `/api/cron/` 路径
3. 确认定时任务正常执行

### 4. 监控部署状态

在 Vercel Dashboard 中：
- **Deployments**: 查看部署历史
- **Logs**: 查看运行日志
- **Analytics**: 查看访问统计
- **Speed Insights**: 查看性能指标

---

## 常见问题

### Q1: 构建失败，提示 TypeScript 错误

**解决方案**: 项目已配置 `ignoreBuildErrors: true`，如果仍然失败：

```bash
# 本地测试构建
npm run build

# 检查 next.config.js 配置
```

### Q2: 部署成功但页面显示 500 错误

**可能原因**:
- 环境变量配置错误
- Supabase 连接失败

**解决方案**:
1. 检查 Vercel Logs 查看具体错误
2. 验证 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
3. 确认 Supabase 项目状态正常

### Q3: 登录功能不工作

**解决方案**:
1. 检查 Supabase 项目的 **Authentication** 设置
2. 确认 **Site URL** 设置为你的 Vercel 域名
3. 添加 Vercel 域名到 **Redirect URLs**:
   ```
   https://your-project.vercel.app/auth/callback
   ```

### Q4: Cron Jobs 不执行

**解决方案**:
1. 确认 `vercel.json` 文件存在且格式正确
2. 检查 `CRON_SECRET` 环境变量已设置
3. 在 API 路由中验证密钥：
   ```typescript
   if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

### Q5: 图片或静态资源加载失败

**解决方案**:
1. 确认文件在 `public` 目录中
2. 检查 `next.config.js` 中的 `images` 配置
3. 使用相对路径：`/images/logo.png` 而不是 `./images/logo.png`

### Q6: 数据库连接超时

**解决方案**:
1. 检查 Supabase 项目是否暂停（免费版会自动暂停）
2. 在 Supabase Dashboard 中唤醒项目
3. 考虑升级到付费计划以避免自动暂停

### Q7: 如何配置自定义域名？

**步骤**:
1. 在 Vercel 项目中，进入 **Settings** → **Domains**
2. 点击 **"Add"**
3. 输入你的域名（例如：`www.example.com`）
4. 按照提示配置 DNS 记录
5. 等待 DNS 传播（通常几分钟到几小时）

### Q8: 如何回滚到之前的版本？

**步骤**:
1. 进入 **Deployments** 标签
2. 找到想要回滚的版本
3. 点击 **"..."** → **"Promote to Production"**

---

## 🎯 部署后优化建议

### 1. 性能优化

- 启用 Vercel **Edge Functions** 以降低延迟
- 配置 **Image Optimization** 自动优化图片
- 使用 **Incremental Static Regeneration (ISR)** 缓存页面

### 2. 安全加固

- 定期更新所有密钥
- 启用 Supabase **Row Level Security (RLS)**
- 配置 **CORS** 限制 API 访问
- 使用 **Environment Variables** 而不是硬编码

### 3. 监控和日志

- 集成 **Vercel Analytics** 追踪用户行为
- 配置 **Sentry** 或其他错误追踪服务
- 定期检查 **Logs** 发现潜在问题

### 4. 备份策略

- 定期备份 Supabase 数据库
- 使用 Git 标签标记重要版本
- 保存环境变量配置的副本

---

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Supabase 文档](https://supabase.com/docs)
- [项目 README](./README.md)
- [快速开始指南](./QUICK_START.md)

---

## 🎉 完成！

恭喜！你的电商趋势分析系统现在已经成功部署到 Vercel 了。

**下一步**:
1. ✅ 创建测试账号并测试所有功能
2. ✅ 配置第三方集成（Google Ads、Meta、Shopify 等）
3. ✅ 邀请团队成员使用系统
4. ✅ 开始分析电商趋势数据！

如有问题，请查看 [常见问题](#常见问题) 或提交 Issue。
