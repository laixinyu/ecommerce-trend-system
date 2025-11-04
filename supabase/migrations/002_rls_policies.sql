-- Row Level Security (RLS) 策略配置

-- 启用RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 用户偏好表策略
-- 用户只能查看和修改自己的偏好
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- 用户收藏表策略
-- 用户只能查看和管理自己的收藏
CREATE POLICY "Users can view own favorites"
    ON user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
    ON user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
    ON user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- 通知表策略
-- 用户只能查看和管理自己的通知
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- 报告表策略
-- 用户只能查看和管理自己的报告
CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
    ON reports FOR DELETE
    USING (auth.uid() = user_id);

-- 公共表策略（所有认证用户可读）
-- 类目表 - 所有用户可读
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

-- 商品表 - 所有用户可读
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    TO authenticated
    USING (true);

-- 趋势历史表 - 所有用户可读
ALTER TABLE trend_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trend history is viewable by everyone"
    ON trend_history FOR SELECT
    TO authenticated
    USING (true);

-- 关键词表 - 所有用户可读
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Keywords are viewable by everyone"
    ON keywords FOR SELECT
    TO authenticated
    USING (true);
