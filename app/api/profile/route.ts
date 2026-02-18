import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      headline,
      bio,
      location,
      website,
      twitter,
      github,
      linkedin,
      skills,
      avatar_url,
      is_open_to_work,
      preferred_roles,
      preferred_locations,
    } = body

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name,
        headline,
        bio,
        location,
        website,
        twitter,
        github,
        linkedin,
        skills: skills || [],
        avatar_url,
        is_open_to_work: is_open_to_work || false,
        preferred_roles: preferred_roles || [],
        preferred_locations: preferred_locations || [],
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving profile:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
