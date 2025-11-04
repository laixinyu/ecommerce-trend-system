# 商品批量删除功能测试指南

## 测试前准备

1. 确保数据库中有测试商品数据
2. 建议在测试环境中进行测试
3. 备份重要数据

## 测试步骤

### 1. 测试删除不推荐商品

#### 准备测试数据
```sql
-- 查看当前商品推荐分数分布
SELECT 
  CASE 
    WHEN recommendation_score < 30 THEN '0-30'
    WHEN recommendation_score < 50 THEN '30-50'
    WHEN recommendation_score < 70 THEN '50-70'
    ELSE '70-100'
  END as score_range,
  COUNT(*) as count
FROM products
GROUP BY score_range
ORDER BY score_range;
```

#### 测试流程
1. 访问 `/products` 页面
2. 记录当前商品总数
3. 点击 **🗑️ 删除不推荐** 按钮
4. 查看确认对话框内容
5. 点击 **确认删除**
6. 等待删除完成
7. 验证 Toast 通知显示正确的删除数量
8. 验证商品列表已刷新
9. 验证只剩下推荐分数 >= 50 的商品

#### 验证 SQL
```sql
-- 验证是否还有推荐分数 < 50 的商品
SELECT COUNT(*) 
FROM products 
WHERE recommendation_score < 50;
-- 应该返回 0

-- 查看剩余商品的推荐分数
SELECT 
  MIN(recommendation_score) as min_score,
  MAX(recommendation_score) as max_score,
  AVG(recommendation_score) as avg_score,
  COUNT(*) as total_count
FROM products;
```

### 2. 测试清空商品列表

#### 测试流程
1. 访问 `/products` 页面
2. 记录当前商品总数
3. 点击 **🗑️ 清空列表** 按钮
4. 查看警告对话框内容
5. 点击 **确认删除**
6. 等待删除完成
7. 验证 Toast 通知显示正确的删除数量
8. 验证商品列表显示空状态
9. 验证显示 "暂无商品" 提示

#### 验证 SQL
```sql
-- 验证商品表是否为空
SELECT COUNT(*) FROM products;
-- 应该返回 0

-- 验证趋势历史记录也被删除（级联删除）
SELECT COUNT(*) FROM trend_history;
-- 应该返回 0
```

### 3. 测试取消操作

#### 测试流程
1. 点击删除按钮
2. 在确认对话框中点击 **取消**
3. 验证对话框关闭
4. 验证商品列表没有变化
5. 验证商品总数没有变化

### 4. 测试加载状态

#### 测试流程
1. 点击删除按钮并确认
2. 观察按钮状态变为 "删除中..."
3. 观察按钮被禁用
4. 等待删除完成
5. 验证按钮恢复正常状态

### 5. 测试错误处理

#### 模拟网络错误
```typescript
// 在浏览器控制台中模拟网络错误
// 方法1: 断开网络连接后点击删除
// 方法2: 使用浏览器开发工具的网络节流功能
```

#### 验证
1. 验证显示错误 Toast 通知
2. 验证按钮恢复可用状态
3. 验证对话框关闭
4. 验证商品列表没有变化

## API 测试

### 使用 curl 测试

#### 删除不推荐商品
```bash
curl -X DELETE http://localhost:3000/api/trends/products/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{"action":"delete_not_recommended","threshold":50}'
```

#### 清空商品列表
```bash
curl -X DELETE http://localhost:3000/api/trends/products/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{"action":"delete_all"}'
```

#### 测试无效操作
```bash
curl -X DELETE http://localhost:3000/api/trends/products/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{"action":"invalid_action"}'
```

### 预期响应

#### 成功响应
```json
{
  "success": true,
  "data": {
    "deletedCount": 123,
    "message": "已删除 123 个不推荐的商品"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTION",
    "message": "无效的操作类型"
  }
}
```

## 性能测试

### 大量数据测试

1. 插入大量测试数据（如 10000 条）
2. 测试删除操作的响应时间
3. 监控数据库性能
4. 验证删除操作不会超时

### 并发测试

1. 同时打开多个浏览器标签
2. 在不同标签中同时执行删除操作
3. 验证数据一致性
4. 验证没有竞态条件

## 测试检查清单

- [ ] 删除不推荐商品功能正常
- [ ] 清空商品列表功能正常
- [ ] 确认对话框显示正确
- [ ] 取消操作正常工作
- [ ] Toast 通知显示正确
- [ ] 商品列表自动刷新
- [ ] 删除数量统计准确
- [ ] 加载状态显示正确
- [ ] 错误处理正常
- [ ] API 响应格式正确
- [ ] 数据库级联删除正常
- [ ] 性能表现良好
- [ ] UI 响应流畅

## 已知问题

目前没有已知问题。

## 测试报告模板

```markdown
## 测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**测试环境**: [开发/测试/生产]

### 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 删除不推荐商品 | ✅/❌ | |
| 清空商品列表 | ✅/❌ | |
| 确认对话框 | ✅/❌ | |
| 取消操作 | ✅/❌ | |
| Toast 通知 | ✅/❌ | |
| 列表刷新 | ✅/❌ | |
| 错误处理 | ✅/❌ | |
| API 测试 | ✅/❌ | |
| 性能测试 | ✅/❌ | |

### 发现的问题

1. [问题描述]
2. [问题描述]

### 建议

1. [改进建议]
2. [改进建议]
```
