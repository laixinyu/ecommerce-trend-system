// 自动化规则管理API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateAutomationRuleInput } from '@/types/automation';

/**
 * GET /api/growth/automation/rules
 * 获取自动化规则列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 构建查询
    let query = supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rules, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (error: any) {
    console.error('Get automation rules error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get automation rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/growth/automation/rules
 * 创建自动化规则
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateAutomationRuleInput = await request.json();

    // 验证必填字段
    if (!body.name || !body.trigger || !body.actions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 创建规则
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        trigger: body.trigger,
        actions: body.actions,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: any) {
    console.error('Create automation rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create automation rule' },
      { status: 500 }
    );
  }
}
