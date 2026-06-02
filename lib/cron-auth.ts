import { NextResponse } from 'next/server'

/** Verify CRON_SECRET Bearer token. Returns error response if unauthorized, null if OK. */
export function verifyCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
