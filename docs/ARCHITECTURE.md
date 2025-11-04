# 系统架构文档

## 技术栈概览

### 前端
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI**: React 19 + TailwindCSS 4 + shadcn/ui
- **状态管理**: Zustand
- **数据获取**: TanStack Query (React Query)
- **图表**: Recharts
- **表单**: React Hook Form + Zod

### 后端
- **运行时**: Node.js 20+ (Vercel Serverless)
- **API**: Next.js API Routes
- **认证**: Supabase Auth (JWT)
- **数据库**: PostgreSQL (Supabase)
- **爬虫**: Puppeteer + Cheerio
- **数据处理**: TypeScript

### 部署
- **前端托管**: Vercel
- **数据库**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **爬虫执行**: Serverless Functions (5分钟超时)

## 系统架构图

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React 组件   │  │  Zustand     │  │ React Query  │      │
│  │  (UI Layer)  │  │  (状态管理)   │  │  (数据缓存)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                      (全球 CDN)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 应用层                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              服务端组件 (SSR/SSG)                      │  │
│  │  - 首页渲染                                            │  │
│  │  - SEO 优化                                            │  │
│  │  - 初始数据加载                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              客户端组件 (CSR)                          │  │
│  │  - 交互式 UI                                           │  │
│  │  - 实时数据更新                                         │  │
│  │  - 表单处理                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                               │  │
│  │  /api/trends/*      - 趋势数据 API                    │  │
│  │  /api/search/*      - 搜索 API                        │  │
│  │  /api/user/*        - 用户 API                        │  │
│  │  /api/reports/*     - 报告 API                        │  │
│  │  /api/crawl/*       - 爬虫管理 API                    │  │
│  │  /api/cron/*        - 定时任务 API                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              业务逻辑层 (lib/)                         │  │
│  │  - 趋势分析引擎                                         │  │
│  │  - 竞争分析引擎                                         │  │
│  │  - 推荐算法                                            │  │
│  │  - 数据清洗                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              中间件 (middleware.ts)                    │  │
│  │  - 认证检查                                            │  │
│  │  - 路由保护                                            │  │
│  │  - CORS 处理                                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase BaaS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │ Supabase Auth│  │   Storage    │      │
│  │  (主数据库)   │  │  (JWT 认证)  │  │  (文件存储)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │     RLS      │  │   Realtime   │                        │
│  │  (行级安全)   │  │  (实时订阅)   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 数据流图

```
用户操作
    ↓
React 组件
    ↓
React Query (检查缓存)
    ↓ (缓存未命中)
API Route
    ↓
业务逻辑层
    ↓
Supabase Client
    ↓
PostgreSQL
    ↓
返回数据
    ↓
React Query (缓存数据)
    ↓
更新 UI
```

## 核心模块

### 1. 前端层

#### 页面路由 (app/)
```
app/
├── (auth)/              # 认证路由组
│   ├── login/          # 登录
│   └── register/       # 注册
├── dashboard/          # 仪表板
├── products/           # 商品浏览
│   └── [id]/          # 商品详情
├── admin/              # 管理后台
│   └── real-crawler/  # 爬虫控制台
├── search/             # 搜索
├── compare/            # 对比
├── reports/            # 报告
├── profile/            # 个人中心
└── api/                # API Routes
    ├── crawl/         # 爬虫 API
    │   ├── real/      # 真实爬虫
    │   └── sync/      # 同步检测
    ├── categories/    # 类目 API
    ├── keywords/      # 关键词 API
    └── products/      # 商品 API
```

#### 组件架构 (components/)
```
components/
├── ui/                 # 基础 UI 组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── charts.tsx
├── features/           # 功能组件
│   ├── product-card.tsx
│   ├── metric-card.tsx
│   └── filters.tsx
├── layout/             # 布局组件
│   └── navbar.tsx
└── error/              # 错误处理
    └── error-boundary.tsx
```

### 2. API 层

#### API Routes 结构
```typescript
// app/api/trends/products/route.ts
export async function GET(request: NextRequest) {
  // 1. 认证检查
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. 参数验证
  const params = validateParams(request.nextUrl.searchParams);
  
  // 3. 业务逻辑
  const products = await fetchTrendingProducts(params);
  
  // 4. 返回响应
  return NextResponse.json({ data: products });
}
```

### 3. 业务逻辑层

#### 趋势分析引擎 (lib/analytics/trend-scoring.ts)
```typescript
export function calculateTrendScore(product: Product): number {
  const searchScore = normalizeSearchVolume(product.searchVolume);
  const growthScore = calculateGrowthRate(product.salesHistory);
  const priceScore = calculatePriceStability(product.priceHistory);
  
  return (
    0.4 * searchScore +
    0.35 * growthScore +
    0.15 * priceScore +
    0.1 * (product.isNew ? 1 : 0)
  );
}
```

#### 竞争分析引擎 (lib/analytics/competition-scoring.ts)
```typescript
export function calculateCompetitionScore(product: Product): number {
  const sellerScore = normalizeSellerCount(product.sellerCount);
  const priceVariance = calculatePriceVariance(product.prices);
  const marketConcentration = calculateHHI(product.marketShare);
  
  return (
    0.35 * sellerScore +
    0.25 * priceVariance +
    0.25 * marketConcentration +
    0.15 * normalizeReviewCount(product.reviewCount)
  );
}
```

#### 推荐引擎 (lib/analytics/recommendation.ts)
```typescript
export function calculateRecommendationScore(product: Product): number {
  const trendScore = calculateTrendScore(product);
  const competitionScore = calculateCompetitionScore(product);
  const profitMargin = estimateProfitMargin(product).margin;
  
  return (
    0.4 * trendScore -
    0.3 * competitionScore +
    0.3 * profitMargin
  );
}
```

### 4. 数据层

#### Supabase 客户端
```typescript
// lib/supabase/client.ts - 客户端使用
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/supabase/server.ts - 服务端使用
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );
}
```

#### 数据库表结构
```sql
-- 核心表
products              -- 商品数据
  - platform_id       -- 平台商品ID
  - platform          -- 平台 (amazon/aliexpress)
  - category_id       -- 类目ID
  - trend_score       -- 趋势分数
  - competition_score -- 竞争分数
  - recommendation_score -- 推荐分数

trend_history         -- 趋势历史
categories            -- 类目
  - platform          -- 平台标识 (amazon/aliexpress) 🆕
  - level             -- 类目层级
  - parent_id         -- 父类目ID

keywords              -- 关键词
  - category_id       -- 关联类目
  - search_volume     -- 搜索量
  - competition_level -- 竞争程度

-- 用户相关
users                 -- 用户信息
user_favorites        -- 用户收藏
user_preferences      -- 用户偏好
notifications         -- 通知

-- 系统表
crawl_logs           -- 爬虫日志
  - platform          -- 爬取平台
  - status            -- 状态 (started/completed/failed)
  - products_found    -- 找到商品数
  - products_saved    -- 保存商品数
  - duration_ms       -- 执行时长
```

## 认证流程

### 注册流程
```
用户填写表单
    ↓
客户端验证 (Zod)
    ↓
调用 signUp()
    ↓
Supabase Auth 创建用户
    ↓
更新本地状态
    ↓
跳转到仪表板
```

### 登录流程
```
用户填写表单
    ↓
调用 signIn()
    ↓
Supabase Auth 验证
    ↓
获取 JWT Token
    ↓
更新本地状态
    ↓
跳转到仪表板
```

### 路由保护
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  
  const protectedPaths = ['/dashboard', '/products', '/profile'];
  
  if (!session && protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}
```

## 数据采集流程

### 真实爬虫系统架构

```
用户触发爬取 (admin/real-crawler)
    ↓
POST /api/crawl/real
    ↓
CrawlerManager.executeCrawlTask()
    ↓
根据平台选择爬虫
    ├─ Amazon: RealAmazonCrawler
    └─ AliExpress: RealAliExpressCrawler
    ↓
Puppeteer 启动浏览器
    ↓
访问目标网站
    ├─ 使用关键词搜索
    └─ 或按类目浏览 🆕
    ↓
Cheerio 解析 HTML
    ↓
提取商品数据
    ├─ 标题、价格、评分
    ├─ 评论数、图片
    └─ 商品 URL
    ↓
计算评分
    ├─ 趋势分数
    ├─ 竞争分数
    └─ 推荐分数
    ↓
保存到数据库 (products)
    ↓
记录爬取日志 (crawl_logs)
    ↓
返回结果
    ↓
自动跳转到商品列表
    ↓
同步检测 Hook 启动
    ↓
每 10 秒检查新数据
    ↓
显示通知横幅
    ↓
用户点击刷新
    ↓
显示新商品（带 🆕 标签）
```

### 平台特定类目系统 🆕

```
categories 表
    ├─ platform: 'amazon'
    │   ├─ Electronics (27 个一级类目)
    │   └─ ... (64 个二级类目)
    └─ platform: 'aliexpress'
        ├─ Consumer Electronics (20 个一级类目)
        └─ ... (32 个二级类目)

前端选择平台
    ↓
GET /api/categories?platform=amazon
    ↓
返回该平台的类目列表
    ↓
用户选择类目
    ↓
爬虫使用对应平台的类目名称搜索
```

### 任务队列
```typescript
// lib/crawler/queue.ts
export class CrawlQueue {
  private queue: CrawlTask[] = [];
  
  async addTask(config: CrawlConfig): Promise<string> {
    const task = {
      id: generateId(),
      status: 'pending',
      config,
      createdAt: new Date(),
    };
    
    this.queue.push(task);
    await this.saveToDB(task);
    
    return task.id;
  }
  
  async processNext(): Promise<void> {
    const task = this.queue.find(t => t.status === 'pending');
    if (!task) return;
    
    task.status = 'running';
    await this.updateDB(task);
    
    try {
      const data = await this.executeCrawl(task.config);
      await this.processData(data);
      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
    }
    
    await this.updateDB(task);
  }
}
```

## 缓存策略

### 多级缓存
```
1. 浏览器缓存
   - 静态资源 (图片、CSS、JS)
   - Service Worker 缓存

2. Vercel Edge Cache
   - 页面缓存 (ISR)
   - API 响应缓存

3. React Query 缓存
   - 客户端数据缓存
   - 自动失效和重新获取

4. Next.js 数据缓存
   - fetch() 缓存
   - 服务端组件缓存
```

### 缓存配置
```typescript
// API Route 缓存
export const revalidate = 3600; // 1小时

// React Query 缓存
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000,  // 5分钟
  cacheTime: 30 * 60 * 1000, // 30分钟
});

// fetch 缓存
fetch(url, {
  next: { revalidate: 3600 }
});
```

## 性能优化

### 代码分割
- 路由级别自动分割
- 动态导入重组件
- 懒加载图表库

### 图片优化
```typescript
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={300}
  height={300}
  loading="lazy"
/>
```

### 数据库优化
```sql
-- 索引优化
CREATE INDEX idx_products_trend_score ON products(trend_score DESC);
CREATE INDEX idx_products_category ON products(category);

-- 全文搜索
CREATE INDEX idx_products_name_fts 
ON products USING gin(to_tsvector('english', name));
```

## 安全措施

### 认证安全
- JWT Token 认证
- Refresh Token 自动刷新
- 密码自动加密 (bcrypt)

### 数据安全
- Row Level Security (RLS)
- HTTPS 强制传输
- 输入验证 (Zod)

### API 安全
- Rate Limiting
- CSRF 保护
- XSS 防护
- SQL 注入防护

## 监控与日志

### Vercel 监控
- 实时日志
- 性能分析
- 错误追踪

### Supabase 监控
- 数据库性能
- API 使用情况
- 认证日志

### 自定义日志
```typescript
// lib/utils/logger.ts
export function logError(error: Error, context?: any) {
  console.error('[Error]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
```

## 部署流程

### 开发环境
```bash
npm install
npm run dev
```

### 生产部署
```bash
# 1. 推送到 GitHub
git push origin main

# 2. Vercel 自动部署
# 或手动部署
vercel --prod

# 3. 配置环境变量 (Vercel Dashboard)
# 4. 执行数据库迁移 (Supabase Dashboard)
```

## 最新功能 (2024-10-29)

### 1. 类目浏览爬取 🆕
- 支持不输入关键词，直接爬取整个类目
- 关键词字段改为可选
- 系统自动使用类目名称作为搜索词
- 用户确认提示避免误操作

### 2. 平台特定类目系统 🆕
- categories 表添加 platform 字段
- Amazon 类目：91 个（27 个一级 + 64 个二级）
- AliExpress 类目：52 个（20 个一级 + 32 个二级）
- 前端根据平台自动加载对应类目
- 切换平台时自动清空类目选择

### 3. 爬虫数据实时同步 🆕
- 爬取完成后自动跳转到商品列表
- 每 10 秒自动检测新数据
- 显示绿色通知横幅
- 新商品带有 🆕 标签（24小时内）
- 用户可选择立即刷新或稍后查看

### 4. 爬虫管理优化
- 真实爬虫控制台 (/admin/real-crawler)
- 支持 Amazon 和 AliExpress 平台
- 实时显示爬取进度和结果
- 爬取统计和日志查看
- 批量爬取支持

## 技术亮点

### 1. 真实网页爬取
- 使用 Puppeteer 模拟真实浏览器
- 随机 User-Agent 避免检测
- 智能延迟模拟人类行为
- 多种选择器策略提高成功率

### 2. 智能评分算法
```typescript
// 趋势分数 (0-100)
trendScore = 
  0.4 * searchVolume +
  0.35 * growthRate +
  0.15 * priceStability +
  0.1 * isNew

// 竞争分数 (0-100)
competitionScore = 
  0.35 * sellerCount +
  0.25 * priceVariance +
  0.25 * marketConcentration +
  0.15 * reviewCount

// 推荐分数 (0-100)
recommendationScore = 
  0.4 * trendScore -
  0.3 * competitionScore +
  0.3 * profitMargin
```

### 3. 实时数据同步
- 使用 React Hook (useCrawlerSync)
- 轮询检测新数据（10秒间隔）
- 基于时间戳过滤（只查询新数据）
- 自动显示通知和刷新提示

### 4. 平台独立性
- 每个平台独立的类目体系
- 类目名称符合平台规范
- 搜索结果更准确
- 易于扩展新平台

## 扩展性

### 水平扩展
- Vercel 自动扩展
- 无服务器架构
- 全球 CDN
- Serverless Functions 并发执行

### 功能扩展
- 模块化爬虫设计
- 插件式平台支持
- API 版本控制
- 易于添加新平台

### 数据扩展
- 数据库分区
- 读取副本
- 缓存层扩展
- 平台特定索引优化

## 相关文档

- [类目浏览功能](./CATEGORY_BROWSE_FEATURE.md)
- [平台特定类目系统](./PLATFORM_SPECIFIC_CATEGORIES.md)
- [AliExpress 设置指南](./SETUP_ALIEXPRESS.md)
- [爬虫同步快速开始](./SYNC_QUICKSTART.md)
- [Amazon 类目列表](./AMAZON_CATEGORIES.md)
