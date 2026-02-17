import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requireCSRF } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

// GET: Fetch user's job applications
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get applications with job details
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Enrich with job data
    if (applications && applications.length > 0) {
      const jobIds = applications.map(a => a.job_id)
      const { data: jobs } = await supabase
        .from('Job')
        .select('id, title, company, location, url')
        .in('id', jobIds)

      const jobMap = new Map(jobs?.map(j => [j.id, j]) || [])

      const enrichedApplications = applications.map(app => ({
        ...app,
        job: jobMap.get(app.job_id) || null,
      }))

      return NextResponse.json({ applications: enrichedApplications })
    }

    return NextResponse.json({ applications: [] })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST: Create or update an application
export async function POST(request: NextRequest) {
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, status, notes, appliedAt, nextStep, nextStepDate } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    // Check if application exists
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .single()

    if (existing) {
      // Update existing
      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (notes !== undefined) updateData.notes = notes
      if (appliedAt) updateData.applied_at = appliedAt
      if (nextStep !== undefined) updateData.next_step = nextStep
      if (nextStepDate !== undefined) updateData.next_step_date = nextStepDate

      const { data: application, error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ application, updated: true })
    } else {
      // Create new
      const { data: application, error } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status: status || 'applied',
          notes: notes || null,
          applied_at: appliedAt || new Date().toISOString(),
          next_step: nextStep || null,
          next_step_date: nextStepDate || null,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ application, created: true })
    }
  } catch (error) {
    console.error('Error saving application:', error)
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
  }
}

// DELETE: Remove an application
export async function DELETE(request: NextRequest) {
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
