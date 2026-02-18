import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET - List user's resumes
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List files in user's resume folder
    const { data: files, error } = await supabase.storage
      .from('resumes')
      .list(user.id, {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Error listing resumes:', error)
      return NextResponse.json({ error: 'Failed to list resumes' }, { status: 500 })
    }

    // Generate signed URLs for each file
    const resumes = await Promise.all(
      (files || [])
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from('resumes')
            .createSignedUrl(`${user.id}/${file.name}`, 3600) // 1 hour

          return {
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: urlData?.signedUrl,
          }
        })
    )

    return NextResponse.json({ resumes })
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}

// POST - Upload a new resume
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const timestamp = Date.now()
    const filename = `resume_${timestamp}.${ext}`
    const path = `${user.id}/${filename}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading resume:', error)
      return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
    }

    // Generate signed URL
    const { data: urlData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(path, 3600)

    return NextResponse.json({
      success: true,
      resume: {
        name: filename,
        path: data.path,
        url: urlData?.signedUrl,
      },
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
  }
}

// DELETE - Delete a resume
export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'No filename provided' }, { status: 400 })
    }

    const path = `${user.id}/${filename}`

    const { error } = await supabase.storage
      .from('resumes')
      .remove([path])

    if (error) {
      console.error('Error deleting resume:', error)
      return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}
