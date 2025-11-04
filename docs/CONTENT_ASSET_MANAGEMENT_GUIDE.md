# Content Asset Management System - Quick Start Guide

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Storage Bucket
```bash
npm run setup:storage
```

This will:
- Create the `content-assets` storage bucket in Supabase
- Configure file size limits (50MB max)
- Set allowed MIME types
- Display RLS policy instructions

### 3. Apply Database Migration
```bash
npm run migration:009
```

This adds:
- `content_asset_versions` table for version history
- `current_version` and `parent_asset_id` columns to `content_assets`
- Automatic version creation trigger
- RLS policies for version management

### 4. Configure Storage Policies (Manual Step)
Go to your Supabase Dashboard > Storage > Policies and add these policies for the `content-assets` bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload content assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view
CREATE POLICY "Users can view content assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'content-assets');

-- Allow users to update their own files
CREATE POLICY "Users can update their content assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their content assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Features

### Upload Content
1. Navigate to **Content > Assets**
2. Click **"Upload Content"** button
3. Select a file or drag-and-drop
4. Fill in:
   - Title (auto-filled from filename)
   - Description
   - Platform (Facebook, Instagram, TikTok, YouTube)
   - Type (auto-detected: image, video, text, mixed)
   - Tags (press Enter to add each tag)
5. Click **"Upload"**

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, QuickTime, WebM
- Documents: PDF, TXT

**File Size Limit:** 50MB

### Search and Filter
- **Search Bar**: Search by title, description, or tags
- **Platform Filter**: Filter by social media platform
- **Type Filter**: Filter by content type
- Press **Enter** or click **"Search"** to apply filters

### View and Edit Assets
1. Click on any asset card to open the preview dialog
2. Three tabs available:
   - **Preview**: View content and metrics
   - **Details**: Edit title, description, tags
   - **Version History**: View and restore previous versions

### Edit Content
1. Open asset preview
2. Click **"Edit"** button
3. Modify title, description, or tags
4. Click **"Save"**
   - A new version is automatically created
   - Version number increments
   - Previous version is preserved

### Version Management
1. Open asset preview
2. Go to **"Version History"** tab
3. View all previous versions with:
   - Version number
   - Timestamp
   - Content snapshot
   - Change notes (if any)
4. Click **"Restore"** on any version to revert
   - Confirmation required
   - Creates a new version with restored content

### Delete Assets
- Click the **trash icon** on any asset card
- Confirmation required
- Deletes both database record and storage file

## Tag Management

### Adding Tags
- Type tag name in the input field
- Press **Enter** or click **"Add"**
- Tags appear as badges below the input

### Removing Tags
- Click the **X** on any tag badge
- Tag is removed immediately

### Searching by Tags
- Use the search bar with tag names
- Multiple tags can be searched
- Results show assets with any matching tag

## Metrics Display

Each asset shows engagement metrics:
- **Views**: Total view count
- **Likes**: Total likes/reactions
- **Comments**: Total comments
- **Shares**: Total shares
- **Engagement Rate**: Calculated percentage

## File Organization

Files are stored in Supabase Storage with this structure:
```
content-assets/
  └── {user_id}/
      └── {timestamp}_{random}.{extension}
```

This ensures:
- User isolation
- Unique filenames
- Easy cleanup
- Organized structure

## API Endpoints

### List Assets
```
GET /api/content/assets?platform=meta&type=image&limit=50&offset=0
```

### Search Assets
```
GET /api/content/assets/search?q=keyword&tags=tag1,tag2&platform=meta
```

### Upload Asset
```
POST /api/content/assets/upload
Content-Type: multipart/form-data

file: File
title: string
description: string
platform: string
type: string
tags: string (comma-separated)
```

### Get Asset Details
```
GET /api/content/assets/{id}
```

### Update Asset
```
PATCH /api/content/assets/{id}
Content-Type: application/json

{
  "title": "New Title",
  "description": "New Description",
  "tags": ["tag1", "tag2"]
}
```

### Delete Asset
```
DELETE /api/content/assets/{id}
```

### List Versions
```
GET /api/content/assets/{id}/versions
```

### Restore Version
```
POST /api/content/assets/{id}/restore
Content-Type: application/json

{
  "version_number": 2
}
```

## Troubleshooting

### Upload Fails
- Check file size (must be < 50MB)
- Verify file type is supported
- Ensure you're authenticated
- Check storage bucket exists

### Can't See Uploaded Files
- Verify storage policies are configured
- Check RLS policies on content_assets table
- Ensure bucket is public

### Version History Empty
- Versions are only created after edits
- Initial upload doesn't create a version
- Edit the asset to create first version

### Search Not Working
- Ensure migration 009 is applied
- Check database indexes exist
- Verify search query format

## Best Practices

1. **Use Descriptive Titles**: Makes searching easier
2. **Add Relevant Tags**: Improves discoverability
3. **Fill Descriptions**: Provides context for content
4. **Regular Cleanup**: Delete unused assets
5. **Version Notes**: Add change notes when editing (future feature)
6. **Organize by Platform**: Use platform filter effectively
7. **Monitor Metrics**: Track engagement regularly

## Security Notes

- All assets are user-scoped (RLS enforced)
- Files stored with user ID in path
- Only authenticated users can access
- Storage policies prevent cross-user access
- Automatic cleanup on deletion

## Performance Tips

- Use pagination for large asset libraries
- Filter by platform/type to reduce results
- Version history loads on-demand
- Images are served via CDN
- Optimize images before upload

## Future Enhancements

Planned features:
- Bulk upload
- Image editing tools
- AI-powered tagging
- Duplicate detection
- Asset collections
- Collaborative editing
- Advanced analytics
- Export functionality
