import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Report threshold for auto-hiding jobs
const REPORT_THRESHOLD = 5

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { jobId, reason, walletAddress } = body

    if (!jobId || !reason) {
      return NextResponse.json(
        { error: 'Job ID and reason are required' },
        { status: 400 }
      )
    }

    // Get IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') ||
               'unknown'

    if (!supabaseUrl || !supabaseKey) {
      console.log('Job report (no Supabase):', { jobId, reason, ip })
      return NextResponse.json({
        success: true,
        message: 'Report submitted',
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this IP/wallet already reported this job
    let existingReport = null
    if (walletAddress) {
      const { data } = await supabase
        .from('JobReport')
        .select('id')
        .eq('jobId', jobId)
        .eq('reporterWallet', walletAddress.toLowerCase())
        .single()
      existingReport = data
    } else {
      const { data } = await supabase
        .from('JobReport')
        .select('id')
        .eq('jobId', jobId)
        .eq('reporterIp', ip)
        .single()
      existingReport = data
    }

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this job' },
        { status: 400 }
      )
    }

    // Create report
    const { error: reportError } = await supabase
      .from('JobReport')
      .insert({
        jobId,
        reason,
        reporterWallet: walletAddress?.toLowerCase() || null,
        reporterIp: ip,
      })

    if (reportError && reportError.code !== '42P01') {
      console.error('Failed to create report:', reportError)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    // Increment report count on job
    const { data: job, error: fetchError } = await supabase
      .from('Job')
      .select('reportCount, postedBy')
      .eq('id', jobId)
      .single()

    if (!fetchError && job) {
      const newCount = (job.reportCount || 0) + 1
      const shouldHide = newCount >= REPORT_THRESHOLD

      await supabase
        .from('Job')
        .update({
          reportCount: newCount,
          isHidden: shouldHide,
          isActive: !shouldHide,
        })
        .eq('id', jobId)

      // If threshold reached and job has poster, consider blacklisting
      if (shouldHide && job.postedBy) {
        // Count how many jobs this wallet has had hidden
        const { count } = await supabase
          .from('Job')
          .select('*', { count: 'exact', head: true })
          .eq('postedBy', job.postedBy)
          .eq('isHidden', true)

        // Auto-blacklist after 3 hidden jobs
        if (count && count >= 3) {
          await supabase
            .from('WalletBlacklist')
            .upsert({
              wallet: job.postedBy,
              reason: 'Auto-blacklisted: multiple reported jobs',
            }, { onConflict: 'wallet' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted. Thank you for helping keep our platform safe.',
    })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
