import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

let lastRunTime = 0
const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutes

export async function POST() {
  let adminUser
  try {
    adminUser = await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: max 1 run per 5 minutes
  const now = Date.now()
  if (now - lastRunTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastRunTime)) / 1000)
    return NextResponse.json(
      {
        success: false,
        message: `Rate limited. Please wait ${waitSec} seconds before running again.`,
      },
      { status: 429 }
    )
  }

  lastRunTime = now

  // Audit log
  const supabase = await createSupabaseServerClient()
  await supabase.from('admin_audit_log').insert({
    admin_id: adminUser.user.id,
    action: 'crawler_run',
    details: { triggered_at: new Date().toISOString() },
  })

  // Run crawler as child process
  const projectRoot = path.resolve(process.cwd())

  return new Promise<NextResponse>((resolve) => {
    const output: string[] = []
    const child = spawn('npx', ['tsx', 'scripts/crawl.ts'], {
      cwd: projectRoot,
      env: { ...process.env },
      shell: true,
    })

    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      output.push('\n[TIMEOUT] Crawler killed after 10 minutes')
      resolve(
        NextResponse.json({
          success: false,
          message: 'Crawler timed out after 10 minutes',
          output: output.join(''),
        })
      )
    }, 10 * 60 * 1000)

    child.stdout.on('data', (data: Buffer) => {
      output.push(data.toString())
    })

    child.stderr.on('data', (data: Buffer) => {
      output.push(data.toString())
    })

    child.on('close', (code) => {
      clearTimeout(timeout)
      resolve(
        NextResponse.json({
          success: code === 0,
          message:
            code === 0
              ? 'Crawler completed successfully'
              : `Crawler exited with code ${code}`,
          output: output.join(''),
        })
      )
    })

    child.on('error', (err) => {
      clearTimeout(timeout)
      resolve(
        NextResponse.json(
          {
            success: false,
            message: `Failed to start crawler: ${err.message}`,
            output: output.join(''),
          },
          { status: 500 }
        )
      )
    })
  })
}
