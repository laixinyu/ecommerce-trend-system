// 核心数据类型定义
export type { Database } from './database';

export interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
}

export interface Product {
  id: string;
  platformId: string;
  platform: Platform;
  name: string;
  categoryId: string;
  imageUrl?: string;
  productUrl?: string;
  externalUrl?: string;
  currentPrice: number;
  trendScore: number;
  competitionScore: number;
  recommendationScore: number;
  sellerCount: number;
  reviewCount: number;
  averageRating: number;
  lastCrawledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrendHistory {
  id: string;
  productId: string;
  date: string;
  searchVolume: number;
  salesRank: number;
  price: number;
  sellerCount: number;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  level: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  categoryId?: string;
  searchVolume: number;
  competitionLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export type Platform = 'amazon' | 'aliexpress' | 'ebay' | 'taobao' | 'pinduoduo';

export type RecommendationLevel = 'highly_recommended' | 'worth_considering' | 'not_recommended';

export interface ProductMetrics {
  searchVolume: number;
  searchGrowth: number;
  salesRank: number;
  priceRange: {
    min: number;
    max: number;
  };
  sellerCount: number;
  reviewCount: number;
}

export interface TrendData {
  product: Product;
  metrics: ProductMetrics;
  history: TrendHistory[];
  recommendation: {
    level: RecommendationLevel;
    score: number;
    reasons: string[];
  };
}

export interface UserPreference {
  userId: string;
  watchedCategories: string[];
  watchedKeywords: string[];
  notificationEnabled: boolean;
  emailNotification: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'emerging_trend' | 'price_change' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  type: 'trend_overview' | 'category_analysis' | 'competition_analysis' | 'custom';
  parameters: Record<string, unknown>;
  fileUrl?: string;
  createdAt: string;
}
