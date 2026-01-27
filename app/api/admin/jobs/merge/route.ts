import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { MergeRequest } from '@/types/admin'

export async function POST(request: NextRequest) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: MergeRequest = await request.json()
  const { keepId, deleteIds } = body

  if (!keepId || !deleteIds || deleteIds.length === 0) {
    return NextResponse.json(
      { error: 'keepId and deleteIds are required' },
      { status: 400 }
    )
  }

  const supabase = await createSupabaseServerClient()

  // Fetch the job to keep and duplicates to merge tags from
  const { data: keepJob } = await supabase
    .from('Job')
    .select('*')
    .eq('id', keepId)
    .single()

  const { data: dupeJobs } = await supabase
    .from('Job')
    .select('tags')
    .in('id', deleteIds)

  if (!keepJob) {
    return NextResponse.json({ error: 'Keep job not found' }, { status: 404 })
  }

  // Merge tags from duplicates into the kept job
  const existingTags: string[] = keepJob.tags
    ? JSON.parse(keepJob.tags)
    : []
  const mergedTagSet = new Set(existingTags)

  if (dupeJobs) {
    for (const dupe of dupeJobs) {
      if (dupe.tags) {
        const dupeTags: string[] = JSON.parse(dupe.tags)
        dupeTags.forEach((t) => mergedTagSet.add(t))
      }
    }
  }

  // Update kept job with merged tags
  const { error: updateError } = await supabase
    .from('Job')
    .update({ tags: JSON.stringify([...mergedTagSet]) })
    .eq('id', keepId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Delete duplicates
  const { error: deleteError } = await supabase
    .from('Job')
    .delete()
    .in('id', deleteIds)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    kept: keepId,
    deleted: deleteIds.length,
  })
}
