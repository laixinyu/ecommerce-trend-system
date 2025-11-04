/**
 * 直接应用亚马逊标准类目
 * 此脚本会清空现有类目并插入新的亚马逊类目
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// 加载环境变量
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '已设置' : '未设置');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 亚马逊一级类目
const topLevelCategories = [
  'Electronics',
  'Computers',
  'Home & Kitchen',
  'Kitchen & Dining',
  'Furniture',
  'Clothing, Shoes & Jewelry',
  "Men's Fashion",
  "Women's Fashion",
  'Sports & Outdoors',
  'Outdoor Recreation',
  'Health & Household',
  'Beauty & Personal Care',
  'Toys & Games',
  'Books',
  'Movies & TV',
  'Music',
  'Baby',
  'Kids & Baby',
  'Automotive',
  'Motorcycle & Powersports',
  'Pet Supplies',
  'Office Products',
  'Arts, Crafts & Sewing',
  'Patio, Lawn & Garden',
  'Tools & Home Improvement',
  'Grocery & Gourmet Food',
  'Industrial & Scientific',
];

// 子类目映射
const subCategories: Record<string, string[]> = {
  'Electronics': [
    'Camera & Photo',
    'Cell Phones & Accessories',
    'Headphones',
    'Home Audio & Theater',
    'Television & Video',
    'Video Games',
    'Wearable Technology',
  ],
  'Computers': [
    'Laptops',
    'Tablets',
    'Desktop Computers',
    'Computer Accessories',
    'Monitors',
    'Networking Products',
  ],
  'Home & Kitchen': [
    'Kitchen & Dining',
    'Bedding',
    'Bath',
    'Home Décor',
    'Storage & Organization',
    'Vacuums & Floor Care',
  ],
  'Clothing, Shoes & Jewelry': [
    "Women's Clothing",
    "Men's Clothing",
    "Women's Shoes",
    "Men's Shoes",
    'Jewelry',
    'Watches',
    'Handbags & Wallets',
  ],
  'Sports & Outdoors': [
    'Exercise & Fitness',
    'Outdoor Clothing',
    'Camping & Hiking',
    'Cycling',
    'Water Sports',
    'Team Sports',
  ],
  'Health & Household': [
    'Vitamins & Supplements',
    'Medical Supplies',
    'Household Supplies',
    'Personal Care',
  ],
  'Beauty & Personal Care': [
    'Makeup',
    'Skin Care',
    'Hair Care',
    'Fragrance',
    'Tools & Accessories',
  ],
  'Toys & Games': [
    'Action Figures & Toys',
    'Building Toys',
    'Dolls & Accessories',
    'Games',
    'Puzzles',
  ],
  'Baby': [
    'Baby Care',
    'Baby Clothing',
    'Baby Furniture',
    'Baby Strollers',
    'Diapering',
  ],
  'Automotive': [
    'Car Electronics',
    'Car Accessories',
    'Tools & Equipment',
    'Replacement Parts',
  ],
  'Pet Supplies': [
    'Dogs',
    'Cats',
    'Fish & Aquatic Pets',
    'Birds',
  ],
  'Tools & Home Improvement': [
    'Power Tools',
    'Hand Tools',
    'Building Supplies',
    'Electrical',
    'Hardware',
  ],
};

async function clearCategories() {
  console.log('🗑️  清空现有类目...');
  
  // 先获取所有商品
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id')
    .not('category_id', 'is', null);

  if (fetchError) {
    console.error('❌ 获取商品失败:', fetchError);
    throw fetchError;
  }

  // 清除商品类目关联
  if (products && products.length > 0) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ category_id: null })
      .in('id', products.map(p => p.id));

    if (updateError) {
      console.error('❌ 清除商品类目关联失败:', updateError);
      throw updateError;
    }
    console.log(`  ✓ 已清除 ${products.length} 个商品的类目关联`);
  }

  // 获取所有类目
  const { data: categories, error: catFetchError } = await supabase
    .from('categories')
    .select('id');

  if (catFetchError) {
    console.error('❌ 获取类目失败:', catFetchError);
    throw catFetchError;
  }

  // 删除所有类目
  if (categories && categories.length > 0) {
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .in('id', categories.map(c => c.id));

    if (deleteError) {
      console.error('❌ 删除类目失败:', deleteError);
      throw deleteError;
    }
    console.log(`  ✓ 已删除 ${categories.length} 个类目`);
  }

  console.log('✅ 现有类目已清空');
}

async function insertTopLevelCategories() {
  console.log('📝 插入一级类目...');
  
  const categories = topLevelCategories.map(name => ({
    name,
    level: 0,
  }));

  const { data, error } = await supabase
    .from('categories')
    .insert(categories)
    .select();

  if (error) {
    console.error('❌ 插入一级类目失败:', error);
    throw error;
  }

  console.log(`✅ 成功插入 ${data.length} 个一级类目`);
  return data;
}

async function insertSubCategories(parentCategories: unknown[]) {
  console.log('📝 插入子类目...');
  
  let totalInserted = 0;

  for (const parent of parentCategories) {
    const subs = subCategories[parent.name];
    if (!subs || subs.length === 0) continue;

    const subCategoryData = subs.map(name => ({
      name,
      parent_id: parent.id,
      level: 1,
    }));

    const { data, error } = await supabase
      .from('categories')
      .insert(subCategoryData)
      .select();

    if (error) {
      console.error(`❌ 插入 ${parent.name} 的子类目失败:`, error);
      continue;
    }

    totalInserted += data.length;
    console.log(`  ✓ ${parent.name}: ${data.length} 个子类目`);
  }

  console.log(`✅ 成功插入 ${totalInserted} 个子类目`);
}

async function displayCategories() {
  console.log('\n📊 类目列表：\n');
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('level', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ 获取类目失败:', error);
    return;
  }

  const topLevel = categories.filter(c => c.level === 0);
  const subLevel = categories.filter(c => c.level === 1);

  console.log(`一级类目 (${topLevel.length} 个):`);
  topLevel.forEach(cat => {
    const subs = subLevel.filter(s => s.parent_id === cat.id);
    console.log(`  • ${cat.name} (${subs.length} 个子类目)`);
  });

  console.log(`\n总计: ${categories.length} 个类目`);
}

async function main() {
  console.log('🚀 开始应用亚马逊标准类目\n');

  try {
    // 1. 清空现有类目
    await clearCategories();

    // 2. 插入一级类目
    const parentCategories = await insertTopLevelCategories();

    // 3. 插入子类目
    await insertSubCategories(parentCategories);

    // 4. 显示结果
    await displayCategories();

    console.log('\n✅ 亚马逊类目应用完成！');
    console.log('\n📝 后续步骤：');
    console.log('  1. 访问 /products 查看商品列表');
    console.log('  2. 使用爬虫时选择对应的亚马逊类目');
    console.log('  3. 商品将自动关联到正确的类目');

  } catch (error) {
    console.error('\n❌ 应用失败:', error);
    process.exit(1);
  }
}

main();
