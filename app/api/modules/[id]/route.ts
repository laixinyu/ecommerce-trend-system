import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ModuleManager } from '@/lib/modules/module-manager';

// PATCH /api/modules/[id] - Update module settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, settings } = body;

    if (typeof enabled === 'boolean') {
      if (enabled) {
        await ModuleManager.enableModule(user.id, moduleId);
      } else {
        await ModuleManager.disableModule(user.id, moduleId);
      }
    }

    if (settings) {
      await ModuleManager.updateModuleSettings(user.id, moduleId, settings);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}
