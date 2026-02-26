import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabase-server'

// Whitelist of admin emails (fallback if admins table doesn't exist)
export const ADMIN_EMAIL_WHITELIST = [
  'admin@neun.wtf',
  'dahye@neun.wtf',
  // Add your admin emails here
]

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // First check admins table
  try {
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!adminError && admin) {
      return { user, admin }
    }
  } catch {
    // Table might not exist, continue to whitelist check
  }

  // Fallback: check email whitelist
  if (user.email && ADMIN_EMAIL_WHITELIST.includes(user.email.toLowerCase())) {
    return { user, admin: { id: user.id, email: user.email, role: 'admin' } }
  }

  throw new Error('Not authorized as admin')
}

export async function isAdminEmail(email: string): Promise<boolean> {
  return ADMIN_EMAIL_WHITELIST.includes(email.toLowerCase())
}

/**
 * Wrap a route handler with admin authentication.
 * Eliminates the repeated try/catch admin guard pattern.
 */
export function withAdminAuth(
  handler: (req: NextRequest, admin: Awaited<ReturnType<typeof getAdminUser>>) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const admin = await getAdminUser()
      return handler(req, admin)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}
