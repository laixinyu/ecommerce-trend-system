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

    // 获取用户保存的筛选组合
    const { data: filters, error } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取筛选组合错误:', error);
      return NextResponse.json(
        { error: '获取筛选组合失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      filters: filters || [],
      count: filters?.length || 0,
    });
  } catch (error) {
    console.error('获取筛选组合异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { name, filters } = body;

    if (!name || !filters) {
      return NextResponse.json(
        { error: '筛选组合名称和筛选条件不能为空' },
        { status: 400 }
      );
    }

    // 保存筛选组合
    // @ts-expect-error - Supabase类型生成问题
    const { data, error } = await supabase
      .from('saved_filters')
      .insert({
        user_id: user.id,
        name,
        filters,
      })
      .select()
      .single();

    if (error) {
      console.error('保存筛选组合错误:', error);
      return NextResponse.json(
        { error: '保存筛选组合失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      filter: data,
      message: '筛选组合已保存',
    });
  } catch (error) {
    console.error('保存筛选组合异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const filter_id = searchParams.get('id');

    if (!filter_id) {
      return NextResponse.json(
        { error: '筛选组合ID不能为空' },
        { status: 400 }
      );
    }

    // 删除筛选组合
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', filter_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('删除筛选组合错误:', error);
      return NextResponse.json(
        { error: '删除筛选组合失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '筛选组合已删除',
    });
  } catch (error) {
    console.error('删除筛选组合异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
