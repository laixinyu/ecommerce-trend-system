# 更新日志

## [2024-11-04] - 商品批量删除功能

### ✨ 新增
- **商品批量删除功能**
  - 一键删除不推荐商品（推荐分数 < 50）
  - 一键清空所有商品列表
  - 删除前显示确认对话框，防止误操作
  - 删除后自动刷新商品列表
  - 显示删除数量统计

### 🎨 UI 改进
- 在商品列表页面添加批量操作按钮
- 优化按钮颜色区分（橙色：删除不推荐，红色：清空列表）
- 添加操作提示和警告信息
- 删除过程中显示加载状态

### 🔧 API
- 新增 `/api/trends/products/bulk-delete` 端点
  - 支持 `delete_not_recommended` 操作
  - 支持 `delete_all` 操作
  - 可配置推荐分数阈值

## [2024-10-29] - 平台特定类目系统

### ✨ 新增
- **平台特定类目系统**
  - 为 categories 表添加 `platform` 字段，区分不同平台的类目
  - 创建 AliExpress 类目数据（20 个一级类目，32 个二级类目）
  - 前端支持根据选择的平台自动加载对应类目
  - 切换平台时自动清空类目选择
  - Categories API 支持平台过滤参数

### 🗃️ 数据库
- **迁移文件**: `006_add_platform_to_categories.sql`
  - 添加 platform 字段（默认 'amazon'）
  - 创建平台索引以提高查询性能
  - 添加平台约束检查

### 📦 脚本
- 新增 `scripts/apply-aliexpress-categories.ts` - 应用 AliExpress 类目
- 新增命令 `npm run update:categories:aliexpress`

### 📚 文档
- 新增 `docs/PLATFORM_SPECIFIC_CATEGORIES.md` - 平台特定类目系统说明

## [2024-10-29] - 类目浏览爬取功能

### ✨ 新增
- **类目浏览爬取功能**
  - 支持不输入关键词，直接爬取整个类目下的商品
  - 关键词字段改为可选，可选择"不使用关键词（爬取整个类目）"
  - 当未输入关键词时，系统自动使用类目名称作为搜索词
  - 添加用户确认提示，避免误操作

### 🔧 优化
- **真实爬虫控制台**
  - 界面优化，关键词标签改为"搜索关键词（可选）"
  - 下拉列表新增"不使用关键词（爬取整个类目）"选项
  - 自定义输入框提示文本更新
  - 结果显示支持空关键词情况

### 🛠️ 技术改进
- **API 路由** (`app/api/crawl/real/route.ts`)
  - 移除关键词必填验证
  - 支持空关键词传递
- **爬虫管理器** (`lib/crawler/crawler-manager.ts`)
  - 支持自动获取类目名称
  - 将类目名称传递给爬虫执行器
- **Amazon 爬虫** (`lib/crawler/real-amazon-crawler.ts`)
  - 新增 `categoryName` 参数支持
  - 优化搜索 URL 构建逻辑
- **AliExpress 爬虫** (`lib/crawler/real-aliexpress-crawler.ts`)
  - 新增 `categoryName` 参数支持
  - 优化搜索 URL 构建逻辑

### 📚 文档
- 新增 `docs/CATEGORY_BROWSE_FEATURE.md` - 类目浏览功能详细说明

## [2024-10-29] - 文档清理

### 🗑️ 删除
- **删除无用文档**
  - `HOW_TO_USE_SYNC.md` (根目录) - 与 docs 中的文档重复
  - `docs/HOW_TO_USE_SYNC.md` - 内容与 SYNC_QUICKSTART.md 重复
  - `docs/SYNC_WORKFLOW.md` - 过于详细的流程图
  - `docs/CATEGORY_FIX.md` - 详细修复文档
  - `docs/CATEGORY_FIX_DIAGRAM.md` - 流程对比图
  - `docs/SCRIPTS_CLEANUP.md` - 临时性的清理总结文档

### 📝 保留
- **核心文档**
  - `SYNC_QUICKSTART.md` - 同步功能快速开始
  - `CATEGORY_FIX_SUMMARY.md` - 类目修复总结
  - `CATEGORY_UPDATE_SUMMARY.md` - 类目更新总结
  - `CATEGORY_QUICK_REFERENCE.md` - 类目快速参考
  - `AMAZON_CATEGORIES.md` - 亚马逊类目列表

## [2024-10-29] - 脚本清理

### 🗑️ 删除
- **删除无用脚本**
  - `update-amazon-categories.ts` - 与 apply-amazon-categories.ts 功能重复
  - `test-auth-flow.ts` - 认证测试，不再需要
  - `check-auth-config.ts` - 功能被 test-supabase-connection.ts 覆盖
  - `test-category-fix.ts` - 类目修复测试已完成

### 📊 统计
- 删除 4 个无用脚本
- 保留 11 个有用脚本
- 精简率: 26.7%

