/**
 * Setup Supabase Storage bucket for image uploads
 *
 * Usage:
 *   npx tsx scripts/setup-storage.ts
 *
 * This script:
 * 1. Checks if 'images' bucket exists
 * 2. Creates it if not
 * 3. Sets up public access policy
 */

import * as dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('=== Supabase Storage Setup ===\n')

  // 1. List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('Error listing buckets:', listError.message)
    process.exit(1)
  }

  console.log('Existing buckets:', buckets?.map(b => b.name).join(', ') || 'none')

  // 2. Check if 'images' bucket exists
  const imagesBucket = buckets?.find(b => b.name === 'images')

  if (imagesBucket) {
    console.log('\n✅ "images" bucket already exists')
    console.log('  - ID:', imagesBucket.id)
    console.log('  - Public:', imagesBucket.public)
    console.log('  - Created:', imagesBucket.created_at)
  } else {
    console.log('\n📦 Creating "images" bucket...')

    const { data: _data, error: createError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    })

    if (createError) {
      console.error('Error creating bucket:', createError.message)
      console.log('\n⚠️  Manual setup required:')
      console.log('1. Go to Supabase Dashboard → Storage')
      console.log('2. Click "New Bucket"')
      console.log('3. Name: images')
      console.log('4. Public bucket: ON')
      console.log('5. Allowed MIME types: image/*')
      console.log('6. Max file size: 5MB')
      process.exit(1)
    }

    console.log('✅ Bucket created successfully')
  }

  // 3. Test upload
  console.log('\n🧪 Testing upload...')

  const testContent = Buffer.from('test')
  const testPath = `_test/${Date.now()}.txt`

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(testPath, testContent, {
      contentType: 'text/plain',
      upsert: true
    })

  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError.message)
    console.log('\n⚠️  Check RLS policies:')
    console.log('1. Go to Supabase Dashboard → Storage → Policies')
    console.log('2. Add INSERT policy for authenticated users:')
    console.log('   - Policy name: "Allow authenticated uploads"')
    console.log('   - Target roles: authenticated')
    console.log('   - USING expression: true')
    console.log('   - WITH CHECK expression: true')
  } else {
    console.log('✅ Upload test passed')

    // Clean up test file
    await supabase.storage.from('images').remove([testPath])
    console.log('✅ Test file cleaned up')
  }

  // 4. Print RLS policy SQL
  console.log('\n📝 Recommended RLS policies (run in Supabase SQL Editor):')
  console.log(`
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images');

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images');
`)

  console.log('\n=== Setup Complete ===')
}

main().catch(console.error)
