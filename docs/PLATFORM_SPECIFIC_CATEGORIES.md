# 平台特定类目系统

## 问题背景

之前的系统只有 Amazon 类目，当选择 AliExpress 平台时，使用 Amazon 类目名称去搜索 AliExpress 是不合理的，因为：

1. **类目体系不同**: Amazon 和 AliExpress 有完全不同的类目结构
2. **类目名称不同**: 相同商品在不同平台的类目名称可能不同
3. **搜索结果不准确**: 使用错误的类目名称会导致搜索结果不相关

## 解决方案

### 1. 数据库结构改进

为 `categories` 表添加 `platform` 字段，用于区分不同平台的类目：

```sql
ALTER TABLE categories 
ADD COLUMN platform VARCHAR(20) DEFAULT 'amazon';

-- 支持的平台值
CHECK (platform IN ('amazon', 'aliexpress', 'ebay', 'taobao', 'pinduoduo', 'all'))
```

### 2. 平台类目数据

#### Amazon 类目
- 27 个一级类目
- 64 个二级类目
- 总计 91 个类目
- 已标记为 `platform = 'amazon'`

#### AliExpress 类目
- 20 个一级类目
- 32 个二级类目
- 总计 52 个类目
- 标记为 `platform = 'aliexpress'`

### 3. 前端改进

#### 平台切换时自动加载对应类目

```typescript
// 当平台改变时，重新加载该平台的类目
useEffect(() => {
  loadKeywordsAndCategories();
}, [platform]);

// API 请求时带上平台参数
fetch(`/api/categories?platform=${platform}`)
```

#### 切换平台时清空类目选择

```typescript
onChange={(e) => {
  setPlatform(e.target.value as 'amazon' | 'aliexpress');
  setCategoryId(''); // 清空类目选择
}}
```

### 4. API 改进

Categories API 支持平台过滤：

```typescript
// GET /api/categories?platform=amazon
// GET /api/categories?platform=aliexpress
```

## 使用指南

### 1. 应用数据库迁移

```bash
# 在 Supabase Dashboard 中执行
# supabase/migrations/006_add_platform_to_categories.sql
```

### 2. 应用 AliExpress 类目

```bash
npm run update:categories:aliexpress
```

输出示例：
```
🚀 开始应用 AliExpress 类目...

📦 插入一级类目...
✅ Consumer Electronics
✅ Computer & Office
✅ Phones & Telecommunications
...

✨ 成功插入 20 个一级类目

📦 插入二级类目...
✅ Consumer Electronics > Smart Electronics
✅ Consumer Electronics > Video Games
...

✨ 成功插入 32 个二级类目

📊 AliExpress 类目统计:
   一级类目: 20 个
   二级类目: 32 个
   总计: 52 个

✅ AliExpress 类目应用完成！
```

### 3. 在爬虫控制台使用

1. 访问 `http://localhost:3000/admin/real-crawler`
2. 选择平台（Amazon 或 AliExpress）
3. 类目列表会自动更新为该平台的类目
4. 选择类目并开始爬取

## AliExpress 类目列表

### 一级类目

1. **Consumer Electronics** - 消费电子
2. **Computer & Office** - 电脑办公
3. **Phones & Telecommunications** - 手机通讯
4. **Home & Garden** - 家居园艺
5. **Jewelry & Accessories** - 珠宝配饰
6. **Bags & Shoes** - 箱包鞋类
7. **Toys & Hobbies** - 玩具爱好
8. **Watches** - 手表
9. **Beauty & Health** - 美妆健康
10. **Hair Extensions & Wigs** - 假发接发
11. **Apparel** - 服装
12. **Sports & Entertainment** - 运动娱乐
13. **Automobiles & Motorcycles** - 汽车摩托
14. **Home Improvement** - 家装建材
15. **Mother & Kids** - 母婴用品
16. **Lights & Lighting** - 灯具照明
17. **Security & Protection** - 安防保护
18. **Furniture** - 家具
19. **Tools** - 工具
20. **Luggage & Bags** - 行李箱包

### 二级类目示例

#### Consumer Electronics
- Smart Electronics
- Video Games
- Camera & Photo
- Portable Audio & Video

#### Computer & Office
- Computer Peripherals
- Laptop Parts
- Office Electronics
- Tablet Accessories

#### Phones & Telecommunications
- Mobile Phone Accessories
- Mobile Phones
- Phone Bags & Cases
- Communication Equipment

#### Home & Garden
- Home Decor
- Kitchen & Dining
- Home Textile
- Garden Supplies

#### Beauty & Health
- Makeup
- Skin Care
- Health Care
- Nail Art & Tools

#### Apparel
- Women's Clothing
- Men's Clothing
- Kids' Clothing
- Underwear & Sleepwear

## 技术实现

### 数据库查询

```typescript
// 获取 Amazon 类目
const { data } = await supabase
  .from('categories')
  .select('*')
  .eq('platform', 'amazon');

// 获取 AliExpress 类目
const { data } = await supabase
  .from('categories')
  .select('*')
  .eq('platform', 'aliexpress');
```

### 爬虫逻辑

```typescript
// 当没有关键词时，使用类目名称
if (!keyword) {
  const { data: category } = await supabase
    .from('categories')
    .select('name, platform')
    .eq('id', categoryId)
    .single();
  
  // 使用该平台的类目名称进行搜索
  categoryName = category.name;
}
```

## 数据流程

```
用户选择平台 (AliExpress)
         ↓
前端加载 AliExpress 类目列表
         ↓
用户选择类目 (Consumer Electronics)
         ↓
不输入关键词（或输入关键词）
         ↓
后端获取类目信息
         ↓
使用 AliExpress 类目名称搜索
         ↓
爬取 AliExpress 商品
         ↓
保存到对应类目
```

## 优势

### 1. 平台独立性
- 每个平台有自己的类目体系
- 类目名称符合平台规范
- 搜索结果更准确

### 2. 数据准确性
- 商品归类更准确
- 类目分析更有意义
- 趋势分析更可靠

### 3. 可扩展性
- 易于添加新平台类目
- 支持多平台对比
- 便于类目映射

### 4. 用户体验
- 自动切换类目列表
- 避免选择错误类目
- 提示更清晰

## 注意事项

### 1. 类目映射

不同平台的类目可能需要映射：

```typescript
// 示例：跨平台类目映射
const categoryMapping = {
  'Electronics': {
    amazon: 'Electronics',
    aliexpress: 'Consumer Electronics',
  },
  'Computers': {
    amazon: 'Computers',
    aliexpress: 'Computer & Office',
  },
};
```

### 2. 类目维护

- 定期更新类目数据
- 关注平台类目变化
- 清理过时类目

### 3. 数据迁移

现有商品数据需要注意：
- Amazon 商品已关联 Amazon 类目
- 新爬取的 AliExpress 商品会关联 AliExpress 类目
- 不同平台的商品在不同类目下

## 常见问题

### Q1: 现有的 Amazon 商品会受影响吗？
A: 不会。现有商品的 `category_id` 仍然指向 Amazon 类目，添加 `platform` 字段后，这些类目会被标记为 `platform = 'amazon'`。

### Q2: 可以在 Amazon 类目下爬取 AliExpress 商品吗？
A: 技术上可以，但不推荐。应该使用对应平台的类目以确保数据准确性。

### Q3: 如何添加新平台的类目？
A: 
1. 创建类似 `apply-aliexpress-categories.ts` 的脚本
2. 定义该平台的类目数据
3. 设置 `platform` 字段为新平台名称
4. 运行脚本应用类目

### Q4: 类目可以跨平台共享吗？
A: 可以设置 `platform = 'all'` 来创建通用类目，但通常不推荐，因为不同平台的类目体系差异较大。

## 未来改进

### 1. 类目同步
- 自动从平台 API 获取最新类目
- 定期更新类目数据
- 类目变更通知

### 2. 智能映射
- 自动识别相似类目
- 跨平台类目映射
- 商品自动归类

### 3. 类目分析
- 各平台类目热度对比
- 类目趋势分析
- 类目商品数量统计

### 4. 多语言支持
- 类目名称多语言
- 根据地区显示对应语言
- 支持国际化

## 相关文档

- [类目浏览功能](./CATEGORY_BROWSE_FEATURE.md)
- [Amazon 类目列表](./AMAZON_CATEGORIES.md)
- [类目快速参考](./CATEGORY_QUICK_REFERENCE.md)

## 更新日志

**2024-10-29**
- ✅ 为 categories 表添加 platform 字段
- ✅ 创建 AliExpress 类目数据（20 个一级，32 个二级）
- ✅ 前端支持根据平台过滤类目
- ✅ API 支持平台参数
- ✅ 添加 `update:categories:aliexpress` 命令

