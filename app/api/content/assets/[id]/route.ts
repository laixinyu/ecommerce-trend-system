import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: asset, error } = await supabase
      .from('content_assets')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !asset) {
      return NextResponse.json(
        { error: 'Content asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error('Get content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get content asset' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { title, description, tags, platform } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (platform !== undefined) updates.platform = platform;

    const { data: asset, error } = await supabase
      .from('content_assets')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update content asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error: any) {
    console.error('Update content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update content asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get asset to find storage path
    const { data: asset, error: fetchError } = await supabase
      .from('content_assets')
      .select('storage_path')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json(
        { error: 'Content asset not found' },
        { status: 404 }
      );
    }

    // Delete from storage if path exists
    if (asset.storage_path) {
      await supabase.storage
        .from('content-assets')
        .remove([asset.storage_path]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('content_assets')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete content asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content asset deleted',
    });
  } catch (error: any) {
    console.error('Delete content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete content asset' },
      { status: 500 }
    );
  }
}
