/**
 * Supabase数据库类型定义
 * 这个文件定义了数据库表结构和关系
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          subscription_tier: 'free' | 'premium' | 'enterprise';
        };
        Insert: {
          id?: string;
          email: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          subscription_tier?: 'free' | 'premium' | 'enterprise';
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          subscription_tier?: 'free' | 'premium' | 'enterprise';
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          platform_id: string;
          platform: 'amazon' | 'aliexpress' | 'ebay' | 'taobao' | 'pinduoduo';
          name: string;
          category_id: string;
          image_url: string | null;
          product_url: string | null;
          external_url: string | null;
          current_price: number;
          trend_score: number;
          competition_score: number;
          recommendation_score: number;
          seller_count: number;
          review_count: number;
          average_rating: number;
          last_crawled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform_id: string;
          platform: 'amazon' | 'aliexpress' | 'ebay' | 'taobao' | 'pinduoduo';
          name: string;
          category_id: string;
          image_url?: string | null;
          product_url?: string | null;
          external_url?: string | null;
          current_price: number;
          trend_score?: number;
          competition_score?: number;
          recommendation_score?: number;
          seller_count?: number;
          review_count?: number;
          average_rating?: number;
          last_crawled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform_id?: string;
          platform?: 'amazon' | 'aliexpress' | 'ebay' | 'taobao' | 'pinduoduo';
          name?: string;
          category_id?: string;
          image_url?: string | null;
          product_url?: string | null;
          external_url?: string | null;
          current_price?: number;
          trend_score?: number;
          competition_score?: number;
          recommendation_score?: number;
          seller_count?: number;
          review_count?: number;
          average_rating?: number;
          last_crawled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trend_history: {
        Row: {
          id: string;
          product_id: string;
          date: string;
          search_volume: number;
          sales_rank: number;
          price: number;
          seller_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          date: string;
          search_volume: number;
          sales_rank: number;
          price: number;
          seller_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          date?: string;
          search_volume?: number;
          sales_rank?: number;
          price?: number;
          seller_count?: number;
          created_at?: string;
        };
      };
      keywords: {
        Row: {
          id: string;
          keyword: string;
          category_id: string | null;
          search_volume: number;
          competition_level: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          category_id?: string | null;
          search_volume: number;
          competition_level: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          category_id?: string | null;
          search_volume?: number;
          competition_level?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          watched_categories: string[];
          watched_keywords: string[];
          notification_enabled: boolean;
          email_notification: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          watched_categories?: string[];
          watched_keywords?: string[];
          notification_enabled?: boolean;
          email_notification?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          watched_categories?: string[];
          watched_keywords?: string[];
          notification_enabled?: boolean;
          email_notification?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'emerging_trend' | 'price_change' | 'system';
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'emerging_trend' | 'price_change' | 'system';
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'emerging_trend' | 'price_change' | 'system';
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: 'trend_overview' | 'category_analysis' | 'competition_analysis' | 'custom';
          parameters: Json;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: 'trend_overview' | 'category_analysis' | 'competition_analysis' | 'custom';
          parameters: Json;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: 'trend_overview' | 'category_analysis' | 'competition_analysis' | 'custom';
          parameters?: Json;
          file_url?: string | null;
          created_at?: string;
        };
      };
      crawl_logs: {
        Row: {
          id: string;
          task_id: string;
          platform: 'amazon' | 'aliexpress' | 'ebay';
          status: 'started' | 'completed' | 'failed';
          items_collected: number | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          platform: 'amazon' | 'aliexpress' | 'ebay';
          status: 'started' | 'completed' | 'failed';
          items_collected?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          platform?: 'amazon' | 'aliexpress' | 'ebay';
          status?: 'started' | 'completed' | 'failed';
          items_collected?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          service_type: 'marketing' | 'crm' | 'content' | 'supply_chain' | 'analytics';
          status: 'active' | 'inactive' | 'error';
          credentials: Json;
          config: Json;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          service_type: 'marketing' | 'crm' | 'content' | 'supply_chain' | 'analytics';
          status?: 'active' | 'inactive' | 'error';
          credentials: Json;
          config?: Json;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_name?: string;
          service_type?: 'marketing' | 'crm' | 'content' | 'supply_chain' | 'analytics';
          status?: 'active' | 'inactive' | 'error';
          credentials?: Json;
          config?: Json;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_campaigns: {
        Row: {
          id: string;
          integration_id: string;
          platform: 'meta' | 'google' | 'tiktok';
          campaign_id: string;
          campaign_name: string | null;
          status: 'active' | 'paused' | 'ended' | null;
          daily_budget: number | null;
          metrics: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          integration_id: string;
          platform: 'meta' | 'google' | 'tiktok';
          campaign_id: string;
          campaign_name?: string | null;
          status?: 'active' | 'paused' | 'ended' | null;
          daily_budget?: number | null;
          metrics?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          integration_id?: string;
          platform?: 'meta' | 'google' | 'tiktok';
          campaign_id?: string;
          campaign_name?: string | null;
          status?: 'active' | 'paused' | 'ended' | null;
          daily_budget?: number | null;
          metrics?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crm_customers: {
        Row: {
          id: string;
          user_id: string;
          external_id: string | null;
          email: string | null;
          name: string | null;
          segment: 'vip' | 'active' | 'at_risk' | 'lost' | 'new' | null;
          rfm_score: Json | null;
          ltv: number | null;
          first_purchase_at: string | null;
          last_purchase_at: string | null;
          total_orders: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_id?: string | null;
          email?: string | null;
          name?: string | null;
          segment?: 'vip' | 'active' | 'at_risk' | 'lost' | 'new' | null;
          rfm_score?: Json | null;
          ltv?: number | null;
          first_purchase_at?: string | null;
          last_purchase_at?: string | null;
          total_orders?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_id?: string | null;
          email?: string | null;
          name?: string | null;
          segment?: 'vip' | 'active' | 'at_risk' | 'lost' | 'new' | null;
          rfm_score?: Json | null;
          ltv?: number | null;
          first_purchase_at?: string | null;
          last_purchase_at?: string | null;
          total_orders?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      automation_rules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trigger: Json;
          actions: Json;
          status: 'active' | 'paused';
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          trigger: Json;
          actions: Json;
          status?: 'active' | 'paused';
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          trigger?: Json;
          actions?: Json;
          status?: 'active' | 'paused';
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_assets: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'video' | 'text' | 'mixed';
          title: string | null;
          description: string | null;
          tags: string[] | null;
          platform: 'meta' | 'tiktok' | 'instagram' | 'youtube' | null;
          url: string | null;
          storage_path: string | null;
          metrics: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'video' | 'text' | 'mixed';
          title?: string | null;
          description?: string | null;
          tags?: string[] | null;
          platform?: 'meta' | 'tiktok' | 'instagram' | 'youtube' | null;
          url?: string | null;
          storage_path?: string | null;
          metrics?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'image' | 'video' | 'text' | 'mixed';
          title?: string | null;
          description?: string | null;
          tags?: string[] | null;
          platform?: 'meta' | 'tiktok' | 'instagram' | 'youtube' | null;
          url?: string | null;
          storage_path?: string | null;
          metrics?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          user_id: string;
          sku: string;
          product_name: string | null;
          quantity_on_hand: number;
          quantity_in_transit: number;
          reorder_point: number | null;
          reorder_quantity: number | null;
          unit_cost: number | null;
          warehouse_location: string | null;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sku: string;
          product_name?: string | null;
          quantity_on_hand?: number;
          quantity_in_transit?: number;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          unit_cost?: number | null;
          warehouse_location?: string | null;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sku?: string;
          product_name?: string | null;
          quantity_on_hand?: number;
          quantity_in_transit?: number;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          unit_cost?: number | null;
          warehouse_location?: string | null;
          last_updated?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          external_order_id: string | null;
          platform: 'shopify' | 'woocommerce' | 'amazon' | null;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null;
          items: Json | null;
          total_amount: number | null;
          shipping_info: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          external_order_id?: string | null;
          platform?: 'shopify' | 'woocommerce' | 'amazon' | null;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null;
          items?: Json | null;
          total_amount?: number | null;
          shipping_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          external_order_id?: string | null;
          platform?: 'shopify' | 'woocommerce' | 'amazon' | null;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null;
          items?: Json | null;
          total_amount?: number | null;
          shipping_info?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dashboards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          layout: Json | null;
          widgets: Json | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          layout?: Json | null;
          widgets?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          layout?: Json | null;
          widgets?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trigger: Json;
          steps: Json;
          status: 'active' | 'paused';
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          trigger: Json;
          steps: Json;
          status?: 'active' | 'paused';
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          trigger?: Json;
          steps?: Json;
          status?: 'active' | 'paused';
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      automation_executions: {
        Row: {
          id: string;
          rule_id: string;
          customer_id: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          trigger_data: Json;
          actions_executed: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          rule_id: string;
          customer_id: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          trigger_data: Json;
          actions_executed?: number;
          error_message?: string | null;
          started_at: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          rule_id?: string;
          customer_id?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed';
          trigger_data?: Json;
          actions_executed?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      automation_logs: {
        Row: {
          id: string;
          rule_id: string;
          execution_id: string;
          action_type: string;
          status: 'success' | 'failed';
          details: Json;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id: string;
          execution_id: string;
          action_type: string;
          status: 'success' | 'failed';
          details: Json;
          error_message?: string | null;
          created_at: string;
        };
        Update: {
          id?: string;
          rule_id?: string;
          execution_id?: string;
          action_type?: string;
          status?: 'success' | 'failed';
          details?: Json;
          error_message?: string | null;
          created_at?: string;
        };
      };
      user_events: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          event_name: string;
          event_type: 'page_view' | 'click' | 'purchase' | 'add_to_cart' | 'custom';
          properties: Json;
          page_url: string | null;
          referrer: string | null;
          user_agent: string | null;
          ip_address: string | null;
          session_id: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          event_name: string;
          event_type: 'page_view' | 'click' | 'purchase' | 'add_to_cart' | 'custom';
          properties: Json;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          session_id: string;
          timestamp: string;
          created_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string | null;
          event_name?: string;
          event_type?: 'page_view' | 'click' | 'purchase' | 'add_to_cart' | 'custom';
          properties?: Json;
          page_url?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          session_id?: string;
          timestamp?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
