// 自动化规则执行API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { automationEngine } from '@/lib/growth/automation-engine';

/**
 * POST /api/growth/automation/execute
 * 手动执行自动化规则检查
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

    // 执行所有活跃规则的检查
    await automationEngine.checkAndExecuteRules(user.id);

    return NextResponse.json({
      message: 'Automation rules checked and executed',
    });
  } catch (error: any) {
    console.error('Execute automation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute automation' },
      { status: 500 }
    );
  }
}
