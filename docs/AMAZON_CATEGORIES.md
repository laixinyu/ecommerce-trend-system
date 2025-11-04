# 亚马逊标准类目

本系统已更新为使用亚马逊标准类目结构，确保与亚马逊平台的类目保持一致。

## 📊 类目统计

- **一级类目**: 27 个
- **子类目**: 64 个
- **总计**: 91 个类目

## 🏷️ 主要类目

### Electronics & Computers

#### Electronics (电子产品)
- Camera & Photo (相机摄影)
- Cell Phones & Accessories (手机配件)
- Headphones (耳机)
- Home Audio & Theater (家庭音响)
- Television & Video (电视视频)
- Video Games (电子游戏)
- Wearable Technology (可穿戴设备)

#### Computers (电脑办公)
- Laptops (笔记本电脑)
- Tablets (平板电脑)
- Desktop Computers (台式电脑)
- Computer Accessories (电脑配件)
- Monitors (显示器)
- Networking Products (网络产品)

### Home & Living

#### Home & Kitchen (家居厨房)
- Kitchen & Dining (厨房餐饮)
- Bedding (床上用品)
- Bath (浴室用品)
- Home Décor (家居装饰)
- Storage & Organization (收纳整理)
- Vacuums & Floor Care (吸尘器和地板护理)

#### Furniture (家具)
- 独立一级类目

#### Tools & Home Improvement (工具家装)
- Power Tools (电动工具)
- Hand Tools (手动工具)
- Building Supplies (建筑材料)
- Electrical (电气)
- Hardware (五金)

### Fashion

#### Clothing, Shoes & Jewelry (服装鞋履珠宝)
- Women's Clothing (女装)
- Men's Clothing (男装)
- Women's Shoes (女鞋)
- Men's Shoes (男鞋)
- Jewelry (珠宝首饰)
- Watches (手表)
- Handbags & Wallets (手提包和钱包)

#### Men's Fashion (男装)
- 独立一级类目

#### Women's Fashion (女装)
- 独立一级类目

### Sports & Outdoors

#### Sports & Outdoors (运动户外)
- Exercise & Fitness (健身器材)
- Outdoor Clothing (户外服装)
- Camping & Hiking (露营徒步)
- Cycling (自行车)
- Water Sports (水上运动)
- Team Sports (团队运动)

#### Outdoor Recreation (户外娱乐)
- 独立一级类目

### Health & Beauty

#### Health & Household (健康家居)
- Vitamins & Supplements (维生素补充剂)
- Medical Supplies (医疗用品)
- Household Supplies (家庭用品)
- Personal Care (个人护理)

#### Beauty & Personal Care (美妆个护)
- Makeup (化妆品)
- Skin Care (护肤品)
- Hair Care (护发产品)
- Fragrance (香水)
- Tools & Accessories (工具配件)

### Kids & Baby

#### Toys & Games (玩具游戏)
- Action Figures & Toys (动作玩偶)
- Building Toys (积木玩具)
- Dolls & Accessories (娃娃配件)
- Games (游戏)
- Puzzles (拼图)

#### Baby (母婴用品)
- Baby Care (婴儿护理)
- Baby Clothing (婴儿服装)
- Baby Furniture (婴儿家具)
- Baby Strollers (婴儿推车)
- Diapering (尿布)

#### Kids & Baby (儿童婴儿)
- 独立一级类目

### Automotive

#### Automotive (汽车用品)
- Car Electronics (车载电子)
- Car Accessories (汽车配件)
- Tools & Equipment (工具设备)
- Replacement Parts (替换零件)

#### Motorcycle & Powersports (摩托车和动力运动)
- 独立一级类目

### Pet Supplies

#### Pet Supplies (宠物用品)
- Dogs (狗用品)
- Cats (猫用品)
- Fish & Aquatic Pets (鱼和水生宠物)
- Birds (鸟用品)

### Books & Media

- **Books** (图书)
- **Movies & TV** (影视)
- **Music** (音乐)

### Office & Crafts

- **Office Products** (办公用品)
- **Arts, Crafts & Sewing** (艺术手工缝纫)

### Garden & Food

- **Patio, Lawn & Garden** (庭院草坪花园)
- **Grocery & Gourmet Food** (食品饮料)

### Industrial

- **Industrial & Scientific** (工业科学)

## 🔄 如何使用

### 1. 在爬虫中使用

```typescript
import { crawlerManager } from '@/lib/crawler/crawler-manager';

// 使用亚马逊类目名称
await crawlerManager.executeCrawlTask({
  platform: 'amazon',
  keyword: 'wireless headphones',
  categoryId: 'electronics-category-id', // 使用 Electronics 类目的 ID
  maxPages: 3,
});
```

### 2. 获取类目列表

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// 获取所有一级类目
const { data: topCategories } = await supabase
  .from('categories')
  .select('*')
  .eq('level', 0)
  .order('name');

// 获取特定类目的子类目
const { data: subCategories } = await supabase
  .from('categories')
  .select('*')
  .eq('parent_id', parentId)
  .order('name');
```

### 3. 类目映射

如果需要中英文对照，可以使用以下映射：

```typescript
const categoryMapping: Record<string, string> = {
  'Electronics': '电子产品',
  'Computers': '电脑办公',
  'Home & Kitchen': '家居厨房',
  'Clothing, Shoes & Jewelry': '服装鞋履珠宝',
  'Sports & Outdoors': '运动户外',
  'Health & Household': '健康家居',
  'Beauty & Personal Care': '美妆个护',
  'Toys & Games': '玩具游戏',
  'Baby': '母婴用品',
  'Automotive': '汽车用品',
  'Pet Supplies': '宠物用品',
  // ... 更多映射
};
```

## 🛠️ 管理命令

### 应用亚马逊类目

```bash
npm run update:categories
```

此命令会：
1. 清空现有类目
2. 清除商品的类目关联
3. 插入亚马逊标准类目
4. 显示类目统计

### 查看类目

访问 Supabase Dashboard 或使用 SQL：

```sql
-- 查看所有一级类目
SELECT * FROM categories WHERE level = 0 ORDER BY name;

-- 查看类目层级结构
SELECT 
  p.name as parent_category,
  c.name as sub_category
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.level = 1
ORDER BY p.name, c.name;
```

## 📝 注意事项

1. **类目名称**: 使用英文名称与亚马逊保持一致
2. **爬虫配置**: 更新爬虫时使用正确的类目 ID
3. **商品关联**: 新爬取的商品会自动关联到指定类目
4. **历史数据**: 旧商品的类目关联已被清除，需要重新分类

## 🔗 参考资料

- [Amazon Site Directory](https://www.amazon.com/gp/site-directory)
- [Amazon Product Categories](https://sellercentral.amazon.com/gp/help/external/200332540)
- [Amazon Browse Tree Guide](https://sellercentral.amazon.com/gp/help/external/1661)

## 📅 更新历史

- **2024-10-29**: 初始版本，应用亚马逊标准类目
  - 27 个一级类目
  - 64 个子类目
  - 总计 91 个类目
