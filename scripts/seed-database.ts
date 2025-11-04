/**
 * 数据库种子数据脚本
 * 用于初始化数据库，填充示例商品数据
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 加载环境变量
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 使用 service role key 来绕过 RLS 策略进行数据插入
// 如果没有设置 service role key，则使用 anon key（可能会失败）
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  警告: 未设置 SUPABASE_SERVICE_ROLE_KEY，使用 anon key 可能会因 RLS 策略而失败');
  console.warn('   建议在 .env.local 中添加 SUPABASE_SERVICE_ROLE_KEY\n');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// 示例类目数据 - 只使用name字段，因为数据库schema中没有description
const categories = [
  { name: '电子产品' },
  { name: '家居用品' },
  { name: '服装配饰' },
  { name: '美妆护肤' },
  { name: '运动户外' },
  { name: '母婴用品' },
  { name: '食品饮料' },
  { name: '图书文具' },
];

// 示例商品数据模板
const productTemplates = [
  // 电子产品
  {
    name: '无线蓝牙耳机 TWS',
    platform: 'amazon' as const,
    category: '电子产品',
    current_price: 29.99,
    image_url: 'https://via.placeholder.com/300x300?text=Wireless+Earbuds',
    product_url: 'https://amazon.com/example',
    review_count: 1250,
    rating: 4.5,
    sales_rank: 150,
    seller_count: 45,
  },
  {
    name: '智能手表运动版',
    platform: 'aliexpress' as const,
    category: '电子产品',
    current_price: 45.00,
    image_url: 'https://via.placeholder.com/300x300?text=Smart+Watch',
    product_url: 'https://aliexpress.com/example',
    review_count: 890,
    rating: 4.3,
    sales_rank: 220,
    seller_count: 32,
  },
  {
    name: 'USB-C 快充数据线',
    platform: 'amazon' as const,
    category: '电子产品',
    current_price: 12.99,
    image_url: 'https://via.placeholder.com/300x300?text=USB-C+Cable',
    product_url: 'https://amazon.com/example',
    review_count: 2100,
    rating: 4.7,
    sales_rank: 80,
    seller_count: 67,
  },
  // 家居用品
  {
    name: 'LED智能台灯',
    platform: 'amazon' as const,
    category: '家居用品',
    current_price: 35.99,
    image_url: 'https://via.placeholder.com/300x300?text=LED+Lamp',
    product_url: 'https://amazon.com/example',
    review_count: 680,
    rating: 4.4,
    sales_rank: 310,
    seller_count: 28,
  },
  {
    name: '收纳整理箱套装',
    platform: 'aliexpress' as const,
    category: '家居用品',
    current_price: 24.99,
    image_url: 'https://via.placeholder.com/300x300?text=Storage+Box',
    product_url: 'https://aliexpress.com/example',
    review_count: 450,
    rating: 4.2,
    sales_rank: 420,
    seller_count: 19,
  },
  // 服装配饰
  {
    name: '运动休闲鞋',
    platform: 'amazon' as const,
    category: '服装配饰',
    current_price: 49.99,
    image_url: 'https://via.placeholder.com/300x300?text=Sneakers',
    product_url: 'https://amazon.com/example',
    review_count: 1580,
    rating: 4.6,
    sales_rank: 180,
    seller_count: 52,
  },
  {
    name: '时尚双肩包',
    platform: 'aliexpress' as const,
    category: '服装配饰',
    current_price: 32.00,
    image_url: 'https://via.placeholder.com/300x300?text=Backpack',
    product_url: 'https://aliexpress.com/example',
    review_count: 920,
    rating: 4.4,
    sales_rank: 260,
    seller_count: 38,
  },
  // 美妆护肤
  {
    name: '维生素C精华液',
    platform: 'amazon' as const,
    category: '美妆护肤',
    current_price: 18.99,
    image_url: 'https://via.placeholder.com/300x300?text=Vitamin+C+Serum',
    product_url: 'https://amazon.com/example',
    review_count: 2350,
    rating: 4.8,
    sales_rank: 45,
    seller_count: 73,
  },
  {
    name: '化妆刷套装',
    platform: 'aliexpress' as const,
    category: '美妆护肤',
    current_price: 15.99,
    image_url: 'https://via.placeholder.com/300x300?text=Makeup+Brushes',
    product_url: 'https://aliexpress.com/example',
    review_count: 780,
    rating: 4.5,
    sales_rank: 290,
    seller_count: 41,
  },
  // 运动户外
  {
    name: '瑜伽垫加厚防滑',
    platform: 'amazon' as const,
    category: '运动户外',
    current_price: 28.99,
    image_url: 'https://via.placeholder.com/300x300?text=Yoga+Mat',
    product_url: 'https://amazon.com/example',
    review_count: 1120,
    rating: 4.6,
    sales_rank: 200,
    seller_count: 48,
  },
  {
    name: '运动水杯大容量',
    platform: 'aliexpress' as const,
    category: '运动户外',
    current_price: 16.99,
    image_url: 'https://via.placeholder.com/300x300?text=Water+Bottle',
    product_url: 'https://aliexpress.com/example',
    review_count: 650,
    rating: 4.3,
    sales_rank: 340,
    seller_count: 25,
  },
];

// 生成趋势分数（基于评分、评论数、销量排名）
function calculateTrendScore(product: any): number {
  const ratingScore = (product.rating / 5) * 30;
  const reviewScore = Math.min((product.review_count / 100) * 30, 30);
  const rankScore = Math.max(40 - (product.sales_rank / 10), 0);
  return Math.round(ratingScore + reviewScore + rankScore);
}

// 生成竞争度分数
function calculateCompetitionScore(product: any): number {
  const reviewDensity = product.review_count / 100;
  return Math.min(Math.round(reviewDensity * 10), 100);
}

// 生成利润估算 (基于价格和竞争度的简单估算)
function calculateProfitEstimate(product: unknown): number {
  // 基于价格范围和销量排名估算利润潜力
  const priceScore = Math.min((product.current_price / 100) * 50, 50);
  const rankScore = Math.max(50 - (product.sales_rank / 10), 0);
  return Math.round(priceScore + rankScore);
}

// 生成推荐分数
function calculateRecommendationScore(trendScore: number, competitionScore: number, profitEstimate: number): number {
  return Math.round((trendScore * 0.4) + ((100 - competitionScore) * 0.3) + (profitEstimate * 0.3));
}

async function seedDatabase() {
  console.log('🌱 开始初始化数据库...\n');

  try {
    // 1. 插入类目数据
    console.log('📁 插入类目数据...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (categoryError) {
      throw new Error(`类目插入失败: ${categoryError.message}`);
    }

    console.log(`✅ 成功插入 ${categoryData.length} 个类目\n`);

    // 创建类目名称到ID的映射
    const categoryMap = new Map(
      categoryData.map((cat) => [cat.name, cat.id])
    );

    // 2. 准备商品数据
    console.log('📦 准备商品数据...');
    const products = productTemplates.map((template) => {
      const trendScore = calculateTrendScore(template);
      const competitionScore = calculateCompetitionScore(template);
      const profitEstimate = calculateProfitEstimate(template);
      const recommendationScore = calculateRecommendationScore(
        trendScore,
        competitionScore,
        profitEstimate
      );

      return {
        platform_id: `${template.platform}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: template.name,
        platform: template.platform,
        category_id: categoryMap.get(template.category)!,
        current_price: template.current_price,
        image_url: template.image_url,
        product_url: template.product_url,
        review_count: template.review_count,
        average_rating: template.rating,
        seller_count: template.seller_count,
        trend_score: trendScore,
        competition_score: competitionScore,
        recommendation_score: recommendationScore,
      };
    });

    // 3. 插入商品数据
    console.log('📦 插入商品数据...');
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (productError) {
      throw new Error(`商品插入失败: ${productError.message}`);
    }

    console.log(`✅ 成功插入 ${productData.length} 个商品\n`);

    // 4. 注意：price_history表在当前schema中不存在，跳过此步骤
    console.log('⏭️  跳过价格历史记录（表不存在）\n');

    // 5. 创建趋势历史记录
    console.log('📈 创建趋势历史记录...');
    const trendHistory = productData.flatMap((product) => {
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        return {
          product_id: product.id,
          date: date.toISOString().split('T')[0], // 只保留日期部分
          search_volume: Math.floor(Math.random() * 1000) + 100,
          sales_rank: Math.floor(Math.random() * 500) + 50,
          price: product.current_price + (Math.random() - 0.5) * 5,
          seller_count: product.seller_count + Math.floor((Math.random() - 0.5) * 10),
        };
      });
    });

    const { error: trendError } = await supabase
      .from('trend_history')
      .insert(trendHistory);

    if (trendError) {
      console.warn(`⚠️  趋势历史插入警告: ${trendError.message}`);
    } else {
      console.log(`✅ 成功插入 ${trendHistory.length} 条趋势历史记录\n`);
    }

    console.log('🎉 数据库初始化完成！\n');
    console.log('📊 数据统计:');
    console.log(`   - 类目: ${categoryData.length} 个`);
    console.log(`   - 商品: ${productData.length} 个`);
    console.log(`   - 趋势历史: ${trendHistory.length} 条`);
    console.log('\n✨ 现在可以访问系统查看数据了！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行脚本
seedDatabase();
