# Scripts 目录说明

本目录包含用于开发、测试和维护的实用脚本。

## 🔧 维护工具

### fix-scores.ts
修复商品评分数据。当评分计算逻辑更新或数据不一致时使用。

```bash
npx tsx scripts/fix-scores.ts
```

### clean-mock-data.ts
清理数据库中的模拟数据，保留真实爬取的数据。

```bash
npm run clean:mock
```

### clean-suspicious-data.ts
清理可疑或异常的数据记录。

```bash
npm run clean:suspicious
```

## 🏷️ 类目管理

### apply-amazon-categories.ts
应用亚马逊标准类目到数据库。

```bash
npm run update:categories
```

### verify-categories.ts
验证类目数据是否正确应用。

```bash
npm run verify:categories
```

## 🧪 测试工具

### test-real-crawler.ts
测试真实的爬虫功能，验证数据抓取是否正常。

```bash
npm run test:crawler
```

### test-sync.ts
测试数据同步功能。

```bash
npm run test:sync
```

### test-supabase-connection.ts
测试 Supabase 数据库连接是否正常。

```bash
npm run test:supabase
```

## ✅ 验证工具

### verify-real-data.ts
验证数据库中的真实数据质量和完整性。

```bash
npm run verify:data
```

## 🌱 初始化工具

### seed-database.ts
初始化数据库，填充示例数据（仅用于开发环境）。

```bash
npm run seed
```

## 📝 使用说明

1. 所有脚本都需要在项目根目录下运行
2. 确保 `.env.local` 文件配置正确
3. 生产环境慎用数据清理和初始化脚本
4. 建议在执行前备份数据库

## 🗑️ 已删除的脚本

以下脚本已完成使命并被删除：
- `add-external-url.ts` - 一次性数据迁移
- `add-last-crawled-at.ts` - 一次性数据迁移
- `check-scores.ts` - 临时调试脚本
- `check-urls.ts` - 临时调试脚本
- `check-db-schema.ts` - 临时调试脚本
- `test-product-url.ts` - 临时测试脚本
- `verify-scores.ts` - 评分验证（已完成）
- `verify-report-data.ts` - 报告验证（已完成）
- `check-auth-config.ts` - 功能被 test-supabase-connection.ts 覆盖
- `test-auth-flow.ts` - 认证测试（不再需要）
- `test-category-fix.ts` - 类目修复测试（已完成验证）
- `update-amazon-categories.ts` - 与 apply-amazon-categories.ts 功能重复
