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

    // 获取用户偏好设置
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('获取用户偏好错误:', error);
      return NextResponse.json(
        { error: '获取用户偏好失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: preferences || {
        user_id: user.id,
        preferred_categories: [],
        preferred_platforms: [],
        min_price: null,
        max_price: null,
      },
    });
  } catch (error) {
    console.error('获取用户偏好异常:', error);
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
      preferred_categories,
      preferred_platforms,
      min_price,
      max_price,
    } = body;

    // 更新或插入用户偏好
    // @ts-expect-error - Supabase类型生成问题
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          preferred_categories,
          preferred_platforms,
          min_price,
          max_price,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('更新用户偏好错误:', error);
      return NextResponse.json(
        { error: '更新用户偏好失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: data,
      message: '偏好设置已更新',
    });
  } catch (error) {
    console.error('更新用户偏好异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
