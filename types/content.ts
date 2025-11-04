// Content module types
export interface ContentAsset {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'text' | 'mixed';
  title: string;
  description: string;
  tags: string[];
  platform: 'meta' | 'tiktok' | 'instagram' | 'youtube';
  url: string;
  storage_path: string;
  metrics: ContentMetrics;
  current_version?: number;
  parent_asset_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentAssetVersion {
  id: string;
  asset_id: string;
  version_number: number;
  title: string;
  description: string;
  tags: string[];
  url: string;
  storage_path: string;
  metrics: ContentMetrics;
  change_note?: string;
  created_by: string;
  created_at: string;
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  reach: number;
  date: string;
}

export interface AIGeneratedContent {
  id: string;
  user_id: string;
  type: 'product_description' | 'ad_copy' | 'social_post' | 'email' | 'improve';
  prompt: string;
  content: string;
  model: string;
  created_at: string;
}

export interface SocialMediaPost {
  id: string;
  platform: 'meta' | 'tiktok' | 'instagram' | 'youtube';
  post_id: string;
  content: string;
  media_url?: string;
  metrics: ContentMetrics;
  posted_at: string;
}

export interface ContentAnalysis {
  asset_id: string;
  performance_score: number;
  engagement_rate: number;
  best_performing_features: string[];
  recommendations: string[];
  roi?: number;
}

export interface CompetitorContent {
  id: string;
  competitor_name: string;
  platform: string;
  content_type: string;
  metrics: ContentMetrics;
  analyzed_at: string;
}
