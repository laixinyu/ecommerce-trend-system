// 集成管理API - 列表和创建
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Encryption } from '@/lib/security/encryption';
import type { CreateIntegrationInput } from '@/types/integration';
import type { Database, Json } from '@/types/database';

/**
 * GET /api/integrations
 * 获取用户的所有集成
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查询参数
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get('service_type');
    const status = searchParams.get('status');

    // 构建查询
    let query = supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    // 解密credentials（仅返回是否存在，不返回实际值）
    const sanitizedData = data.map((integration) => ({
      ...integration,
      credentials: { exists: true }, // 不返回实际凭证
    }));

    return NextResponse.json({ integrations: sanitizedData });
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * 创建新的集成
 */
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateIntegrationInput = await request.json();
    const { service_name, service_type, credentials, config } = body;

    // 验证必填字段
    if (!service_name || !service_type || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 加密credentials
    const encryptedCredentials = Encryption.encryptObject(credentials);

    // 创建集成记录
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: user.id,
        service_name,
        service_type,
        credentials: encryptedCredentials as unknown as Json,
        config: (config || {}) as unknown as Json,
        status: 'active',
      } as Database['public']['Tables']['integrations']['Insert'])
      .select()
      .single();

    if (error) {
      console.error('Error creating integration:', error);
      return NextResponse.json(
        { error: 'Failed to create integration' },
        { status: 500 }
      );
    }

    // 返回时不包含实际凭证
    const sanitizedData = {
      ...data,
      credentials: { exists: true },
    };

    return NextResponse.json(
      { integration: sanitizedData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
