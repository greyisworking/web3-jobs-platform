import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const POST = withAdminAuth(async (request, _admin) => {
  try {
    const { jobId, hide } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('Job')
      .update({
        isHidden: hide,
        isActive: !hide,
      })
      .eq('id', jobId)

    if (error) {
      // If isHidden column doesn't exist, just update isActive
      if (error.code === '42703') {
        await supabase
          .from('Job')
          .update({ isActive: !hide })
          .eq('id', jobId)
      } else {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to toggle visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update job visibility' },
      { status: 500 }
    )
  }
})
