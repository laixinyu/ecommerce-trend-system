# 数据采集调度系统

## 快速开始

### 1. 配置环境变量

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret_key
```

### 2. 运行数据库迁移

```bash
# 执行爬取日志表迁移
psql -d your_database -f supabase/migrations/004_crawl_logs.sql
```

### 3. 启动调度器

调度器会在以下情况自动启动：
- Vercel Cron Job触发时（每2小时）
- 首次API调用时
- 手动通过管理界面启动

### 4. 访问监控界面

访问 `http://localhost:3000/admin/crawl` 查看：
- 调度器运行状态
- 任务队列统计
- 平台调度配置
- 最近执行日志

## 核心文件

```
lib/crawler/
├── queue.ts          # 任务队列管理
├── scheduler.ts      # 调度器核心逻辑
└── README.md         # 本文件

app/api/
├── cron/crawl/       # Vercel Cron端点
├── crawl/
│   ├── scheduler/    # 调度器控制API
│   └── logs/         # 日志查询API

components/admin/
└── crawl-monitor.tsx # 监控界面组件

supabase/migrations/
└── 004_crawl_logs.sql # 日志表迁移
```

## 使用示例

### 手动触发爬取

```typescript
// 通过API
const response = await fetch('/api/crawl/scheduler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'trigger',
    platform: 'amazon',
    category: 'Electronics',
  }),
});
```

### 查询日志

```typescript
const response = await fetch('/api/crawl/logs?platform=amazon&limit=20');
const { data } = await response.json();
console.log(data.logs);
```

### 控制调度器

```typescript
// 启动
await fetch('/api/crawl/scheduler', {
  method: 'POST',
  body: JSON.stringify({ action: 'start' }),
});

// 停止
await fetch('/api/crawl/scheduler', {
  method: 'POST',
  body: JSON.stringify({ action: 'stop' }),
});
```

## 调度配置

默认配置：

| 平台 | 间隔 | 类目数 |
|------|------|--------|
| Amazon | 60分钟 | 3 |
| AliExpress | 120分钟 | 3 |
| eBay | 180分钟 | 3 |

可以通过API动态调整配置。

## 详细文档

查看 [docs/crawler-scheduler.md](../../docs/crawler-scheduler.md) 获取完整文档。
