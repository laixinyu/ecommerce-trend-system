// 单个自动化规则管理API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateAutomationRuleInput } from '@/types/automation';

/**
 * GET /api/growth/automation/rules/[id]
 * 获取单个自动化规则
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error('Get automation rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get automation rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/growth/automation/rules/[id]
 * 更新自动化规则
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body: UpdateAutomationRuleInput = await request.json();

    // 更新规则
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error('Update automation rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update automation rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/growth/automation/rules/[id]
 * 删除自动化规则
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Rule deleted successfully' });
  } catch (error: any) {
    console.error('Delete automation rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete automation rule' },
      { status: 500 }
    );
  }
}
