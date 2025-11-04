# API接口文档

## 基础信息

- 基础URL: `/api`
- 认证方式: Supabase Auth (Bearer Token)
- 响应格式: JSON

## 趋势数据API

### 获取仪表板数据

```
GET /api/trends/dashboard
```

**查询参数:**
- `timeRange` (可选): 时间范围，默认30d

**响应示例:**
```json
{
  "platforms": [
    {
      "platform": "Amazon",
      "product_count": 1250,
      "avg_trend_score": 72.5,
      "growth_rate": 12.3
    }
  ]
}
```

### 获取商品列表

```
GET /api/trends/products
```

**查询参数:**
- `category` (可选): 类目筛选
- `platform` (可选): 平台筛选
- `minPrice` (可选): 最低价格
- `maxPrice` (可选): 最高价格
- `sortBy` (可选): 排序字段
- `sortOrder` (可选): 排序方向 (asc/desc)
- `limit` (可选): 返回数量，默认20
- `offset` (可选): 偏移量，默认0

**响应示例:**
```json
{
  "products": [
    {
      "id": "123",
      "name": "商品名称",
      "platform": "Amazon",
      "category": "电子产品",
      "price": 99.99,
      "trend_score": 85,
      "competition_score": 45,
      "recommendation_score": 78
    }
  ],
  "total": 1250,
  "limit": 20,
  "offset": 0
}
```

### 获取商品详情

```
GET /api/trends/products/[id]
```

**响应示例:**
```json
{
  "product": {
    "id": "123",
    "name": "商品名称",
    "description": "商品描述",
    "platform": "Amazon",
    "category": "电子产品",
    "price": 99.99,
    "trend_score": 85,
    "competition_score": 45,
    "recommendation_score": 78,
    "sales_rank": 1250,
    "seller_count": 45,
    "keywords": ["关键词1", "关键词2"]
  }
}
```

### 获取类目数据

```
GET /api/trends/categories
```

**响应示例:**
```json
{
  "categories": [
    {
      "name": "电子产品",
      "product_count": 450,
      "avg_trend_score": 72.5
    }
  ]
}
```

### 趋势对比

```
GET /api/trends/compare
```

**查询参数:**
- `productIds` (必需): 商品ID列表，逗号分隔
- `timeRange` (可选): 时间范围

**响应示例:**
```json
{
  "comparison": [
    {
      "product_id": "123",
      "product_name": "商品A",
      "yoy_growth": 15.5,
      "mom_growth": 3.2,
      "is_seasonal": false
    }
  ]
}
```

## 搜索API

### 搜索商品

```
GET /api/search
```

**查询参数:**
- `q` (必需): 搜索关键词
- `platform` (可选): 平台筛选
- `category` (可选): 类目筛选
- `limit` (可选): 返回数量

**响应示例:**
```json
{
  "query": "无线耳机",
  "results": [...],
  "count": 25
}
```

### 搜索建议

```
GET /api/search/suggestions
```

**查询参数:**
- `q` (必需): 搜索关键词（至少2个字符）
- `limit` (可选): 返回数量，默认10

**响应示例:**
```json
{
  "query": "无线",
  "suggestions": ["无线耳机", "无线充电器", "无线鼠标"]
}
```

### 相关关键词

```
GET /api/search/related
```

**查询参数:**
- `keyword` (必需): 关键词
- `limit` (可选): 返回数量

**响应示例:**
```json
{
  "keyword": "无线耳机",
  "related": [
    {
      "keyword": "蓝牙耳机",
      "frequency": 45
    }
  ],
  "categories": ["电子产品", "音频设备"]
}
```

## 推荐API

### 获取推荐商品

```
GET /api/recommendations
```

**查询参数:**
- `userId` (可选): 用户ID（用于个性化推荐）
- `category` (可选): 类目筛选
- `limit` (可选): 返回数量

**响应示例:**
```json
{
  "recommendations": [...],
  "count": 10,
  "personalized": true
}
```

## 用户API

### 用户偏好设置

```
GET /api/user/preferences
PUT /api/user/preferences
```

**请求体 (PUT):**
```json
{
  "preferred_categories": ["电子产品", "家居用品"],
  "preferred_platforms": ["Amazon", "eBay"],
  "min_price": 10,
  "max_price": 500
}
```

### 商品收藏

```
GET /api/user/favorites
POST /api/user/favorites
DELETE /api/user/favorites?product_id=123
```

**请求体 (POST):**
```json
{
  "product_id": "123"
}
```

### 筛选组合

```
GET /api/user/filters
POST /api/user/filters
DELETE /api/user/filters?id=456
```

**请求体 (POST):**
```json
{
  "name": "我的筛选",
  "filters": {
    "category": "电子产品",
    "minPrice": 50,
    "maxPrice": 200
  }
}
```

### 通知偏好

```
GET /api/user/notifications
PUT /api/user/notifications
```

**请求体 (PUT):**
```json
{
  "email_enabled": true,
  "push_enabled": false,
  "watched_categories": ["电子产品"],
  "watched_keywords": ["无线耳机"],
  "trend_threshold": 70
}
```

## 通知API

### 获取通知列表

```
GET /api/notifications
```

**查询参数:**
- `unreadOnly` (可选): 只返回未读通知

**响应示例:**
```json
{
  "notifications": [
    {
      "id": "789",
      "type": "info",
      "title": "新兴趋势",
      "message": "发现新的热门商品",
      "read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

### 创建通知

```
POST /api/notifications
```

**请求体:**
```json
{
  "type": "info",
  "title": "通知标题",
  "message": "通知内容"
}
```

### 更新通知状态

```
PATCH /api/notifications
```

**请求体:**
```json
{
  "notificationId": "789",
  "read": true
}
```

## 报告API

### 生成报告

```
POST /api/reports/generate
```

**请求体:**
```json
{
  "name": "2024年Q1趋势报告",
  "template": "trend-overview",
  "categories": ["电子产品"],
  "platforms": ["Amazon"],
  "dateRange": "最近90天"
}
```

**响应示例:**
```json
{
  "report": {
    "id": "report_123",
    "name": "2024年Q1趋势报告",
    "template": "trend-overview",
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "data": {...},
  "message": "报告生成成功"
}
```

## 错误响应

所有API在出错时返回统一格式：

```json
{
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

常见HTTP状态码：
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权
- `404` - 资源不存在
- `500` - 服务器错误

## 速率限制

- 默认限制: 60次/分钟
- 超过限制返回 `429 Too Many Requests`
