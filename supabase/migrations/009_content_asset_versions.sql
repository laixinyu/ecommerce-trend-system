-- Add version management for content assets

-- Create content asset versions table
CREATE TABLE IF NOT EXISTS content_asset_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(200),
  description TEXT,
  tags TEXT[],
  url TEXT,
  storage_path TEXT,
  metrics JSONB,
  change_note TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add version tracking to content_assets
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES content_assets(id) ON DELETE SET NULL;

-- Create indexes for version queries
CREATE INDEX idx_content_asset_versions_asset ON content_asset_versions(asset_id);
CREATE INDEX idx_content_asset_versions_created ON content_asset_versions(created_at DESC);
CREATE INDEX idx_content_assets_parent ON content_assets(parent_asset_id);

-- Enable RLS for versions table
ALTER TABLE content_asset_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for versions
CREATE POLICY content_asset_versions_user_policy ON content_asset_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM content_assets
      WHERE content_assets.id = content_asset_versions.asset_id
      AND content_assets.user_id = auth.uid()
    )
  );

-- Function to create a new version when asset is updated
CREATE OR REPLACE FUNCTION create_content_asset_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content fields changed
  IF (OLD.title IS DISTINCT FROM NEW.title OR 
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.tags IS DISTINCT FROM NEW.tags OR
      OLD.url IS DISTINCT FROM NEW.url) THEN
    
    -- Insert old version into versions table
    INSERT INTO content_asset_versions (
      asset_id,
      version_number,
      title,
      description,
      tags,
      url,
      storage_path,
      metrics,
      created_by
    ) VALUES (
      OLD.id,
      OLD.current_version,
      OLD.title,
      OLD.description,
      OLD.tags,
      OLD.url,
      OLD.storage_path,
      OLD.metrics,
      OLD.user_id
    );
    
    -- Increment version number
    NEW.current_version := OLD.current_version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version management
CREATE TRIGGER content_asset_version_trigger
  BEFORE UPDATE ON content_assets
  FOR EACH ROW
  EXECUTE FUNCTION create_content_asset_version();
