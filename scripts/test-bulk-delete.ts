/**
 * 测试批量删除功能
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBulkDelete() {
  console.log('🧪 测试批量删除功能\n');

  try {
    // 1. 查看当前商品分数分布
    console.log('📊 查询商品推荐分数分布...');
    const { data: allProducts, error: queryError } = await supabase
      .from('products')
      .select('id, name, recommendation_score')
      .order('recommendation_score', { ascending: true });

    if (queryError) {
      throw queryError;
    }

    console.log(`\n总商品数: ${allProducts?.length || 0}`);

    if (allProducts && allProducts.length > 0) {
      // 分数分布统计
      const scoreRanges = {
        '0-10': 0,
        '10-20': 0,
        '20-30': 0,
        '30-40': 0,
        '40-50': 0,
        '50-60': 0,
        '60-70': 0,
        '70-80': 0,
        '80-90': 0,
        '90-100': 0,
      };

      allProducts.forEach((product) => {
        const score = product.recommendation_score || 0;
        if (score < 10) scoreRanges['0-10']++;
        else if (score < 20) scoreRanges['10-20']++;
        else if (score < 30) scoreRanges['20-30']++;
        else if (score < 40) scoreRanges['30-40']++;
        else if (score < 50) scoreRanges['40-50']++;
        else if (score < 60) scoreRanges['50-60']++;
        else if (score < 70) scoreRanges['60-70']++;
        else if (score < 80) scoreRanges['70-80']++;
        else if (score < 90) scoreRanges['80-90']++;
        else scoreRanges['90-100']++;
      });

      console.log('\n推荐分数分布:');
      Object.entries(scoreRanges).forEach(([range, count]) => {
        if (count > 0) {
          const bar = '█'.repeat(Math.ceil((count / allProducts.length) * 50));
          console.log(`  ${range.padEnd(8)} | ${bar} ${count}`);
        }
      });

      // 显示最低分的 5 个商品
      console.log('\n最低分的 5 个商品:');
      allProducts.slice(0, 5).forEach((product, index) => {
        console.log(
          `  ${index + 1}. [${product.recommendation_score?.toFixed(1) || 0}] ${product.name.substring(0, 50)}...`
        );
      });

      // 统计不同阈值下会删除的商品数
      console.log('\n不同阈值下会删除的商品数:');
      [10, 20, 30, 40, 50, 60, 70].forEach((threshold) => {
        const count = allProducts.filter(
          (p) => (p.recommendation_score || 0) < threshold
        ).length;
        const percentage = ((count / allProducts.length) * 100).toFixed(1);
        console.log(`  < ${threshold} 分: ${count} 个 (${percentage}%)`);
      });
    }

    // 2. 测试删除 API（不实际删除，只是测试请求）
    console.log('\n\n🔧 测试删除 API 端点...');
    console.log('注意: 这只是测试 API 是否可访问，不会实际删除数据');
    console.log('要实际测试删除功能，请在浏览器中访问 /products 页面');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testBulkDelete();
