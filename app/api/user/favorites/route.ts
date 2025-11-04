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

    // 获取用户收藏的商品
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        products (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取收藏列表错误:', error);
      return NextResponse.json(
        { error: '获取收藏列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      favorites: favorites || [],
      count: favorites?.length || 0,
    });
  } catch (error) {
    console.error('获取收藏列表异常:', error);
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
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: '商品ID不能为空' },
        { status: 400 }
      );
    }

    // 添加收藏
    // @ts-expect-error - Supabase类型生成问题
    const { data, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        product_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '该商品已在收藏列表中' },
          { status: 409 }
        );
      }
      console.error('添加收藏错误:', error);
      return NextResponse.json(
        { error: '添加收藏失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      favorite: data,
      message: '收藏成功',
    });
  } catch (error) {
    console.error('添加收藏异常:', error);
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
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json(
        { error: '商品ID不能为空' },
        { status: 400 }
      );
    }

    // 删除收藏
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', product_id);

    if (error) {
      console.error('删除收藏错误:', error);
      return NextResponse.json(
        { error: '删除收藏失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '取消收藏成功',
    });
  } catch (error) {
    console.error('删除收藏异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
