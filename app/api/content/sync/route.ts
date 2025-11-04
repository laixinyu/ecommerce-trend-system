import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentSyncService } from '@/lib/integrations/sync/content-sync-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sync content from all platforms
    const result = await ContentSyncService.syncAllPlatforms(user.id);

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      errors: result.errors,
      message: result.success 
        ? `Successfully synced ${result.synced} content items`
        : 'Sync completed with errors',
    });
  } catch (error: any) {
    console.error('Content sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync content' },
      { status: 500 }
    );
  }
}
