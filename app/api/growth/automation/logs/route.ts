// 自动化执行日志API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/growth/automation/logs
 * 获取自动化执行日志
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
    const ruleId = searchParams.get('rule_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 获取执行记录
    let executionsQuery = supabase
      .from('automation_executions')
      .select('*, automation_rules(name)')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (ruleId) {
      executionsQuery = executionsQuery.eq('rule_id', ruleId);
    }

    const { data: executions, error: executionsError } = await executionsQuery;

    if (executionsError) {
      throw executionsError;
    }

    // 获取详细日志
    const executionIds = executions?.map((e) => e.id) || [];
    const { data: logs, error: logsError } = await supabase
      .from('automation_logs')
      .select('*')
      .in('execution_id', executionIds)
      .order('created_at', { ascending: false });

    if (logsError) {
      throw logsError;
    }

    return NextResponse.json({
      executions: executions || [],
      logs: logs || [],
    });
  } catch (error: any) {
    console.error('Get automation logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get automation logs' },
      { status: 500 }
    );
  }
}
