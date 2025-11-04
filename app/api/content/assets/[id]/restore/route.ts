import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    const body = await request.json();
    const { version_number } = body;

    if (!version_number) {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      );
    }

    // Get the version to restore
    const { data: versions, error: versionError } = await supabase
      .from('content_asset_versions')
      .select('*')
      .eq('asset_id', params.id)
      .eq('version_number', version_number);

    if (versionError || !versions || versions.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const version = versions[0] as any;

    // Verify asset ownership
    const { data: assets, error: assetError } = await supabase
      .from('content_assets')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (assetError || !assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'Content asset not found' },
        { status: 404 }
      );
    }

    // Restore the version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedAssets, error: updateError } = await (supabase
      .from('content_assets')
      .update({
        title: version.title,
        description: version.description,
        tags: version.tags,
        url: version.url,
        storage_path: version.storage_path,
        updated_at: new Date().toISOString(),
      }) as any)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select();

    if (updateError) throw updateError;

    const updatedAsset = updatedAssets && updatedAssets.length > 0 ? updatedAssets[0] : null;

    return NextResponse.json({
      success: true,
      asset: updatedAsset,
      message: `Restored to version ${version_number}`,
    });
  } catch (error: unknown) {
    console.error('Restore asset version error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore asset version' },
      { status: 500 }
    );
  }
}
