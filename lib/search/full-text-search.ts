import { createClient } from '@/lib/supabase/server';

// 全文搜索配置
export interface SearchConfig {
  query: string;
  fields?: string[]; // 搜索的字段
  limit?: number;
  offset?: number;
  filters?: Record<string, string | number | boolean>;
}

// 使用Supabase全文搜索
export async function fullTextSearch(config: SearchConfig) {
  const {
    query,
    fields = ['name', 'description', 'keywords'],
    limit = 20,
    offset = 0,
    filters = {},
  } = config;

  const supabase = await createClient();

  // 构建全文搜索查询
  let searchQuery = supabase
    .from('products')
    .select('*', { count: 'exact' });

  // 使用textSearch进行全文搜索
  if (fields.includes('name')) {
    searchQuery = searchQuery.textSearch('name', query, {
      type: 'websearch',
      config: 'english',
    });
  }

  // 应用额外的筛选条件
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchQuery = searchQuery.eq(key, value);
    }
  });

  // 分页
  searchQuery = searchQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await searchQuery;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return {
    results: data || [],
    total: count || 0,
    limit,
    offset,
  };
}

// 模糊搜索（使用ILIKE）
export async function fuzzySearch(config: SearchConfig) {
  const { query, limit = 20, offset = 0, filters = {} } = config;

  const supabase = await createClient();

  let searchQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .range(offset, offset + limit - 1);

  // 应用筛选条件
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchQuery = searchQuery.eq(key, value);
    }
  });

  const { data, error, count } = await searchQuery;

  if (error) {
    throw new Error(`Fuzzy search failed: ${error.message}`);
  }

  return {
    results: data || [],
    total: count || 0,
    limit,
    offset,
  };
}

// 关键词数组搜索
export async function keywordSearch(keywords: string[], filters: Record<string, string | number | boolean> = {}) {
  const supabase = await createClient();

  let searchQuery = supabase
    .from('products')
    .select('*')
    .contains('keywords', keywords);

  // 应用筛选条件
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchQuery = searchQuery.eq(key, value);
    }
  });

  const { data, error } = await searchQuery;

  if (error) {
    throw new Error(`Keyword search failed: ${error.message}`);
  }

  return data || [];
}
