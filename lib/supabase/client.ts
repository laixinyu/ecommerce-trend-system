import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// 使用占位符值以允许构建，实际运行时需要真实值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// 在运行时检查环境变量
const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isConfigured && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase环境变量未配置，某些功能可能无法使用');
}

/**
 * Supabase客户端实例
 * 用于客户端组件
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * 创建Supabase客户端
 * 用于服务端组件和API Routes
 */
export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * 检查Supabase是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}
