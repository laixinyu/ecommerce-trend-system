-- 添加 products 表的删除和更新策略
-- 这允许认证用户删除和更新商品（用于批量删除功能）

-- 添加 INSERT 策略（用于爬虫添加商品）
CREATE POLICY "Authenticated users can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 添加 UPDATE 策略（用于更新商品信息）
CREATE POLICY "Authenticated users can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (true);

-- 添加 DELETE 策略（用于批量删除功能）
CREATE POLICY "Authenticated users can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (true);

-- 同样为 trend_history 表添加删除策略（级联删除需要）
CREATE POLICY "Authenticated users can delete trend history"
    ON trend_history FOR DELETE
    TO authenticated
    USING (true);

-- 为 categories 表添加写入策略（用于类目管理）
CREATE POLICY "Authenticated users can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete categories"
    ON categories FOR DELETE
    TO authenticated
    USING (true);
