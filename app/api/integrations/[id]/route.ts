// 集成管理API - 单个集成的操作
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Encryption } from '@/lib/security/encryption';
import type { UpdateIntegrationInput } from '@/types/integration';
import type { Database } from '@/types/database';

/**
 * GET /api/integrations/[id]
 * 获取单个集成的详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查询集成
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching integration:', error);
      return NextResponse.json(
        { error: 'Failed to fetch integration' },
        { status: 500 }
      );
    }

    // 不返回实际凭证
    const sanitizedData = {
      ...data,
      credentials: { exists: true },
    };

    return NextResponse.json({ integration: sanitizedData });
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/[id]
 * 更新集成
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body: UpdateIntegrationInput = await request.json();
    const { status, credentials, config, last_sync_at } = body;

    // 构建更新对象
    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
    }

    if (credentials) {
      updates.credentials = Encryption.encryptObject(credentials);
    }

    if (config) {
      updates.config = config;
    }

    if (last_sync_at) {
      updates.last_sync_at = last_sync_at;
    }

    // 更新集成
    const { data, error } = await supabase
      .from('integrations')
      .update(updates as Database['public']['Tables']['integrations']['Update'])
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating integration:', error);
      return NextResponse.json(
        { error: 'Failed to update integration' },
        { status: 500 }
      );
    }

    // 不返回实际凭证
    const sanitizedData = {
      ...data,
      credentials: { exists: true },
    };

    return NextResponse.json({ integration: sanitizedData });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/integrations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/[id]
 * 删除集成
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 删除集成
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting integration:', error);
      return NextResponse.json(
        { error: 'Failed to delete integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/integrations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
