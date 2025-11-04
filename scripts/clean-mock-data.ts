/**
 * 清理 Mock 数据脚本
 * 删除所有没有 last_crawled_at 的商品（即 mock 数据）
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('请确保 .env.local 中设置了:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanMockData() {
  console.log('🧹 开始清理 Mock 数据...\n');

  try {
    // 1. 统计 mock 数据数量
    const { count: mockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('last_crawled_at', null);

    console.log(`📊 找到 ${mockCount || 0} 条 Mock 数据`);

    if (!mockCount || mockCount === 0) {
      console.log('✅ 没有需要清理的 Mock 数据');
      return;
    }

    // 2. 确认删除
    console.log('\n⚠️  即将删除这些数据，此操作不可恢复！');
    console.log('按 Ctrl+C 取消，或等待 5 秒后自动继续...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. 删除 mock 数据
    console.log('🗑️  正在删除 Mock 数据...');
    
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .is('last_crawled_at', null);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ 成功删除 ${mockCount} 条 Mock 数据\n`);

    // 4. 统计剩余数据
    const { count: remainingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 剩余商品数据: ${remainingCount || 0} 条`);

    // 5. 按平台统计
    const { data: platformStats } = await supabase
      .from('products')
      .select('platform')
      .not('last_crawled_at', 'is', null);

    if (platformStats) {
      const stats: Record<string, number> = {};
      platformStats.forEach((item: any) => {
        stats[item.platform] = (stats[item.platform] || 0) + 1;
      });

      console.log('\n📈 按平台统计:');
      Object.entries(stats).forEach(([platform, count]) => {
        console.log(`   ${platform}: ${count} 条`);
      });
    }

    console.log('\n✨ 清理完成！');
    console.log('💡 提示: 现在可以使用真实爬虫添加新数据');
    console.log('   访问: http://localhost:3000/admin/real-crawler\n');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

// 执行清理
cleanMockData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('执行出错:', error);
    process.exit(1);
  });
