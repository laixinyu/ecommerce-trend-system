# 数据采集调度系统文档

## 概述

数据采集调度系统负责自动化地从多个电商平台（Amazon、AliExpress、eBay）采集商品数据，并提供任务队列管理、状态监控和日志记录功能。

## 系统架构

### 核心组件

1. **CrawlQueue (队列管理器)**
   - 管理待执行的爬取任务
   - 支持优先级排序
   - 实现并发控制
   - 提供重试机制

2. **CrawlScheduler (调度器)**
   - 定时创建爬取任务
   - 执行任务处理
   - 记录任务日志
   - 发送更新通知

3. **Vercel Cron Jobs (定时触发器)**
   - 每2小时触发一次数据采集
   - 确保调度器持续运行

## 功能特性

### 1. 自动调度

系统为每个平台配置了默认的调度策略：

- **Amazon**: 每60分钟采集一次
  - 类目: Electronics, Home & Kitchen, Sports & Outdoors
  
- **AliExpress**: 每120分钟采集一次
  - 类目: Consumer Electronics, Home Improvement, Sports & Entertainment
  
- **eBay**: 每180分钟采集一次
  - 类目: Electronics, Home & Garden, Sporting Goods

### 2. 任务队列

任务队列支持以下功能：

- **优先级管理**: high > medium > low
- **并发控制**: 默认最多3个任务同时执行
- **自动重试**: 失败任务自动重试（最多3次）
- **状态跟踪**: pending → running → completed/failed

### 3. 日志记录

系统记录每个任务的详细信息：

```typescript
interface CrawlLog {
  task_id: string;          // 任务ID
  platform: string;         // 平台名称
  status: string;           // 任务状态
  items_collected: number;  // 采集的商品数量
  error_message?: string;   // 错误信息
  started_at: string;       // 开始时间
  completed_at?: string;    // 完成时间
  duration_ms?: number;     // 执行时长
}
```

### 4. 状态监控

提供实时监控界面 (`/admin/crawl`)：

- 调度器运行状态
- 队列任务统计
- 平台调度配置
- 最近执行日志

## API接口

### 1. 获取调度器状态

```http
GET /api/crawl/scheduler
```

响应示例：
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "schedules": [
      {
        "platform": "amazon",
        "enabled": true,
        "interval": 60,
        "categories": 3
      }
    ],
    "queueStatus": {
      "pending": 5,
      "running": 2,
      "total": 7
    }
  }
}
```

### 2. 控制调度器

```http
POST /api/crawl/scheduler
Content-Type: application/json

{
  "action": "start" | "stop" | "update" | "trigger"
}
```

#### 启动调度器
```json
{
  "action": "start"
}
```

#### 停止调度器
```json
{
  "action": "stop"
}
```

#### 更新调度配置
```json
{
  "action": "update",
  "platform": "amazon",
  "config": {
    "enabled": true,
    "interval": 120
  }
}
```

#### 手动触发爬取
```json
{
  "action": "trigger",
  "platform": "amazon",
  "category": "Electronics",
  "keywords": ["laptop", "tablet"]
}
```

### 3. 查询爬取日志

```http
GET /api/crawl/logs?platform=amazon&status=completed&limit=50&offset=0
```

查询参数：
- `platform`: 平台筛选（可选）
- `status`: 状态筛选（可选）
- `limit`: 返回数量（默认50）
- `offset`: 偏移量（默认0）

响应示例：
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "statistics": {
      "total": 1000,
      "last24h": 48,
      "byStatus": {
        "completed": 45,
        "failed": 3,
        "started": 0
      },
      "byPlatform": {
        "amazon": 20,
        "aliexpress": 15,
        "ebay": 13
      }
    },
    "pagination": {
      "total": 1000,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Vercel Cron配置

在 `vercel.json` 中配置定时任务：

```json
{
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

Cron表达式说明：
- `0 */2 * * *`: 每2小时执行一次（整点）
- 格式: `分 时 日 月 周`

## 环境变量配置

```bash
# 应用URL（用于内部API调用）
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Job密钥（用于验证定时任务请求）
CRON_SECRET=your_random_secret_key
```

## 使用指南

### 启动调度器

调度器会在首次API调用或Cron触发时自动启动。也可以通过管理界面手动控制：

1. 访问 `/admin/crawl`
2. 点击"启动调度器"按钮

### 手动触发爬取

有两种方式手动触发爬取：

#### 方式1: 通过管理界面
1. 访问 `/admin/crawl`
2. 在平台列表中点击"手动触发"按钮

#### 方式2: 通过API
```bash
curl -X POST https://your-domain.com/api/crawl/scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "trigger",
    "platform": "amazon",
    "category": "Electronics"
  }'
```

### 查看日志

访问 `/admin/crawl` 查看最近的爬取日志，包括：
- 执行时间
- 平台名称
- 任务状态
- 采集数量
- 执行耗时

### 调整调度配置

通过API更新平台的调度配置：

```bash
curl -X POST https://your-domain.com/api/crawl/scheduler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update",
    "platform": "amazon",
    "config": {
      "enabled": true,
      "interval": 120,
      "categories": ["Electronics", "Books"]
    }
  }'
```

## 数据更新通知

当数据采集完成后，系统会自动向关注相关类目的用户发送通知：

1. 查询关注该类目的用户
2. 创建通知记录
3. 用户在通知中心可以看到更新提醒

通知内容包括：
- 平台名称
- 类目名称
- 采集的商品数量

## 错误处理

### 重试机制

任务失败时会自动重试：
- 默认最多重试3次
- 重试时任务重新加入队列
- 超过最大重试次数后标记为失败

### 错误日志

所有错误都会记录到数据库：
- 错误信息
- 发生时间
- 任务详情

### 监控告警

建议配置以下监控：
- 失败率超过阈值时告警
- 队列积压过多时告警
- 调度器停止运行时告警

## 性能优化

### 并发控制

默认最多3个任务同时执行，可以根据服务器性能调整：

```typescript
const crawlQueue = new CrawlQueue(5); // 增加到5个并发
```

### 调度间隔

根据数据更新频率调整调度间隔：
- 热门类目: 30-60分钟
- 普通类目: 2-3小时
- 冷门类目: 6-12小时

### 数据库优化

- 定期清理旧日志（保留30天）
- 为常用查询字段添加索引
- 使用分区表存储大量日志

## 故障排查

### 调度器未运行

1. 检查Cron Job是否正常触发
2. 查看服务器日志
3. 手动调用 `/api/cron/crawl` 测试

### 任务一直pending

1. 检查调度器是否运行
2. 查看并发限制是否过低
3. 检查是否有任务卡住

### 采集失败率高

1. 检查目标网站是否可访问
2. 查看错误日志确定原因
3. 调整重试策略或间隔

## 最佳实践

1. **合理设置调度间隔**: 避免过于频繁导致被封禁
2. **监控失败率**: 及时发现和处理问题
3. **定期清理日志**: 避免数据库膨胀
4. **使用优先级**: 重要任务设置高优先级
5. **配置告警**: 关键指标异常时及时通知

## 安全考虑

1. **Cron密钥验证**: 防止未授权的定时任务触发
2. **权限控制**: 只有管理员可以控制调度器
3. **速率限制**: 避免过度请求目标网站
4. **数据验证**: 验证采集的数据格式和内容

## 未来扩展

- [ ] 支持动态调整调度策略
- [ ] 实现智能调度（根据数据变化频率）
- [ ] 添加分布式任务队列支持
- [ ] 集成更多数据源
- [ ] 实现实时数据流处理
