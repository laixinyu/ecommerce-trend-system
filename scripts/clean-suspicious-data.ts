/**
 * 清理可疑数据
 * 删除有 last_crawled_at 但没有 external_url 的数据（可能是旧的 mock 数据）
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanSuspiciousData() {
  console.log('🧹 开始清理可疑数据...\n');

  try {
    // 1. 统计可疑数据
    const { count: suspiciousCount, data: suspiciousData } = await supabase
      .from('products')
      .select('*')
      .not('last_crawled_at', 'is', null)
      .is('external_url', null);

    console.log(`📊 找到 ${suspiciousCount || 0} 条可疑数据`);

    if (!suspiciousCount || suspiciousCount === 0) {
      console.log('✅ 没有需要清理的可疑数据');
      return;
    }

    // 2. 显示样例
    console.log('\n将要删除的数据样例:');
    suspiciousData?.slice(0, 5).forEach((product, index: number) => {
      console.log(`${index + 1}. ${product.title} (${product.platform})`);
    });

    // 3. 确认删除
    console.log('\n⚠️  即将删除这些数据，此操作不可恢复！');
    console.log('按 Ctrl+C 取消，或等待 5 秒后自动继续...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. 删除可疑数据
    console.log('🗑️  正在删除可疑数据...');
    
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .not('last_crawled_at', 'is', null)
      .is('external_url', null);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ 成功删除 ${suspiciousCount} 条可疑数据\n`);

    // 5. 统计剩余真实数据
    const { count: realCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('last_crawled_at', 'is', null)
      .not('external_url', 'is', null);

    console.log(`📊 剩余真实数据: ${realCount || 0} 条`);

    console.log('\n✨ 清理完成！');
    console.log('💡 提示: 刷新商品页面查看效果\n');

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

cleanSuspiciousData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('执行出错:', error);
    process.exit(1);
  });
