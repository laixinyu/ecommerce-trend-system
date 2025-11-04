# AI 选品快速启动指南

## 🎯 30 分钟快速集成 AI 选品

### 步骤 1: 安装依赖 (5 分钟)

```bash
npm install openai zod ai
```

### 步骤 2: 配置环境变量 (2 分钟)

在 `.env.local` 添加：

```env
# OpenAI API
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o  # 或 gpt-4o-mini (更便宜)
```

获取 API Key: https://platform.openai.com/api-keys

### 步骤 3: 创建 AI 服务 (10 分钟)

我会为你创建以下文件：
1. `lib/ai/openai-client.ts` - OpenAI 客户端
2. `lib/ai/product-analyzer.ts` - 商品分析器
3. `app/api/ai/analyze/route.ts` - API 路由
4. `components/features/ai-insights.tsx` - UI 组件

### 步骤 4: 集成到商品页面 (10 分钟)

在商品详情页添加 AI 洞察卡片

### 步骤 5: 测试 (3 分钟)

访问任意商品页面，查看 AI 分析结果

---

## 🎨 功能预览

### 1. 智能商品评分
```
📊 AI 综合评分: 87/100

✅ 市场潜力: 高
✅ 竞争强度: 中等
✅ 推荐指数: ⭐⭐⭐⭐
```

### 2. 核心洞察
```
💡 关键发现:
• 该商品在过去 30 天搜索量增长 45%
• 评论情感 82% 正面，主要赞扬质量
• 价格处于市场中位数，性价比高
• 建议目标客户: 25-40 岁都市白领
```

### 3. 风险提示
```
⚠️ 注意事项:
• 季节性商品，Q4 销量最佳
• 竞争对手增加，需关注价格战
```

---

## 💰 成本控制

### 免费额度
- OpenAI 新用户: $5 免费额度
- 可分析约 200-500 个商品

### 优化建议
1. **缓存结果**: 24 小时内相同商品不重复分析
2. **批量处理**: 一次分析多个商品
3. **使用 gpt-4o-mini**: 成本降低 60%

```typescript
// 成本对比
gpt-4o:      $0.025 / 商品
gpt-4o-mini: $0.010 / 商品  ← 推荐
```

---

## 🔧 高级配置

### 自定义分析维度

```typescript
// lib/ai/analysis-config.ts
export const analysisConfig = {
  dimensions: [
    'market_potential',    // 市场潜力
    'competition_level',   // 竞争强度
    'profit_margin',       // 利润空间
    'trend_direction',     // 趋势方向
    'customer_demand',     // 客户需求
    'supply_stability',    // 供应稳定性
  ],
  weights: {
    market_potential: 0.25,
    competition_level: 0.20,
    profit_margin: 0.20,
    trend_direction: 0.15,
    customer_demand: 0.15,
    supply_stability: 0.05,
  },
};
```

### 多语言支持

```typescript
// 自动检测商品语言，返回对应语言的分析
const analysis = await analyzeProduct(product, {
  language: 'auto', // 'zh-CN', 'en-US', 'auto'
});
```

---

## 📊 数据库扩展

### 添加 AI 分析结果表

```sql
-- supabase/migrations/007_ai_analysis.sql
CREATE TABLE ai_product_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- AI 评分
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  market_potential_score INTEGER,
  competition_score INTEGER,
  trend_score INTEGER,
  
  -- 洞察
  insights JSONB,
  recommendations TEXT[],
  risks TEXT[],
  target_audience TEXT,
  
  -- 元数据
  model_version VARCHAR(50),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ai_analysis_product ON ai_product_analysis(product_id);
CREATE INDEX idx_ai_analysis_score ON ai_product_analysis(overall_score DESC);
CREATE INDEX idx_ai_analysis_expires ON ai_product_analysis(expires_at);

-- 自动清理过期分析
CREATE OR REPLACE FUNCTION cleanup_expired_analysis()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_product_analysis
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 使用场景

### 场景 1: 批量选品
```typescript
// 分析前 100 个商品，按 AI 评分排序
const topProducts = await analyzeAndRankProducts({
  limit: 100,
  minScore: 70,
  sortBy: 'ai_score',
});
```

### 场景 2: 趋势监控
```typescript
// 每日自动分析新品
cron.schedule('0 2 * * *', async () => {
  const newProducts = await getProductsAddedToday();
  await batchAnalyze(newProducts);
  await sendDailyReport();
});
```

### 场景 3: 智能推荐
```typescript
// 基于用户历史，推荐相似高分商品
const recommendations = await getAIRecommendations({
  userId: user.id,
  minScore: 80,
  limit: 10,
});
```

---

## 🚀 性能优化

### 1. 响应式加载
```typescript
// 先显示基础信息，AI 分析异步加载
<ProductCard product={product}>
  <Suspense fallback={<SkeletonAI />}>
    <AIInsights productId={product.id} />
  </Suspense>
</ProductCard>
```

### 2. 边缘缓存
```typescript
// 使用 Vercel Edge Config 缓存热门商品分析
export const runtime = 'edge';
export const revalidate = 3600; // 1 小时
```

### 3. 流式响应
```typescript
// 实时流式返回分析结果
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  // 逐步显示结果
}
```

---

## 📈 效果追踪

### 关键指标

```typescript
// lib/analytics/ai-metrics.ts
export async function trackAIAnalysis(analysis: AIAnalysis) {
  await analytics.track('ai_analysis_completed', {
    product_id: analysis.productId,
    score: analysis.overallScore,
    duration_ms: analysis.duration,
    model: analysis.modelVersion,
    cost: analysis.estimatedCost,
  });
}
```

### Dashboard 展示
- 今日分析次数
- 平均评分分布
- API 成本统计
- 响应时间趋势

---

## 🎓 最佳实践

### 1. Prompt 工程
```typescript
// 好的 Prompt 示例
const prompt = `
作为电商选品专家，请分析以下商品数据：

商品信息:
- 标题: ${product.title}
- 价格: $${product.price}
- 评分: ${product.rating}/5 (${product.reviewCount} 评论)
- 平台: ${product.platform}
- 类目: ${product.category}

历史数据:
- 30天搜索量: ${searchVolume}
- 价格趋势: ${priceTrend}
- 竞品数量: ${competitorCount}

请提供结构化分析，包括：
1. 综合评分 (0-100)
2. 市场潜力评估
3. 3个核心优势
4. 2个主要风险
5. 目标客户画像
6. 具体行动建议

以 JSON 格式返回，确保数据可解析。
`;
```

### 2. 错误处理
```typescript
try {
  const analysis = await analyzeProduct(product);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // 触发限流，使用缓存或降级
    return getCachedAnalysis(product.id);
  }
  
  if (error.code === 'insufficient_quota') {
    // 余额不足，通知管理员
    await notifyAdmin('OpenAI quota exceeded');
    return getBasicAnalysis(product);
  }
  
  // 其他错误，记录日志
  logger.error('AI analysis failed', { error, productId: product.id });
  throw error;
}
```

### 3. A/B 测试
```typescript
// 测试不同模型效果
const model = Math.random() > 0.5 ? 'gpt-4o' : 'gpt-4o-mini';

const analysis = await analyzeProduct(product, { model });

await trackExperiment('ai_model_comparison', {
  model,
  score: analysis.overallScore,
  cost: analysis.cost,
  duration: analysis.duration,
});
```

---

## 🔗 相关资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [LangChain.js](https://js.langchain.com/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

## ✅ 检查清单

开始前确认：
- [ ] 已注册 OpenAI 账号
- [ ] 已获取 API Key
- [ ] 已配置环境变量
- [ ] 已安装依赖包
- [ ] 已了解成本结构
- [ ] 已设置预算告警

准备好了吗？让我们开始实现！🚀
