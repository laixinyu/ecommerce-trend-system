/**
 * 验证亚马逊类目是否正确应用
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyCategories() {
  console.log('🔍 验证亚马逊类目\n');

  // 1. 检查类目总数
  const { data: allCategories, error: allError } = await supabase
    .from('categories')
    .select('*');

  if (allError) {
    console.error('❌ 获取类目失败:', allError);
    return;
  }

  console.log(`📊 类目统计:`);
  console.log(`  总计: ${allCategories.length} 个类目`);

  // 2. 检查一级类目
  const topLevel = allCategories.filter(c => c.level === 0);
  console.log(`  一级类目: ${topLevel.length} 个`);

  // 3. 检查子类目
  const subLevel = allCategories.filter(c => c.level === 1);
  console.log(`  子类目: ${subLevel.length} 个\n`);

  // 4. 验证关键类目是否存在
  const keyCategories = [
    'Electronics',
    'Computers',
    'Home & Kitchen',
    'Clothing, Shoes & Jewelry',
    'Sports & Outdoors',
    'Beauty & Personal Care',
    'Toys & Games',
    'Baby',
    'Automotive',
    'Pet Supplies',
  ];

  console.log('✅ 验证关键类目:');
  for (const name of keyCategories) {
    const category = allCategories.find(c => c.name === name && c.level === 0);
    if (category) {
      const subs = allCategories.filter(c => c.parent_id === category.id);
      console.log(`  ✓ ${name} (${subs.length} 个子类目)`);
    } else {
      console.log(`  ✗ ${name} - 未找到`);
    }
  }

  // 5. 检查是否有中文类目残留
  console.log('\n🔍 检查中文类目残留:');
  const chineseCategories = allCategories.filter(c => 
    /[\u4e00-\u9fa5]/.test(c.name)
  );

  if (chineseCategories.length > 0) {
    console.log(`  ⚠️  发现 ${chineseCategories.length} 个中文类目:`);
    chineseCategories.forEach(c => {
      console.log(`    - ${c.name}`);
    });
  } else {
    console.log('  ✓ 没有中文类目残留');
  }

  // 6. 检查商品类目关联
  console.log('\n📦 检查商品类目关联:');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, category_id');

  if (prodError) {
    console.error('❌ 获取商品失败:', prodError);
    return;
  }

  const withCategory = products.filter(p => p.category_id !== null);
  const withoutCategory = products.filter(p => p.category_id === null);

  console.log(`  总商品数: ${products.length}`);
  console.log(`  已分类: ${withCategory.length}`);
  console.log(`  未分类: ${withoutCategory.length}`);

  if (withoutCategory.length > 0) {
    console.log(`\n  ⚠️  有 ${withoutCategory.length} 个商品未分类`);
    console.log('  建议: 使用爬虫重新采集商品，或手动分配类目');
  }

  // 7. 显示类目层级结构示例
  console.log('\n📋 类目层级结构示例:\n');
  const sampleCategories = ['Electronics', 'Home & Kitchen', 'Clothing, Shoes & Jewelry'];
  
  for (const name of sampleCategories) {
    const parent = allCategories.find(c => c.name === name && c.level === 0);
    if (parent) {
      console.log(`${name}:`);
      const children = allCategories.filter(c => c.parent_id === parent.id);
      children.slice(0, 3).forEach(child => {
        console.log(`  └─ ${child.name}`);
      });
      if (children.length > 3) {
        console.log(`  └─ ... 还有 ${children.length - 3} 个子类目`);
      }
      console.log('');
    }
  }

  console.log('✅ 验证完成！\n');
}

verifyCategories().catch(console.error);
