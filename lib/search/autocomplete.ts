// 搜索自动完成和建议

import { createClient } from '@/lib/supabase/server';

// Trie树节点（用于高效的前缀搜索）
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;
  suggestions: string[];

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.suggestions = [];
  }
}

// Trie树实现
export class AutocompleteTrie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  // 插入词条
  insert(word: string, frequency: number = 1): void {
    let node = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.frequency += frequency;
  }

  // 搜索前缀
  search(prefix: string, limit: number = 10): string[] {
    const lowerPrefix = prefix.toLowerCase();
    let node = this.root;

    // 找到前缀节点
    for (const char of lowerPrefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }

    // 收集所有以该前缀开头的词
    const results: Array<{ word: string; frequency: number }> = [];
    this.collectWords(node, lowerPrefix, results);

    // 按频率排序并返回
    return results
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map((item) => item.word);
  }

  private collectWords(
    node: TrieNode,
    prefix: string,
    results: Array<{ word: string; frequency: number }>
  ): void {
    if (node.isEndOfWord) {
      results.push({ word: prefix, frequency: node.frequency });
    }

    for (const [char, childNode] of node.children) {
      this.collectWords(childNode, prefix + char, results);
    }
  }
}

// 从数据库构建自动完成索引
export async function buildAutocompleteIndex(): Promise<AutocompleteTrie> {
  const trie = new AutocompleteTrie();
  const supabase = await createClient();

  // 获取所有商品名称和关键词
  const { data: products } = await supabase
    .from('products')
    .select('name, keywords, trend_score');

  if (products) {
    products.forEach((product) => {
      // 添加商品名称
      // @ts-ignore - Supabase类型生成问题
      trie.insert(product.name, product.trend_score || 1);

      // 添加关键词
      // @ts-ignore - Supabase类型生成问题
      if (Array.isArray(product.keywords)) {
        product.keywords.forEach((keyword: string) => {
          // @ts-ignore - Supabase类型生成问题
          trie.insert(keyword, (product.trend_score || 1) * 0.5);
        });
      }
    });
  }

  return trie;
}

// 获取搜索建议（基于数据库）
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (query.length < 2) return [];

  const supabase = await createClient();

  // 从商品名称获取建议
  const { data: nameMatches } = await supabase
    .from('products')
    .select('name, trend_score')
    .ilike('name', `${query}%`)
    .order('trend_score', { ascending: false })
    .limit(limit);

  // 从关键词获取建议
  const { data: keywordMatches } = await supabase
    .from('products')
    .select('keywords')
    .contains('keywords', [query])
    .limit(limit);

  const suggestions = new Set<string>();

  // 添加名称匹配
  nameMatches?.forEach((product: any) => {
    suggestions.add(product.name);
  });

  // 添加关键词匹配
  keywordMatches?.forEach((product: any) => {
    if (Array.isArray(product.keywords)) {
      product.keywords.forEach((keyword: string) => {
        if (keyword.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.add(keyword);
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

// 搜索历史管理
export class SearchHistory {
  private static readonly STORAGE_KEY = 'search_history';
  private static readonly MAX_HISTORY = 20;

  static add(query: string): void {
    if (typeof window === 'undefined') return;

    const history = this.get();
    const updated = [query, ...history.filter((q) => q !== query)].slice(
      0,
      this.MAX_HISTORY
    );

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  static get(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static remove(query: string): void {
    if (typeof window === 'undefined') return;

    const history = this.get();
    const updated = history.filter((q) => q !== query);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }
}

// 搜索分析和统计
export async function trackSearch(query: string, resultCount: number): Promise<void> {
  const supabase = await createClient();

  // 记录搜索统计
  // @ts-expect-error - Supabase类型生成问题
  await supabase.from('search_analytics').insert({
    query,
    result_count: resultCount,
    searched_at: new Date().toISOString(),
  });
}

// 获取热门搜索词
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('search_analytics')
    .select('query')
    .gte('searched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  if (!data) return [];

  // 统计频率
  const frequency: Record<string, number> = {};
  data.forEach((item: any) => {
    frequency[item.query] = (frequency[item.query] || 0) + 1;
  });

  // 排序并返回
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query]) => query);
}
