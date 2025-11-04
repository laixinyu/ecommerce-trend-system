import { supabase } from './client';
import type { Database } from '@/types/database';

type Tables = Database['public']['Tables'];

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting current user:', error);
        return null;
    }

    return user;
}

/**
 * 获取用户偏好设置
 */
export async function getUserPreferences(userId: string) {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching user preferences:', error);
        return null;
    }

    return data;
}

/**
 * 创建或更新用户偏好设置
 */
export async function upsertUserPreferences(
    userId: string,
    preferences: Partial<Tables['user_preferences']['Insert']>
) {
    // @ts-ignore - Supabase类型生成问题
    const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            ...preferences,
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting user preferences:', error);
        throw error;
    }

    return data;
}

/**
 * 获取用户收藏的商品
 */
export async function getUserFavorites(userId: string) {
    const { data, error } = await supabase
        .from('user_favorites')
        .select(
            `
      *,
      products (*)
    `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user favorites:', error);
        return [];
    }

    return data;
}

/**
 * 添加商品到收藏
 */
export async function addFavorite(userId: string, productId: string) {
    // @ts-ignore - Supabase类型生成问题
    const { data, error } = await supabase
        .from('user_favorites')
        .insert({
            user_id: userId,
            product_id: productId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }

    return data;
}

/**
 * 从收藏中移除商品
 */
export async function removeFavorite(userId: string, productId: string) {
    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }

    return true;
}

/**
 * 检查商品是否已收藏
 */
export async function isFavorite(userId: string, productId: string) {
    const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
        return false;
    }

    return !!data;
}

/**
 * 获取用户通知
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data;
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string) {
    // @ts-ignore - Supabase类型生成问题
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }

    return true;
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(userId: string) {
    // @ts-expect-error - Supabase类型生成问题
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }

    return true;
}

/**
 * 获取类目列表
 */
export async function getCategories(level?: number) {
    let query = supabase.from('categories').select('*').order('name');

    if (level !== undefined) {
        query = query.eq('level', level);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data;
}

/**
 * 获取子类目
 */
export async function getSubCategories(parentId: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('name');

    if (error) {
        console.error('Error fetching subcategories:', error);
        return [];
    }

    return data;
}
