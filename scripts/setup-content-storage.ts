import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('Setting up content-assets storage bucket...');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      process.exit(1);
    }

    const bucketExists = buckets?.some(b => b.name === 'content-assets');

    if (!bucketExists) {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('content-assets', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/quicktime',
          'video/webm',
          'application/pdf',
          'text/plain',
        ],
      });

      if (error) {
        console.error('Error creating bucket:', error);
        process.exit(1);
      }

      console.log('✓ Created content-assets bucket');
    } else {
      console.log('✓ content-assets bucket already exists');
    }

    // Set up storage policies
    console.log('\nSetting up storage policies...');
    console.log('Note: You may need to manually configure RLS policies in Supabase dashboard:');
    console.log('1. Go to Storage > Policies');
    console.log('2. Create policy for content-assets bucket:');
    console.log('   - SELECT: authenticated users can read their own files');
    console.log('   - INSERT: authenticated users can upload files');
    console.log('   - UPDATE: authenticated users can update their own files');
    console.log('   - DELETE: authenticated users can delete their own files');
    console.log('\nExample policy SQL:');
    console.log(`
CREATE POLICY "Users can upload content assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view content assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'content-assets');

CREATE POLICY "Users can update their content assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their content assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
    `);

    console.log('\n✓ Storage setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupStorage();
