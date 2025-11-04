// 搜索结果排序算法

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  trend_score?: number;
  recommendation_score?: number;
  sales_rank?: number;
  price?: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface RankingWeights {
  exactMatch: number;
  partialMatch: number;
  trendScore: number;
  recommendationScore: number;
  salesRank: number;
  recency: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  exactMatch: 100,
  partialMatch: 50,
  trendScore: 30,
  recommendationScore: 20,
  salesRank: 15,
  recency: 10,
};

// 计算搜索相关性分数
export function calculateRelevanceScore(
  result: SearchResult,
  query: string,
  weights: Partial<RankingWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  let score = 0;

  const queryLower = query.toLowerCase();
  const nameLower = result.name.toLowerCase();

  // 精确匹配
  if (nameLower === queryLower) {
    score += w.exactMatch;
  }

  // 名称包含查询词
  if (nameLower.includes(queryLower)) {
    score += w.partialMatch;
  }

  // 查询词在名称开头
  if (nameLower.startsWith(queryLower)) {
    score += w.partialMatch * 0.5;
  }

  // 关键词匹配
  if (result.keywords && Array.isArray(result.keywords)) {
    const keywordMatches = result.keywords.filter((kw) =>
      kw.toLowerCase().includes(queryLower)
    ).length;
    score += keywordMatches * (w.partialMatch * 0.3);
  }

  // 趋势分数
  if (result.trend_score) {
    score += (result.trend_score / 100) * w.trendScore;
  }

  // 推荐分数
  if (result.recommendation_score) {
    score += (result.recommendation_score / 100) * w.recommendationScore;
  }

  // 销量排名（排名越低越好）
  if (result.sales_rank) {
    const normalizedRank = Math.max(0, 1 - result.sales_rank / 10000);
    score += normalizedRank * w.salesRank;
  }

  // 新近度（如果有创建时间）
  if (result.created_at && typeof result.created_at === 'string') {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 365);
    score += recencyScore * w.recency;
  }

  return score;
}

// 对搜索结果进行排序
export function rankSearchResults(
  results: SearchResult[],
  query: string,
  weights?: Partial<RankingWeights>
): SearchResult[] {
  return results
    .map((result) => ({
      ...result,
      relevanceScore: calculateRelevanceScore(result, query, weights),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// 多字段加权搜索
export function multiFieldSearch(
  results: SearchResult[],
  query: string,
  fieldWeights: Record<string, number> = { name: 1.0, description: 0.5, keywords: 0.7 }
): SearchResult[] {
  const queryLower = query.toLowerCase();

  return results
    .map((result) => {
      let score = 0;

      // 名称匹配
      if (result.name && fieldWeights.name) {
        const nameLower = result.name.toLowerCase();
        if (nameLower.includes(queryLower)) {
          const position = nameLower.indexOf(queryLower);
          const positionScore = 1 - position / nameLower.length;
          score += fieldWeights.name * positionScore;
        }
      }

      // 描述匹配
      if (result.description && fieldWeights.description) {
        const descLower = result.description.toLowerCase();
        if (descLower.includes(queryLower)) {
          score += fieldWeights.description * 0.5;
        }
      }

      // 关键词匹配
      if (result.keywords && fieldWeights.keywords) {
        const matches = result.keywords.filter((kw) =>
          kw.toLowerCase().includes(queryLower)
        ).length;
        score += fieldWeights.keywords * matches * 0.3;
      }

      return { ...result, searchScore: score };
    })
    .filter((result) => result.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
}

// 分组搜索结果（按类目或平台）
export function groupSearchResults(
  results: SearchResult[],
  groupBy: 'category' | 'platform'
): Record<string, SearchResult[]> {
  return results.reduce((groups, result) => {
    const value = result[groupBy];
    const key = typeof value === 'string' ? value : 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);
}
