/**
 * 验证数据库中的真实数据
 * 检查哪些数据是真实爬取的，哪些可能是 mock 数据
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

async function verifyData() {
  console.log('🔍 验证数据库中的数据...\n');

  try {
    // 1. 统计所有数据
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 总商品数: ${totalCount || 0}`);

    // 2. 有 last_crawled_at 的数据
    const { count: crawledCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('last_crawled_at', 'is', null);

    console.log(`✅ 有爬取时间的: ${crawledCount || 0}`);

    // 3. 有 external_url 的数据
    const { count: urlCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('external_url', 'is', null);

    console.log(`🔗 有外部链接的: ${urlCount || 0}`);

    // 4. 真实数据（同时有 last_crawled_at 和 external_url）
    const { count: realCount, data: realData } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .not('last_crawled_at', 'is', null)
      .not('external_url', 'is', null);

    console.log(`🎯 真实爬取数据: ${realCount || 0}\n`);

    // 5. 显示真实数据样例
    if (realData && realData.length > 0) {
      console.log('📦 真实数据样例:');
      realData.slice(0, 3).forEach((product, index: number) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   平台: ${product.platform}`);
        console.log(`   价格: ¥${product.current_price}`);
        console.log(`   链接: ${product.external_url?.substring(0, 50)}...`);
        console.log(`   爬取时间: ${new Date(product.last_crawled_at).toLocaleString('zh-CN')}`);
      });
    }

    // 6. 可疑的数据（有 last_crawled_at 但没有 external_url）
    const { count: suspiciousCount, data: suspiciousData } = await supabase
      .from('products')
      .select('*')
      .not('last_crawled_at', 'is', null)
      .is('external_url', null);

    if (suspiciousCount && suspiciousCount > 0) {
      console.log(`\n⚠️  可疑数据（有爬取时间但无外部链接）: ${suspiciousCount}`);
      console.log('这些可能是旧的 mock 数据，建议删除:\n');
      
      suspiciousData?.slice(0, 5).forEach((product, index: number) => {
        console.log(`${index + 1}. ${product.title} (${product.platform})`);
      });

      console.log('\n💡 删除这些数据的命令:');
      console.log('   npm run clean-suspicious-data');
    }

    // 7. 按平台统计真实数据
    if (realData && realData.length > 0) {
      const platformStats: Record<string, number> = {};
      realData.forEach((product) => {
        platformStats[product.platform] = (platformStats[product.platform] || 0) + 1;
      });

      console.log('\n📈 真实数据按平台统计:');
      Object.entries(platformStats).forEach(([platform, count]) => {
        console.log(`   ${platform}: ${count} 条`);
      });
    }

    console.log('\n✨ 验证完成！');

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

verifyData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('执行出错:', error);
    process.exit(1);
  });
