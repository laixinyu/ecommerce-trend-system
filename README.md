# 电商趋势分析系统

一个功能完整的跨境电商趋势分析平台，基于 Next.js 14 和 Supabase 构建。

## ✨ 核心功能

- 📊 **趋势分析** - 实时分析商品趋势，智能推荐高潜力商品
- 🕷️ **真实爬虫** - 使用 Puppeteer 从 Amazon、AliExpress 真实爬取数据
- 🔄 **实时同步** - 爬虫数据自动同步到商品列表，实时通知新商品 🆕
- 🎯 **类目浏览** - 支持不输入关键词，直接按类目爬取商品 🆕
- 🌐 **多平台支持** - Amazon 和 AliExpress 独立类目体系 🆕
- �️* **批量删除** - 一键删除不推荐商品或清空商品列表 🆕
- � ***报告生成** - 导出 Excel/CSV 格式的趋势分析报告
- � **用户系索统** - 收藏、筛选、通知等个性化功能
- 🔍 **智能搜索** - 全文搜索、智能建议、相关商品推荐

## 🚀 5分钟快速启动

```bash
npm install                    # 1. 安装依赖
cp .env.example .env.local     # 2. 配置环境变量
npm run seed                   # 3. 初始化数据
npm run dev                    # 4. 启动服务器
```

访问 http://localhost:3000

> 💡 **提示**：设置 `NEXT_PUBLIC_DEV_MODE=true` 可以绕过登录

## 📖 文档导航

**新手？** 从这里开始 → **[📖 START_HERE.md](./📖_START_HERE.md)**

### 核心文档
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - 详细安装步骤
- **[DEV_MODE.md](./DEV_MODE.md)** - 开发模式（绕过登录）
- **[DATA_SETUP.md](./DATA_SETUP.md)** - 数据初始化
- **[ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)** - 完整功能指南
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 命令速查表
- **[docs/SYNC_QUICKSTART.md](./docs/SYNC_QUICKSTART.md)** - 爬虫同步快速开始 ⭐

### 配置部署
- **[SUPABASE_SETUP_CHECKLIST.md](./SUPABASE_SETUP_CHECKLIST.md)** - 数据库配置
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 部署指南

### API 文档
- **[docs/API.md](./docs/API.md)** - API 接口文档

## 📚 文档导航

### 必读文档
- **[START_NOW.md](./START_NOW.md)** - 3步快速启动指南 ⭐
- **[DATA_SETUP.md](./DATA_SETUP.md)** - 数据初始化详细说明
- **[DEV_MODE.md](./DEV_MODE.md)** - 开发模式使用指南

### 功能文档
- **[ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md)** - 爬虫、定时任务、报告、用户系统
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 常用命令和API快速参考
- **[docs/API.md](./docs/API.md)** - API 接口文档
- **[docs/PRODUCT_BULK_DELETE.md](./docs/PRODUCT_BULK_DELETE.md)** - 商品批量删除功能 🆕
- **[docs/BULK_DELETE_QUICK_REFERENCE.md](./docs/BULK_DELETE_QUICK_REFERENCE.md)** - 批量删除快速参考 🆕
- **[docs/AMAZON_CATEGORIES.md](./docs/AMAZON_CATEGORIES.md)** - 亚马逊标准类目
- **[docs/CATEGORY_QUICK_REFERENCE.md](./docs/CATEGORY_QUICK_REFERENCE.md)** - 类目快速参考
- **[docs/CATEGORY_UPDATE_SUMMARY.md](./docs/CATEGORY_UPDATE_SUMMARY.md)** - 类目更新总结
- **[docs/CATEGORY_FIX.md](./docs/CATEGORY_FIX.md)** - 商品类目修复说明

### 配置文档
- **[SUPABASE_SETUP_CHECKLIST.md](./SUPABASE_SETUP_CHECKLIST.md)** - Supabase 配置清单
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 部署到 Vercel 指南

## 🎯 主要页面

| 页面       | URL                   | 功能                           |
| ---------- | --------------------- | ------------------------------ |
| 商品列表   | `/products`           | 浏览和筛选商品，实时同步新数据 |
| 商品详情   | `/products/[id]`      | 查看详细信息和趋势             |
| 爬虫控制台 | `/admin/real-crawler` | 真实爬虫管理，支持类目浏览 🆕   |
| 报告生成   | `/reports`            | 生成和导出报告                 |
| 个人中心   | `/profile`            | 用户设置和偏好                 |
| 仪表板     | `/dashboard`          | 数据概览                       |

## 🔧 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本

# 数据
npm run seed             # 初始化数据库
npm run test:supabase    # 测试数据库连接
npm run test:sync        # 测试爬虫同步功能
npm run test:crawler     # 测试爬虫功能

# 类目管理 🆕
npm run update:categories              # 应用 Amazon 类目
npm run update:categories:aliexpress   # 应用 AliExpress 类目
npm run verify:categories              # 验证类目数据

# 代码质量
npm run lint             # 检查代码
npm run type-check       # 类型检查
```

## 🛠️ 技术栈

- **前端**: Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4
- **后端**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **爬虫**: Puppeteer + Cheerio 🆕
- **状态管理**: Zustand
- **数据获取**: React Query
- **图表**: Recharts
- **部署**: Vercel

## 📊 项目结构

```
ecommerce-trend-system/
├── app/                    # Next.js 页面和 API
│   ├── (auth)/            # 认证页面
│   ├── admin/             # 管理页面
│   ├── api/               # API 路由
│   └── products/          # 商品页面
├── components/            # React 组件
├── lib/                   # 核心业务逻辑
│   ├── crawler/          # 爬虫系统
│   ├── analytics/        # 分析算法
│   ├── reports/          # 报告生成
│   └── supabase/         # 数据库客户端
├── scripts/              # 工具脚本
└── supabase/             # 数据库迁移
```

## ⚠️ 重要提示

### 关于爬虫
当前爬虫使用**模拟数据**作为示例。实际使用需要配置真实的 API：
- Amazon: [Product Advertising API](https://webservices.amazon.com/paapi5/documentation/)
- AliExpress: [Open Platform API](https://developers.aliexpress.com/)

### 开发模式
设置 `NEXT_PUBLIC_DEV_MODE=true` 可以绕过登录，使用测试账号快速开发。

## 🐛 故障排除

### 商品列表为空
```bash
npm run seed
```

### 数据库连接失败
```bash
npm run test:supabase
# 检查 .env.local 中的配置
```

### 爬虫无法启动
访问 http://localhost:3000/admin/real-crawler 查看状态和日志

## 📖 详细文档

查看 [START_NOW.md](./START_NOW.md) 开始使用，或浏览其他文档了解更多功能。

1. 测试用户
   邮箱: test@example.com
   密码: Test123456!

2. 管理员
   邮箱: admin@example.com
   密码: Admin123456!

3. 演示账号
   邮箱: demo@example.com
   密码: Demo123456!

## 📝 License

MIT
