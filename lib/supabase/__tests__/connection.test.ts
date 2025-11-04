/**
 * Supabase连接测试
 * 
 * 注意：这个测试需要正确配置环境变量才能运行
 * 运行前请确保 .env.local 文件中已配置 Supabase 凭据
 */

import { supabase } from '../client';
import { getCategories } from '../helpers';

describe('Supabase Connection', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('categories').select('count');
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should fetch categories', async () => {
    const categories = await getCategories();
    
    expect(Array.isArray(categories)).toBe(true);
  });
});

// 手动测试函数（在开发环境中使用）
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // 测试基本连接
    const { data, error } = await supabase.from('categories').select('*').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('Sample data:', data);
    
    // 测试类目查询
    const categories = await getCategories(0);
    console.log(`✅ Found ${categories.length} top-level categories`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}
