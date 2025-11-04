import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify asset ownership
    const { data: asset, error: assetError } = await supabase
      .from('content_assets')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Content asset not found' },
        { status: 404 }
      );
    }

    // Get all versions
    const { data: versions, error } = await supabase
      .from('content_asset_versions')
      .select('*')
      .eq('asset_id', params.id)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      versions: versions || [],
      total: versions?.length || 0,
    });
  } catch (error: unknown) {
    console.error('Get asset versions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get asset versions' },
      { status: 500 }
    );
  }
}
