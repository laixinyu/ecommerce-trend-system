import { z } from 'zod';

// 用户偏好设置验证
export const userPreferencesSchema = z.object({
  preferred_categories: z.array(z.string()).optional(),
  preferred_platforms: z.array(z.string()).optional(),
  min_price: z.number().min(0).nullable().optional(),
  max_price: z.number().min(0).nullable().optional(),
});

// 通知偏好验证
export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  watched_categories: z.array(z.string()).optional(),
  watched_keywords: z.array(z.string()).optional(),
  trend_threshold: z.number().min(0).max(100).optional(),
});

// 筛选组合验证
export const savedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.any()),
});

// 搜索查询验证
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  platform: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
});

// 商品筛选验证
export const productFiltersSchema = z.object({
  category: z.string().optional(),
  platform: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// 报告生成验证
export const reportGenerationSchema = z.object({
  name: z.string().min(1).max(200),
  template: z.enum(['trend-overview', 'category-analysis', 'competition-analysis']),
  categories: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  dateRange: z.string().optional(),
});

// 通用验证函数
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: '验证失败' };
  }
}
