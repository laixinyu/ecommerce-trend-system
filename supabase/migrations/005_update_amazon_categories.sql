-- 更新类目为亚马逊标准类目
-- 参考：https://www.amazon.com/gp/site-directory

-- 清空现有类目数据（保留表结构）
TRUNCATE TABLE categories CASCADE;

-- 插入亚马逊一级类目（英文名称）
INSERT INTO categories (name, parent_id, level) VALUES
    -- Electronics & Computers
    ('Electronics', NULL, 0),
    ('Computers', NULL, 0),
    
    -- Home & Kitchen
    ('Home & Kitchen', NULL, 0),
    ('Kitchen & Dining', NULL, 0),
    ('Furniture', NULL, 0),
    
    -- Fashion
    ('Clothing, Shoes & Jewelry', NULL, 0),
    ('Men''s Fashion', NULL, 0),
    ('Women''s Fashion', NULL, 0),
    
    -- Sports & Outdoors
    ('Sports & Outdoors', NULL, 0),
    ('Outdoor Recreation', NULL, 0),
    
    -- Health & Beauty
    ('Health & Household', NULL, 0),
    ('Beauty & Personal Care', NULL, 0),
    
    -- Toys & Games
    ('Toys & Games', NULL, 0),
    
    -- Books & Media
    ('Books', NULL, 0),
    ('Movies & TV', NULL, 0),
    ('Music', NULL, 0),
    
    -- Baby & Kids
    ('Baby', NULL, 0),
    ('Kids & Baby', NULL, 0),
    
    -- Automotive
    ('Automotive', NULL, 0),
    ('Motorcycle & Powersports', NULL, 0),
    
    -- Pet Supplies
    ('Pet Supplies', NULL, 0),
    
    -- Office & School
    ('Office Products', NULL, 0),
    ('Arts, Crafts & Sewing', NULL, 0),
    
    -- Garden & Tools
    ('Patio, Lawn & Garden', NULL, 0),
    ('Tools & Home Improvement', NULL, 0),
    
    -- Grocery & Food
    ('Grocery & Gourmet Food', NULL, 0),
    
    -- Industrial & Scientific
    ('Industrial & Scientific', NULL, 0)
ON CONFLICT DO NOTHING;

-- 插入 Electronics 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Camera & Photo', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Cell Phones & Accessories', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Headphones', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Home Audio & Theater', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Television & Video', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Video Games', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
UNION ALL
SELECT 'Wearable Technology', id, 1 FROM categories WHERE name = 'Electronics' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Computers 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Laptops', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
UNION ALL
SELECT 'Tablets', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
UNION ALL
SELECT 'Desktop Computers', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
UNION ALL
SELECT 'Computer Accessories', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
UNION ALL
SELECT 'Monitors', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
UNION ALL
SELECT 'Networking Products', id, 1 FROM categories WHERE name = 'Computers' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Home & Kitchen 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Kitchen & Dining', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
UNION ALL
SELECT 'Bedding', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
UNION ALL
SELECT 'Bath', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
UNION ALL
SELECT 'Home Décor', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
UNION ALL
SELECT 'Storage & Organization', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
UNION ALL
SELECT 'Vacuums & Floor Care', id, 1 FROM categories WHERE name = 'Home & Kitchen' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Clothing, Shoes & Jewelry 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Women''s Clothing', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Men''s Clothing', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Women''s Shoes', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Men''s Shoes', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Jewelry', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Watches', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
UNION ALL
SELECT 'Handbags & Wallets', id, 1 FROM categories WHERE name = 'Clothing, Shoes & Jewelry' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Sports & Outdoors 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Exercise & Fitness', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
UNION ALL
SELECT 'Outdoor Clothing', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
UNION ALL
SELECT 'Camping & Hiking', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
UNION ALL
SELECT 'Cycling', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
UNION ALL
SELECT 'Water Sports', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
UNION ALL
SELECT 'Team Sports', id, 1 FROM categories WHERE name = 'Sports & Outdoors' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Health & Household 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Vitamins & Supplements', id, 1 FROM categories WHERE name = 'Health & Household' AND level = 0
UNION ALL
SELECT 'Medical Supplies', id, 1 FROM categories WHERE name = 'Health & Household' AND level = 0
UNION ALL
SELECT 'Household Supplies', id, 1 FROM categories WHERE name = 'Health & Household' AND level = 0
UNION ALL
SELECT 'Personal Care', id, 1 FROM categories WHERE name = 'Health & Household' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Beauty & Personal Care 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Makeup', id, 1 FROM categories WHERE name = 'Beauty & Personal Care' AND level = 0
UNION ALL
SELECT 'Skin Care', id, 1 FROM categories WHERE name = 'Beauty & Personal Care' AND level = 0
UNION ALL
SELECT 'Hair Care', id, 1 FROM categories WHERE name = 'Beauty & Personal Care' AND level = 0
UNION ALL
SELECT 'Fragrance', id, 1 FROM categories WHERE name = 'Beauty & Personal Care' AND level = 0
UNION ALL
SELECT 'Tools & Accessories', id, 1 FROM categories WHERE name = 'Beauty & Personal Care' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Toys & Games 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Action Figures & Toys', id, 1 FROM categories WHERE name = 'Toys & Games' AND level = 0
UNION ALL
SELECT 'Building Toys', id, 1 FROM categories WHERE name = 'Toys & Games' AND level = 0
UNION ALL
SELECT 'Dolls & Accessories', id, 1 FROM categories WHERE name = 'Toys & Games' AND level = 0
UNION ALL
SELECT 'Games', id, 1 FROM categories WHERE name = 'Toys & Games' AND level = 0
UNION ALL
SELECT 'Puzzles', id, 1 FROM categories WHERE name = 'Toys & Games' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Baby 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Baby Care', id, 1 FROM categories WHERE name = 'Baby' AND level = 0
UNION ALL
SELECT 'Baby Clothing', id, 1 FROM categories WHERE name = 'Baby' AND level = 0
UNION ALL
SELECT 'Baby Furniture', id, 1 FROM categories WHERE name = 'Baby' AND level = 0
UNION ALL
SELECT 'Baby Strollers', id, 1 FROM categories WHERE name = 'Baby' AND level = 0
UNION ALL
SELECT 'Diapering', id, 1 FROM categories WHERE name = 'Baby' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Automotive 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Car Electronics', id, 1 FROM categories WHERE name = 'Automotive' AND level = 0
UNION ALL
SELECT 'Car Accessories', id, 1 FROM categories WHERE name = 'Automotive' AND level = 0
UNION ALL
SELECT 'Tools & Equipment', id, 1 FROM categories WHERE name = 'Automotive' AND level = 0
UNION ALL
SELECT 'Replacement Parts', id, 1 FROM categories WHERE name = 'Automotive' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Pet Supplies 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Dogs', id, 1 FROM categories WHERE name = 'Pet Supplies' AND level = 0
UNION ALL
SELECT 'Cats', id, 1 FROM categories WHERE name = 'Pet Supplies' AND level = 0
UNION ALL
SELECT 'Fish & Aquatic Pets', id, 1 FROM categories WHERE name = 'Pet Supplies' AND level = 0
UNION ALL
SELECT 'Birds', id, 1 FROM categories WHERE name = 'Pet Supplies' AND level = 0
ON CONFLICT DO NOTHING;

-- 插入 Tools & Home Improvement 子类目
INSERT INTO categories (name, parent_id, level)
SELECT 'Power Tools', id, 1 FROM categories WHERE name = 'Tools & Home Improvement' AND level = 0
UNION ALL
SELECT 'Hand Tools', id, 1 FROM categories WHERE name = 'Tools & Home Improvement' AND level = 0
UNION ALL
SELECT 'Building Supplies', id, 1 FROM categories WHERE name = 'Tools & Home Improvement' AND level = 0
UNION ALL
SELECT 'Electrical', id, 1 FROM categories WHERE name = 'Tools & Home Improvement' AND level = 0
UNION ALL
SELECT 'Hardware', id, 1 FROM categories WHERE name = 'Tools & Home Improvement' AND level = 0
ON CONFLICT DO NOTHING;

-- 创建类目名称映射视图（用于中英文对照）
CREATE OR REPLACE VIEW category_mappings AS
SELECT 
    id,
    name as english_name,
    CASE name
        -- Electronics & Computers
        WHEN 'Electronics' THEN '电子产品'
        WHEN 'Computers' THEN '电脑办公'
        WHEN 'Camera & Photo' THEN '相机摄影'
        WHEN 'Cell Phones & Accessories' THEN '手机配件'
        WHEN 'Headphones' THEN '耳机'
        WHEN 'Home Audio & Theater' THEN '家庭音响'
        WHEN 'Television & Video' THEN '电视视频'
        WHEN 'Video Games' THEN '电子游戏'
        WHEN 'Wearable Technology' THEN '可穿戴设备'
        
        -- Home & Kitchen
        WHEN 'Home & Kitchen' THEN '家居厨房'
        WHEN 'Kitchen & Dining' THEN '厨房餐饮'
        WHEN 'Furniture' THEN '家具'
        WHEN 'Bedding' THEN '床上用品'
        WHEN 'Bath' THEN '浴室用品'
        WHEN 'Home Décor' THEN '家居装饰'
        
        -- Fashion
        WHEN 'Clothing, Shoes & Jewelry' THEN '服装鞋履珠宝'
        WHEN 'Men''s Fashion' THEN '男装'
        WHEN 'Women''s Fashion' THEN '女装'
        WHEN 'Women''s Clothing' THEN '女装'
        WHEN 'Men''s Clothing' THEN '男装'
        WHEN 'Women''s Shoes' THEN '女鞋'
        WHEN 'Men''s Shoes' THEN '男鞋'
        WHEN 'Jewelry' THEN '珠宝首饰'
        WHEN 'Watches' THEN '手表'
        
        -- Sports & Outdoors
        WHEN 'Sports & Outdoors' THEN '运动户外'
        WHEN 'Exercise & Fitness' THEN '健身器材'
        WHEN 'Camping & Hiking' THEN '露营徒步'
        WHEN 'Cycling' THEN '自行车'
        
        -- Health & Beauty
        WHEN 'Health & Household' THEN '健康家居'
        WHEN 'Beauty & Personal Care' THEN '美妆个护'
        WHEN 'Makeup' THEN '化妆品'
        WHEN 'Skin Care' THEN '护肤品'
        WHEN 'Hair Care' THEN '护发产品'
        
        -- Toys & Games
        WHEN 'Toys & Games' THEN '玩具游戏'
        
        -- Baby
        WHEN 'Baby' THEN '母婴用品'
        WHEN 'Baby Care' THEN '婴儿护理'
        WHEN 'Baby Clothing' THEN '婴儿服装'
        
        -- Automotive
        WHEN 'Automotive' THEN '汽车用品'
        WHEN 'Car Electronics' THEN '车载电子'
        WHEN 'Car Accessories' THEN '汽车配件'
        
        -- Pet Supplies
        WHEN 'Pet Supplies' THEN '宠物用品'
        WHEN 'Dogs' THEN '狗用品'
        WHEN 'Cats' THEN '猫用品'
        
        -- Tools
        WHEN 'Tools & Home Improvement' THEN '工具家装'
        WHEN 'Power Tools' THEN '电动工具'
        WHEN 'Hand Tools' THEN '手动工具'
        
        -- Office
        WHEN 'Office Products' THEN '办公用品'
        
        -- Books & Media
        WHEN 'Books' THEN '图书'
        WHEN 'Movies & TV' THEN '影视'
        WHEN 'Music' THEN '音乐'
        
        -- Grocery
        WHEN 'Grocery & Gourmet Food' THEN '食品饮料'
        
        ELSE name
    END as chinese_name,
    parent_id,
    level
FROM categories;

-- 添加注释
COMMENT ON TABLE categories IS '亚马逊标准类目表';
COMMENT ON VIEW category_mappings IS '类目中英文对照视图';
