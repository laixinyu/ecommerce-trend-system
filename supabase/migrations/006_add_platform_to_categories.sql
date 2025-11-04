-- 为 categories 表添加 platform 字段
-- 用于区分不同平台的类目体系

-- 1. 添加 platform 字段（可为空，默认为 amazon）
ALTER TABLE categories 
ADD COLUMN platform VARCHAR(20) DEFAULT 'amazon';

-- 2. 更新现有数据，将所有现有类目标记为 amazon
UPDATE categories 
SET platform = 'amazon' 
WHERE platform IS NULL;

-- 3. 添加注释
COMMENT ON COLUMN categories.platform IS '平台标识: amazon, aliexpress, ebay 等';

-- 4. 创建索引以提高查询性能
CREATE INDEX idx_categories_platform ON categories(platform);
CREATE INDEX idx_categories_platform_level ON categories(platform, level);

-- 5. 添加约束（可选）
ALTER TABLE categories 
ADD CONSTRAINT check_platform 
CHECK (platform IN ('amazon', 'aliexpress', 'ebay', 'taobao', 'pinduoduo', 'all'));

