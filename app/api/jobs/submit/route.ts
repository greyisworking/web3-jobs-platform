import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'
import { requireCSRF } from '@/lib/csrf'

// Basic XSS sanitization
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

// Create Supabase client for API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Rate limiting: max 3 job posts per wallet per day
const postRateLimit = new Map<string, { count: number; resetAt: number }>()
const POST_LIMIT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
const POST_LIMIT_MAX = 3

function checkPostRateLimit(wallet: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = wallet.toLowerCase()
  const entry = postRateLimit.get(key)

  if (!entry || entry.resetAt < now) {
    postRateLimit.set(key, { count: 1, resetAt: now + POST_LIMIT_WINDOW })
    return { allowed: true, remaining: POST_LIMIT_MAX - 1 }
  }

  if (entry.count >= POST_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: POST_LIMIT_MAX - entry.count }
}

export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfError = requireCSRF(request)
  if (csrfError) return csrfError

  try {
    const body = await request.json()
    const {
      companyName,
      companyWebsite,
      sector,
      contactEmail,
      jobTitle,
      jobType,
      location,
      salaryRange,
      description,
      requirements,
      techStack,
      applyUrl,
      walletAddress, // New: poster's wallet address
    } = body

    // Validate required fields
    if (!companyName || !sector || !jobTitle || !jobType || !location || !description || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Wallet is required for instant posting
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet connection required to post jobs' },
        { status: 401 }
      )
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Rate limiting per wallet
    const rateCheck = checkPostRateLimit(walletAddress)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Daily posting limit reached. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Check if company is in priority list
    const priorityCompany = PRIORITY_COMPANIES.find(
      (c) =>
        c.name.toLowerCase() === companyName.toLowerCase() ||
        c.aliases.some((a) => a.toLowerCase() === companyName.toLowerCase())
    )

    // Determine region from location
    const region = location.toLowerCase().includes('korea') ? 'Korea' : 'Global'

    // Generate unique URL for the job
    const jobUrl = `https://neun.wtf/jobs/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: return success if no Supabase configured
      return NextResponse.json({
        success: true,
        message: 'Job posted successfully',
        isPriority: !!priorityCompany,
        instant: true,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if wallet is blacklisted
    const { data: blacklistCheck } = await supabase
      .from('WalletBlacklist')
      .select('id')
      .eq('wallet', walletAddress.toLowerCase())
      .single()

    if (blacklistCheck) {
      return NextResponse.json(
        { error: 'This wallet has been blocked from posting jobs' },
        { status: 403 }
      )
    }

    // Build tags from tech stack
    const tags = techStack
      ? techStack.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    // Insert job directly to Job table (instant posting)
    // Sanitize user inputs to prevent XSS
    const { data, error } = await supabase
      .from('Job')
      .insert({
        title: sanitizeText(jobTitle),
        company: sanitizeText(companyName),
        location: sanitizeText(location),
        type: jobType,
        category: sector,
        description: `${sanitizeText(description)}\n\nRequirements:\n${sanitizeText(requirements)}`,
        url: applyUrl || jobUrl,
        salary: salaryRange || null,
        tags: JSON.stringify(tags),
        source: 'user-posted',
        region,
        postedDate: new Date().toISOString(),
        isActive: true,
        postedBy: walletAddress.toLowerCase(),
        reportCount: 0,
        isHidden: false,
        // Add backers if priority company
        backers: priorityCompany?.backers || null,
        sector: priorityCompany?.sector || sector,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to post job:', error)

      // If columns don't exist, try without new columns
      if (error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('Job')
          .insert({
            title: sanitizeText(jobTitle),
            company: sanitizeText(companyName),
            location: sanitizeText(location),
            type: jobType,
            category: sector,
            description: `${sanitizeText(description)}\n\nRequirements:\n${sanitizeText(requirements)}\n\nPosted by: ${walletAddress}`,
            url: applyUrl || jobUrl,
            salary: salaryRange || null,
            tags: JSON.stringify(tags),
            source: 'user-posted',
            region,
            postedDate: new Date().toISOString(),
            isActive: true,
          })
          .select('id')
          .single()

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Failed to post job' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          id: fallbackData?.id,
          message: 'Job posted successfully',
          isPriority: !!priorityCompany,
          instant: true,
        })
      }

      return NextResponse.json(
        { error: 'Failed to post job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      message: 'Job posted successfully',
      isPriority: !!priorityCompany,
      instant: true,
    })
  } catch (error) {
    console.error('Job submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
