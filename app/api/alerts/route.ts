import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requireCSRF } from '@/lib/csrf'

export const dynamic = 'force-dynamic'

// GET: Fetch user's job alerts
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: alerts, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// POST: Create a new job alert
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
    const { keywords, categories, regions, minSalary, frequency } = body

    // Validate frequency
    if (frequency && !['daily', 'weekly', 'instant'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    const { data: alert, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: user.id,
        email: user.email,
        keywords: keywords || null,
        categories: categories || null,
        regions: regions || null,
        min_salary: minSalary || null,
        frequency: frequency || 'daily',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

// DELETE: Delete an alert
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
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}

// PATCH: Update an alert
export async function PATCH(request: NextRequest) {
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, keywords, categories, regions, minSalary, frequency, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (keywords !== undefined) updateData.keywords = keywords
    if (categories !== undefined) updateData.categories = categories
    if (regions !== undefined) updateData.regions = regions
    if (minSalary !== undefined) updateData.min_salary = minSalary
    if (frequency !== undefined) updateData.frequency = frequency
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: alert, error } = await supabase
      .from('job_alerts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
