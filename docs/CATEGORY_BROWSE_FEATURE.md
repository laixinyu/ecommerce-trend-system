# 类目浏览爬取功能

## 功能概述

真实爬虫控制台现在支持不输入关键词，直接爬取整个类目下的商品。这个功能允许你按照亚马逊或 AliExpress 的类目结构来浏览和爬取商品，而不需要指定具体的搜索关键词。

## 使用方法

### 1. 访问爬虫控制台

```
http://localhost:3000/admin/real-crawler
```

### 2. 配置爬取任务

1. **选择平台**: Amazon 或 AliExpress
2. **搜索关键词**: 
   - 从下拉列表选择"不使用关键词（爬取整个类目）"
   - 或勾选"自定义输入"后留空输入框
3. **选择分类**: 从下拉列表选择要爬取的类目
4. **设置爬取页数**: 1-5 页

### 3. 开始爬取

点击"开始爬取"按钮，系统会：
- 如果未输入关键词，会提示确认是否爬取整个类目
- 使用类目名称作为搜索词进行爬取
- 保存商品到对应的类目下

## 工作原理

### 关键词为空时的处理逻辑

```typescript
// 1. 前端验证
if (!keyword && !useCustomKeyword) {
  const confirmed = confirm('未输入关键词，将爬取整个类目下的商品。是否继续？');
  if (!confirmed) return;
}

// 2. 后端获取类目名称
if (!keyword) {
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();
  
  categoryName = category.name; // 例如: "Electronics"
}

// 3. 使用类目名称进行爬取
const searchUrl = `${baseUrl}/s?k=${encodeURIComponent(categoryName)}`;
```

### 数据流程

```
用户选择类目 (Electronics)
         ↓
不输入关键词
         ↓
系统获取类目名称 (Electronics)
         ↓
使用类目名称作为搜索词
         ↓
爬取 Amazon/AliExpress 上的 Electronics 商品
         ↓
保存到 Electronics 类目下
```

## 示例场景

### 场景 1: 爬取整个 Electronics 类目

```
平台: Amazon
关键词: （留空）
分类: Electronics
页数: 3

结果: 爬取 Amazon Electronics 类目下的商品
```

### 场景 2: 在类目下搜索特定关键词

```
平台: Amazon
关键词: wireless headphones
分类: Electronics
页数: 2

结果: 在 Electronics 类目下搜索 "wireless headphones"
```

### 场景 3: 爬取子类目

```
平台: Amazon
关键词: （留空）
分类: Electronics > Headphones
页数: 2

结果: 爬取 Headphones 子类目下的商品
```

## 优势

### 1. 更全面的数据采集
- 不局限于特定关键词
- 可以获取类目下的热门商品
- 适合发现新的商品趋势

### 2. 灵活的爬取策略
- 可以选择使用关键词或不使用
- 支持类目级别的批量爬取
- 适应不同的数据采集需求

### 3. 更好的类目覆盖
- 确保每个类目都有商品数据
- 便于类目级别的趋势分析
- 支持类目对比研究

## 技术实现

### 修改的文件

1. **前端页面** (`app/admin/real-crawler/page.tsx`)
   - 关键词字段改为可选
   - 添加"不使用关键词"选项
   - 添加确认提示

2. **API 路由** (`app/api/crawl/real/route.ts`)
   - 移除关键词必填验证
   - 支持空关键词传递

3. **爬虫管理器** (`lib/crawler/crawler-manager.ts`)
   - 当关键词为空时，获取类目名称
   - 将类目名称传递给爬虫

4. **Amazon 爬虫** (`lib/crawler/real-amazon-crawler.ts`)
   - 支持 `categoryName` 参数
   - 使用类目名称构建搜索 URL

5. **AliExpress 爬虫** (`lib/crawler/real-aliexpress-crawler.ts`)
   - 支持 `categoryName` 参数
   - 使用类目名称构建搜索 URL

### 关键代码片段

#### 前端确认提示
```typescript
if (!keyword && !useCustomKeyword) {
  const confirmed = confirm('未输入关键词，将爬取整个类目下的商品。是否继续？');
  if (!confirmed) return;
}
```

#### 获取类目名称
```typescript
if (!keyword) {
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();
  
  if (category) {
    categoryName = category.name;
  }
}
```

#### 构建搜索 URL
```typescript
let searchUrl: string;
if (keyword) {
  searchUrl = `${baseUrl}/s?k=${encodeURIComponent(keyword)}`;
} else if (categoryName) {
  searchUrl = `${baseUrl}/s?k=${encodeURIComponent(categoryName)}`;
} else {
  searchUrl = `${baseUrl}/s?k=best+sellers`;
}
```

## 注意事项

### 1. 爬取速度
- 按类目爬取可能返回大量商品
- 建议从较小的页数开始（1-2 页）
- 避免频繁爬取导致 IP 被封

### 2. 类目选择
- 选择具体的子类目效果更好
- 一级类目可能范围太广
- 建议先测试小范围类目

### 3. 数据质量
- 类目爬取的商品可能更分散
- 关键词搜索的商品更精准
- 根据需求选择合适的方式

### 4. 资源消耗
- 类目爬取消耗更多时间
- 建议在非高峰时段运行
- 考虑使用代理服务器

## 最佳实践

### 1. 组合使用
```
第一步: 按类目爬取，获取类目概览
第二步: 使用关键词精准爬取热门商品
第三步: 定期更新数据
```

### 2. 分批爬取
```
不要一次爬取所有类目
建议每次爬取 2-3 个类目
每个类目 1-2 页
```

### 3. 监控结果
```
检查爬取的商品数量
验证商品是否属于正确类目
查看商品质量和相关性
```

## 常见问题

### Q1: 不输入关键词会爬取什么商品？
A: 系统会使用类目名称作为搜索词，例如选择 "Electronics" 类目，就会搜索 "Electronics" 相关的商品。

### Q2: 类目爬取和关键词搜索有什么区别？
A: 
- **类目爬取**: 范围更广，获取类目下的各种商品
- **关键词搜索**: 更精准，获取特定关键词的商品

### Q3: 可以同时爬取多个类目吗？
A: 目前需要逐个爬取，但可以使用批量爬取 API 实现多类目爬取。

### Q4: 爬取的商品会保存到哪个类目？
A: 商品会保存到你选择的类目下，`category_id` 字段会设置为选择的类目 ID。

## 未来改进

### 计划中的功能

1. **批量类目爬取**
   - 一次选择多个类目
   - 自动排队执行
   - 进度跟踪

2. **智能类目推荐**
   - 根据历史数据推荐类目
   - 显示类目商品数量
   - 类目热度分析

3. **定时类目爬取**
   - 设置定时任务
   - 自动更新类目数据
   - 邮件通知结果

4. **类目深度爬取**
   - 支持爬取子类目
   - 递归爬取类目树
   - 类目关系维护

## 相关文档

- [爬虫使用指南](./CRAWLER_SYNC.md)
- [类目快速参考](./CATEGORY_QUICK_REFERENCE.md)
- [亚马逊类目列表](./AMAZON_CATEGORIES.md)

## 更新日志

**2024-10-29**
- ✅ 实现类目浏览爬取功能
- ✅ 关键词字段改为可选
- ✅ 添加用户确认提示
- ✅ 支持使用类目名称进行爬取
- ✅ 更新前端界面和提示文本

