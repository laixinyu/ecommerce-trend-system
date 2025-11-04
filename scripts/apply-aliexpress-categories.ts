/**
 * 应用 AliExpress 类目到数据库
 * 
 * 使用方法:
 * npx tsx scripts/apply-aliexpress-categories.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AliExpress 主要类目
const aliexpressCategories = [
  // 一级类目
  { name: 'Consumer Electronics', level: 0, platform: 'aliexpress' },
  { name: 'Computer & Office', level: 0, platform: 'aliexpress' },
  { name: 'Phones & Telecommunications', level: 0, platform: 'aliexpress' },
  { name: 'Home & Garden', level: 0, platform: 'aliexpress' },
  { name: 'Jewelry & Accessories', level: 0, platform: 'aliexpress' },
  { name: 'Bags & Shoes', level: 0, platform: 'aliexpress' },
  { name: 'Toys & Hobbies', level: 0, platform: 'aliexpress' },
  { name: 'Watches', level: 0, platform: 'aliexpress' },
  { name: 'Beauty & Health', level: 0, platform: 'aliexpress' },
  { name: 'Hair Extensions & Wigs', level: 0, platform: 'aliexpress' },
  { name: 'Apparel', level: 0, platform: 'aliexpress' },
  { name: 'Sports & Entertainment', level: 0, platform: 'aliexpress' },
  { name: 'Automobiles & Motorcycles', level: 0, platform: 'aliexpress' },
  { name: 'Home Improvement', level: 0, platform: 'aliexpress' },
  { name: 'Mother & Kids', level: 0, platform: 'aliexpress' },
  { name: 'Lights & Lighting', level: 0, platform: 'aliexpress' },
  { name: 'Security & Protection', level: 0, platform: 'aliexpress' },
  { name: 'Furniture', level: 0, platform: 'aliexpress' },
  { name: 'Tools', level: 0, platform: 'aliexpress' },
  { name: 'Luggage & Bags', level: 0, platform: 'aliexpress' },
];

// 二级类目（部分示例）
const aliexpressSubcategories: { name: string; parent: string; level: number; platform: string }[] = [
  // Consumer Electronics
  { name: 'Smart Electronics', parent: 'Consumer Electronics', level: 1, platform: 'aliexpress' },
  { name: 'Video Games', parent: 'Consumer Electronics', level: 1, platform: 'aliexpress' },
  { name: 'Camera & Photo', parent: 'Consumer Electronics', level: 1, platform: 'aliexpress' },
  { name: 'Portable Audio & Video', parent: 'Consumer Electronics', level: 1, platform: 'aliexpress' },
  
  // Computer & Office
  { name: 'Computer Peripherals', parent: 'Computer & Office', level: 1, platform: 'aliexpress' },
  { name: 'Laptop Parts', parent: 'Computer & Office', level: 1, platform: 'aliexpress' },
  { name: 'Office Electronics', parent: 'Computer & Office', level: 1, platform: 'aliexpress' },
  { name: 'Tablet Accessories', parent: 'Computer & Office', level: 1, platform: 'aliexpress' },
  
  // Phones & Telecommunications
  { name: 'Mobile Phone Accessories', parent: 'Phones & Telecommunications', level: 1, platform: 'aliexpress' },
  { name: 'Mobile Phones', parent: 'Phones & Telecommunications', level: 1, platform: 'aliexpress' },
  { name: 'Phone Bags & Cases', parent: 'Phones & Telecommunications', level: 1, platform: 'aliexpress' },
  { name: 'Communication Equipment', parent: 'Phones & Telecommunications', level: 1, platform: 'aliexpress' },
  
  // Home & Garden
  { name: 'Home Decor', parent: 'Home & Garden', level: 1, platform: 'aliexpress' },
  { name: 'Kitchen & Dining', parent: 'Home & Garden', level: 1, platform: 'aliexpress' },
  { name: 'Home Textile', parent: 'Home & Garden', level: 1, platform: 'aliexpress' },
  { name: 'Garden Supplies', parent: 'Home & Garden', level: 1, platform: 'aliexpress' },
  
  // Jewelry & Accessories
  { name: 'Fine Jewelry', parent: 'Jewelry & Accessories', level: 1, platform: 'aliexpress' },
  { name: 'Fashion Jewelry', parent: 'Jewelry & Accessories', level: 1, platform: 'aliexpress' },
  { name: 'Wedding & Engagement', parent: 'Jewelry & Accessories', level: 1, platform: 'aliexpress' },
  
  // Beauty & Health
  { name: 'Makeup', parent: 'Beauty & Health', level: 1, platform: 'aliexpress' },
  { name: 'Skin Care', parent: 'Beauty & Health', level: 1, platform: 'aliexpress' },
  { name: 'Health Care', parent: 'Beauty & Health', level: 1, platform: 'aliexpress' },
  { name: 'Nail Art & Tools', parent: 'Beauty & Health', level: 1, platform: 'aliexpress' },
  
  // Apparel
  { name: 'Women\'s Clothing', parent: 'Apparel', level: 1, platform: 'aliexpress' },
  { name: 'Men\'s Clothing', parent: 'Apparel', level: 1, platform: 'aliexpress' },
  { name: 'Kids\' Clothing', parent: 'Apparel', level: 1, platform: 'aliexpress' },
  { name: 'Underwear & Sleepwear', parent: 'Apparel', level: 1, platform: 'aliexpress' },
  
  // Sports & Entertainment
  { name: 'Sports Bags', parent: 'Sports & Entertainment', level: 1, platform: 'aliexpress' },
  { name: 'Fitness Equipment', parent: 'Sports & Entertainment', level: 1, platform: 'aliexpress' },
  { name: 'Outdoor Sports', parent: 'Sports & Entertainment', level: 1, platform: 'aliexpress' },
  { name: 'Entertainment', parent: 'Sports & Entertainment', level: 1, platform: 'aliexpress' },
];

async function applyAliExpressCategories() {
  console.log('🚀 开始应用 AliExpress 类目...\n');

  try {
    // 1. 插入一级类目
    console.log('📦 插入一级类目...');
    const parentCategories = new Map<string, string>();

    for (const category of aliexpressCategories) {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          parent_id: null,
          level: category.level,
          platform: category.platform,
        })
        .select('id, name')
        .single();

      if (error) {
        console.error(`❌ 插入类目失败: ${category.name}`, error.message);
      } else if (data) {
        parentCategories.set(category.name, data.id);
        console.log(`✅ ${category.name}`);
      }
    }

    console.log(`\n✨ 成功插入 ${parentCategories.size} 个一级类目\n`);

    // 2. 插入二级类目
    console.log('📦 插入二级类目...');
    let subcategoryCount = 0;

    for (const subcategory of aliexpressSubcategories) {
      const parentId = parentCategories.get(subcategory.parent);
      
      if (!parentId) {
        console.error(`❌ 找不到父类目: ${subcategory.parent}`);
        continue;
      }

      const { error } = await supabase
        .from('categories')
        .insert({
          name: subcategory.name,
          parent_id: parentId,
          level: subcategory.level,
          platform: subcategory.platform,
        });

      if (error) {
        console.error(`❌ 插入子类目失败: ${subcategory.name}`, error.message);
      } else {
        subcategoryCount++;
        console.log(`✅ ${subcategory.parent} > ${subcategory.name}`);
      }
    }

    console.log(`\n✨ 成功插入 ${subcategoryCount} 个二级类目\n`);

    // 3. 统计
    const { data: stats } = await supabase
      .from('categories')
      .select('platform, level')
      .eq('platform', 'aliexpress');

    if (stats) {
      const level0 = stats.filter(c => c.level === 0).length;
      const level1 = stats.filter(c => c.level === 1).length;
      
      console.log('📊 AliExpress 类目统计:');
      console.log(`   一级类目: ${level0} 个`);
      console.log(`   二级类目: ${level1} 个`);
      console.log(`   总计: ${stats.length} 个\n`);
    }

    console.log('✅ AliExpress 类目应用完成！');
    console.log('\n💡 提示: 现在可以在爬虫控制台选择 AliExpress 平台和对应的类目了');

  } catch (error) {
    console.error('❌ 应用类目时出错:', error);
    process.exit(1);
  }
}

// 执行
applyAliExpressCategories();
