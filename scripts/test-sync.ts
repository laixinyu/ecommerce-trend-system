/**
 * 测试爬虫同步功能
 * 运行: npm run test:sync
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  console.log('🔍 测试爬虫同步功能...\n');

  // 1. 检查最近的爬取日志
  console.log('1️⃣ 检查最近的爬取日志:');
  const { data: logs, error: logsError } = await supabase
    .from('crawl_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (logsError) {
    console.error('❌ 获取爬取日志失败:', logsError);
  } else {
    console.log(`✅ 找到 ${logs?.length || 0} 条最近的爬取日志`);
    logs?.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.platform} - ${log.status} - ${log.products_saved} 个商品 (${new Date(log.created_at).toLocaleString('zh-CN')})`);
    });
  }

  console.log('');

  // 2. 检查最近添加的商品
  console.log('2️⃣ 检查最近添加的商品:');
  const { data: products, error: productsError, count } = await supabase
    .from('products')
    .select('id, name, platform, created_at', { count: 'exact' })
    .not('last_crawled_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (productsError) {
    console.error('❌ 获取商品失败:', productsError);
  } else {
    console.log(`✅ 找到 ${count} 个爬取的商品，最近 10 个:`);
    products?.forEach((product, index) => {
      const createdAt = new Date(product.created_at);
      const isNew = createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000;
      const badge = isNew ? '🆕' : '  ';
      console.log(`   ${badge} ${index + 1}. [${product.platform}] ${product.name.substring(0, 50)}... (${createdAt.toLocaleString('zh-CN')})`);
    });
  }

  console.log('');

  // 3. 测试同步 API
  console.log('3️⃣ 测试同步 API:');
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 最近 24 小时
  
  try {
    const response = await fetch(`http://localhost:3000/api/crawl/sync?since=${encodeURIComponent(since)}`);
    const result = await response.json();

    if (result.success) {
      console.log('✅ 同步 API 正常工作');
      console.log(`   - 有新数据: ${result.data.hasNewData ? '是' : '否'}`);
      console.log(`   - 新商品数量: ${result.data.newProductsCount}`);
      console.log(`   - 最近爬取次数: ${result.data.recentCrawls.length}`);
    } else {
      console.error('❌ 同步 API 返回错误:', result.error);
    }
  } catch (error) {
    console.error('❌ 无法连接到同步 API (请确保开发服务器正在运行)');
    console.error('   运行: npm run dev');
  }

  console.log('\n✨ 测试完成！');
}

testSync().catch(console.error);
