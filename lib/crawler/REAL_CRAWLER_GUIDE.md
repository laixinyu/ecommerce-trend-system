# 真实爬虫使用指南

## 概述

本项目现在支持真实的网页爬虫功能，可以从 Amazon 和 AliExpress 抓取实际的商品数据。

## 技术栈

- **Puppeteer**: 无头浏览器，用于模拟真实用户访问
- **Cheerio**: HTML 解析器，用于提取数据
- **Axios**: HTTP 客户端（备用）

## 功能特性

### 1. 支持的平台
- ✅ Amazon (amazon.com)
- ✅ AliExpress (aliexpress.com)

### 2. 核心功能
- 关键词搜索
- 多页爬取
- 商品详情提取
- 自动保存到数据库
- 爬取日志记录
- 统计分析

### 3. 反爬虫措施
- 随机用户代理
- 随机延迟
- 请求限流
- 代理支持（可选）

## 快速开始

### 1. 安装依赖

依赖已经安装：
```bash
npm install puppeteer cheerio axios
```

### 2. 配置环境变量

在 `.env.local` 中添加（可选）：

```env
# 爬虫配置
CRAWLER_HEADLESS=true
CRAWLER_TIMEOUT=30000

# 代理配置（可选，推荐使用）
CRAWLER_PROXY_SERVER=http://proxy.example.com:8080
CRAWLER_PROXY_USERNAME=your_username
CRAWLER_PROXY_PASSWORD=your_password
```

### 3. 使用管理界面

访问：`http://localhost:3000/admin/real-crawler`

在界面中：
1. 选择平台（Amazon 或 AliExpress）
2. 输入搜索关键词
3. 输入分类 ID（从数据库获取）
4. 设置爬取页数（1-5）
5. 点击"开始爬取"

### 4. 使用 API

#### 单个爬取任务

```bash
curl -X POST http://localhost:3000/api/crawl/real \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "amazon",
    "keyword": "wireless earbuds",
    "categoryId": "your-category-id",
    "maxPages": 2
  }'
```

#### 批量爬取

```bash
curl -X PUT http://localhost:3000/api/crawl/real \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "platform": "amazon",
        "keyword": "wireless earbuds",
        "categoryId": "category-id-1",
        "maxPages": 2
      },
      {
        "platform": "aliexpress",
        "keyword": "bluetooth headphones",
        "categoryId": "category-id-2",
        "maxPages": 2
      }
    ]
  }'
```

#### 获取统计

```bash
curl http://localhost:3000/api/crawl/real
```

### 5. 编程方式使用

```typescript
import { crawlerManager } from '@/lib/crawler/crawler-manager';

// 单个任务
const result = await crawlerManager.executeCrawlTask({
  platform: 'amazon',
  keyword: 'wireless earbuds',
  categoryId: 'your-category-id',
  maxPages: 2,
});

console.log(`Saved ${result.productsSaved} products`);

// 批量任务
const results = await crawlerManager.executeCrawlTasks([
  { platform: 'amazon', keyword: 'earbuds', categoryId: 'id1', maxPages: 2 },
  { platform: 'aliexpress', keyword: 'headphones', categoryId: 'id2', maxPages: 2 },
]);

// 按分类爬取
const results = await crawlerManager.crawlByCategory('category-id', ['amazon', 'aliexpress']);
```

## 数据提取

### Amazon 提取的数据
- ASIN（商品唯一标识）
- 商品标题
- 当前价格
- 原价（如有折扣）
- 评分（1-5 星）
- 评论数量
- 商品图片
- 商品链接

### AliExpress 提取的数据
- 商品 ID
- 商品标题
- 当前价格
- 原价（如有折扣）
- 评分（1-5 星）
- 订单数量
- 商品图片
- 商品链接

## 性能优化

### 1. 爬取速度
- 每页爬取时间：2-4 秒
- 页面间延迟：2-4 秒
- 任务间延迟：5-10 秒

### 2. 资源使用
- 内存：每个浏览器实例约 100-200MB
- CPU：中等使用率
- 网络：取决于页面大小

### 3. 优化建议
- 使用代理服务器分散请求
- 限制并发浏览器数量
- 合理设置爬取页数
- 定期清理浏览器缓存

## 注意事项

### ⚠️ 法律和道德考虑

1. **遵守服务条款**
   - 阅读并遵守目标网站的服务条款
   - 尊重 robots.txt 文件
   - 不要过度频繁地请求

2. **推荐使用官方 API**
   - Amazon: [Product Advertising API](https://webservices.amazon.com/paapi5/documentation/)
   - AliExpress: [Open Platform API](https://developers.aliexpress.com/)

3. **代理使用**
   - 使用住宅代理而非数据中心代理
   - 轮换 IP 地址
   - 避免被封禁

4. **数据使用**
   - 仅用于个人研究或合法商业用途
   - 不要转售爬取的数据
   - 尊重知识产权

### 🔧 故障排除

#### Chromium 下载失败
```bash
# 手动设置 Chromium 下载镜像
export PUPPETEER_DOWNLOAD_HOST=https://registry.npmmirror.com/-/binary/chromium-browser-snapshots
npm install puppeteer
```

#### 爬取失败
- 检查网络连接
- 验证选择器是否正确（网站可能更新）
- 增加超时时间
- 使用代理服务器

#### 内存不足
- 减少并发浏览器数量
- 及时关闭浏览器实例
- 增加服务器内存

## 高级配置

### 自定义选择器

编辑 `lib/crawler/config.ts` 中的 `platformConfigs`：

```typescript
export const platformConfigs = {
  amazon: {
    selectors: {
      searchResults: '[data-component-type="s-search-result"]',
      productTitle: 'h2 a span',
      // ... 更多选择器
    },
  },
};
```

### 添加新平台

1. 创建新的爬虫类（参考 `real-amazon-crawler.ts`）
2. 在 `crawler-manager.ts` 中注册
3. 更新类型定义

## 监控和日志

### 查看爬取日志

```sql
SELECT * FROM crawl_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 监控指标
- 成功率
- 平均耗时
- 商品数量
- 错误类型

## 定时任务

可以配合 Vercel Cron 或其他调度器定期爬取：

```typescript
// app/api/cron/crawl/route.ts
export async function GET() {
  const results = await crawlerManager.crawlByCategory(
    'category-id',
    ['amazon', 'aliexpress']
  );
  
  return Response.json({ results });
}
```

## 最佳实践

1. **从小规模开始**：先爬取 1-2 页测试
2. **使用代理**：避免 IP 被封
3. **监控日志**：及时发现问题
4. **定期更新**：网站结构可能变化
5. **备份数据**：定期备份爬取的数据
6. **遵守规则**：尊重网站的爬虫政策

## 支持

如有问题，请查看：
- 控制台日志
- 数据库 crawl_logs 表
- Puppeteer 文档：https://pptr.dev/

## 许可

本爬虫功能仅供学习和研究使用。使用者需自行承担法律责任。
