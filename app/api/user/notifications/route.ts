import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户通知偏好
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('获取通知偏好错误:', error);
      return NextResponse.json(
        { error: '获取通知偏好失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: preferences || {
        user_id: user.id,
        email_enabled: true,
        push_enabled: false,
        watched_categories: [],
        watched_keywords: [],
        trend_threshold: 70,
      },
    });
  } catch (error) {
    console.error('获取通知偏好异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      email_enabled,
      push_enabled,
      watched_categories,
      watched_keywords,
      trend_threshold,
    } = body;

    // 更新或插入通知偏好
    // @ts-expect-error - Supabase类型生成问题
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          email_enabled,
          push_enabled,
          watched_categories,
          watched_keywords,
          trend_threshold,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('更新通知偏好错误:', error);
      return NextResponse.json(
        { error: '更新通知偏好失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: data,
      message: '通知偏好已更新',
    });
  } catch (error) {
    console.error('更新通知偏好异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
