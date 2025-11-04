# 项目结构说明

## 目录结构

```
ecommerce-trend-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 认证相关页面组
│   │   ├── login/              # 登录页面
│   │   └── register/           # 注册页面
│   ├── dashboard/              # 仪表板页面
│   ├── products/               # 商品浏览页面
│   │   └── [id]/              # 商品详情页面
│   ├── search/                 # 搜索页面
│   ├── compare/                # 趋势对比页面
│   ├── reports/                # 报告中心页面
│   ├── profile/                # 个人中心页面
│   ├── api/                    # API Routes
│   │   ├── trends/            # 趋势相关API
│   │   ├── search/            # 搜索相关API
│   │   ├── user/              # 用户相关API
│   │   └── crawl/             # 数据采集API
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
│
├── components/                  # React组件
│   ├── ui/                     # 基础UI组件
│   │   ├── button.tsx         # 按钮组件
│   │   ├── input.tsx          # 输入框组件
│   │   ├── card.tsx           # 卡片组件
│   │   ├── dialog.tsx         # 对话框组件
│   │   └── ...                # 其他UI组件
│   ├── layout/                 # 布局组件
│   │   ├── navbar.tsx         # 导航栏
│   │   ├── sidebar.tsx        # 侧边栏
│   │   ├── footer.tsx         # 页脚
│   │   └── layout.tsx         # 页面布局
│   └── features/               # 功能组件
│       ├── dashboard/         # 仪表板相关组件
│       ├── products/          # 商品相关组件
│       ├── search/            # 搜索相关组件
│       ├── charts/            # 图表组件
│       └── filters/           # 筛选器组件
│
├── lib/                        # 工具库
│   ├── utils/                 # 工具函数
│   │   ├── cn.ts             # 类名合并工具
│   │   ├── format.ts         # 格式化工具
│   │   └── index.ts          # 导出文件
│   ├── api/                   # API客户端
│   │   ├── supabase.ts       # Supabase客户端
│   │   ├── client.ts         # API客户端封装
│   │   └── endpoints.ts      # API端点定义
│   └── analytics/             # 分析算法
│       ├── trend.ts          # 趋势分析
│       ├── competition.ts    # 竞争分析
│       └── recommendation.ts # 推荐算法
│
├── hooks/                      # 自定义Hooks
│   ├── use-auth.ts            # 认证Hook
│   ├── use-trends.ts          # 趋势数据Hook
│   ├── use-products.ts        # 商品数据Hook
│   ├── use-search.ts          # 搜索Hook
│   └── use-categories.ts      # 类目数据Hook
│
├── types/                      # TypeScript类型定义
│   └── index.ts               # 核心类型定义
│
├── public/                     # 静态资源
│   ├── images/                # 图片资源
│   └── icons/                 # 图标资源
│
├── .env.local                  # 环境变量
├── .prettierrc                 # Prettier配置
├── eslint.config.mjs          # ESLint配置
├── tailwind.config.ts         # TailwindCSS配置
├── tsconfig.json              # TypeScript配置
├── next.config.ts             # Next.js配置
└── package.json               # 项目依赖

```

## 核心模块说明

### 1. App Router (app/)
采用Next.js 14的App Router架构，支持服务端渲染和客户端渲染。

- **页面路由**: 基于文件系统的路由
- **API Routes**: 后端API端点
- **布局系统**: 嵌套布局支持

### 2. 组件系统 (components/)
分层组件架构，便于复用和维护。

- **ui/**: 原子级UI组件，无业务逻辑
- **layout/**: 布局组件，定义页面结构
- **features/**: 功能组件，包含业务逻辑

### 3. 工具库 (lib/)
封装通用功能和业务逻辑。

- **utils/**: 纯函数工具
- **api/**: API客户端和数据获取
- **analytics/**: 数据分析算法

### 4. Hooks (hooks/)
自定义React Hooks，封装状态逻辑和副作用。

### 5. 类型定义 (types/)
TypeScript类型定义，确保类型安全。

## 命名规范

### 文件命名
- 组件文件: `kebab-case.tsx` (例如: `product-card.tsx`)
- 工具文件: `kebab-case.ts` (例如: `format-date.ts`)
- Hook文件: `use-*.ts` (例如: `use-auth.ts`)
- 类型文件: `*.types.ts` 或 `index.ts`

### 组件命名
- React组件: `PascalCase` (例如: `ProductCard`)
- Hook函数: `camelCase` (例如: `useAuth`)
- 工具函数: `camelCase` (例如: `formatDate`)
- 常量: `UPPER_SNAKE_CASE` (例如: `API_BASE_URL`)

## 代码组织原则

1. **单一职责**: 每个文件/组件只负责一个功能
2. **关注点分离**: UI、逻辑、数据分离
3. **可复用性**: 优先创建可复用的组件和函数
4. **类型安全**: 充分利用TypeScript类型系统
5. **性能优化**: 合理使用React优化技术

## 开发流程

1. 创建类型定义 (types/)
2. 实现工具函数 (lib/utils/)
3. 创建API客户端 (lib/api/)
4. 开发自定义Hooks (hooks/)
5. 构建UI组件 (components/ui/)
6. 组合功能组件 (components/features/)
7. 实现页面 (app/)
8. 编写测试

## 最佳实践

- 使用TypeScript严格模式
- 组件保持小而专注
- 优先使用函数组件和Hooks
- 合理使用服务端组件和客户端组件
- 遵循ESLint和Prettier规则
- 编写有意义的注释
- 保持代码简洁可读
