import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { event_type, event_data, user_session } = body

    if (!event_type || typeof event_type !== 'string') {
      return NextResponse.json({ error: 'Missing event_type' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore in Server Component context
            }
          },
        },
      }
    )

    // Fire-and-forget insert — don't block the response
    supabase
      .from('analytics_events')
      .insert({
        event_type,
        event_data: event_data ?? {},
        user_session: user_session ?? null,
      })
      .then(({ error }) => {
        if (error) console.error('Analytics insert error:', error.message)
      })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/*
  SQL to create the analytics_events table (run in Supabase dashboard):

  CREATE TABLE analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    event_data jsonb,
    user_session text,
    created_at timestamptz DEFAULT now()
  );
  CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
  CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
*/
