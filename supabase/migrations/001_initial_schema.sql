-- 电商流行趋势系统 - 初始数据库架构

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建类目表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建类目索引
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);

-- 创建商品表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('amazon', 'aliexpress', 'ebay', 'taobao', 'pinduoduo')),
    name VARCHAR(500) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(1000),
    product_url VARCHAR(1000),
    current_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    trend_score DECIMAL(5, 2) DEFAULT 0,
    competition_score DECIMAL(5, 2) DEFAULT 0,
    recommendation_score DECIMAL(5, 2) DEFAULT 0,
    seller_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_id)
);

-- 创建商品索引
CREATE INDEX idx_products_platform ON products(platform);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_trend_score ON products(trend_score DESC);
CREATE INDEX idx_products_updated_at ON products(updated_at DESC);
CREATE INDEX idx_products_recommendation_score ON products(recommendation_score DESC);

-- 创建趋势历史表
CREATE TABLE IF NOT EXISTS trend_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    search_volume INTEGER DEFAULT 0,
    sales_rank INTEGER DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    seller_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- 创建趋势历史索引
CREATE INDEX idx_trend_history_product ON trend_history(product_id);
CREATE INDEX idx_trend_history_date ON trend_history(date DESC);
CREATE INDEX idx_trend_history_product_date ON trend_history(product_id, date DESC);

-- 创建关键词表
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword VARCHAR(200) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建关键词索引
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
CREATE INDEX idx_keywords_search_volume ON keywords(search_volume DESC);

-- 创建用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    watched_categories TEXT[] DEFAULT '{}',
    watched_keywords TEXT[] DEFAULT '{}',
    notification_enabled BOOLEAN DEFAULT true,
    email_notification BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 创建用户收藏索引
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_product ON user_favorites(product_id);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('emerging_trend', 'price_change', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建通知索引
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 创建报告表
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('trend_overview', 'category_analysis', 'competition_analysis', 'custom')),
    parameters JSONB DEFAULT '{}',
    file_url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建报告索引
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始类目数据
INSERT INTO categories (name, parent_id, level) VALUES
    ('电子产品', NULL, 0),
    ('服装配饰', NULL, 0),
    ('家居生活', NULL, 0),
    ('美妆个护', NULL, 0),
    ('运动户外', NULL, 0),
    ('食品饮料', NULL, 0),
    ('母婴用品', NULL, 0),
    ('图书文娱', NULL, 0),
    ('汽车用品', NULL, 0),
    ('宠物用品', NULL, 0)
ON CONFLICT DO NOTHING;

-- 为电子产品添加子类目
INSERT INTO categories (name, parent_id, level)
SELECT '手机通讯', id, 1 FROM categories WHERE name = '电子产品' AND level = 0
UNION ALL
SELECT '电脑办公', id, 1 FROM categories WHERE name = '电子产品' AND level = 0
UNION ALL
SELECT '数码配件', id, 1 FROM categories WHERE name = '电子产品' AND level = 0
ON CONFLICT DO NOTHING;

-- 为服装配饰添加子类目
INSERT INTO categories (name, parent_id, level)
SELECT '男装', id, 1 FROM categories WHERE name = '服装配饰' AND level = 0
UNION ALL
SELECT '女装', id, 1 FROM categories WHERE name = '服装配饰' AND level = 0
UNION ALL
SELECT '鞋靴', id, 1 FROM categories WHERE name = '服装配饰' AND level = 0
UNION ALL
SELECT '箱包', id, 1 FROM categories WHERE name = '服装配饰' AND level = 0
ON CONFLICT DO NOTHING;

-- 为家居生活添加子类目
INSERT INTO categories (name, parent_id, level)
SELECT '家具', id, 1 FROM categories WHERE name = '家居生活' AND level = 0
UNION ALL
SELECT '家纺', id, 1 FROM categories WHERE name = '家居生活' AND level = 0
UNION ALL
SELECT '厨具', id, 1 FROM categories WHERE name = '家居生活' AND level = 0
UNION ALL
SELECT '家装', id, 1 FROM categories WHERE name = '家居生活' AND level = 0
ON CONFLICT DO NOTHING;
