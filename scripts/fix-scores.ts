import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { calculateTrendScore } from '@/lib/analytics/trend-scoring';
import { calculateCompetitionScore } from '@/lib/analytics/competition-scoring';
import { calculateRecommendationScore } from '@/lib/analytics/recommendation';

// 加载环境变量
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function fixScores() {
  console.log('🔧 修复商品评分数据...\n');

  // 获取所有商品
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('❌ 获取商品失败:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('⚠️  没有找到商品');
    return;
  }

  console.log(`📦 找到 ${products.length} 个商品，开始修复评分...\n`);

  let fixedCount = 0;

  for (const product of products) {
    try {
      // 构建临时 Product 对象用于计算评分
      const tempProduct: any = {
        id: product.id,
        name: product.name,
        platform: product.platform,
        currentPrice: product.current_price,
        averageRating: product.average_rating,
        reviewCount: product.review_count,
        sellerCount: product.seller_count || 1,
        createdAt: product.created_at,
        categoryId: product.category_id || 'default',
        imageUrl: product.image_url,
        productUrl: product.product_url,
      };

      // 重新计算评分
      const trendScore = calculateTrendScore(tempProduct, []);
      const competitionScore = calculateCompetitionScore(tempProduct, []);
      const recommendationScore = calculateRecommendationScore(tempProduct, [], []);

      console.log(`更新商品: ${product.name.substring(0, 50)}...`);
      console.log(`  趋势分数: ${product.trend_score} -> ${trendScore}`);
      console.log(`  竞争度: ${product.competition_score} -> ${competitionScore}`);
      console.log(`  推荐评分: ${product.recommendation_score} -> ${recommendationScore}`);

      // 更新数据库
      const { error: updateError } = await supabase
        .from('products')
        .update({
          trend_score: trendScore,
          competition_score: competitionScore,
          recommendation_score: recommendationScore,
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError);
      } else {
        console.log(`  ✅ 更新成功`);
        fixedCount++;
      }
      console.log('');
    } catch (error) {
      console.error(`处理商品 ${product.id} 时出错:`, error);
    }
  }

  console.log(`\n✅ 完成！成功修复 ${fixedCount}/${products.length} 个商品的评分`);
}

fixScores().catch(console.error);
