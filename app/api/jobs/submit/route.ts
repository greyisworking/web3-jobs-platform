import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIORITY_COMPANIES } from '@/lib/priority-companies'

// Create Supabase client for API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
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

    // Check if company is in priority list
    const priorityCompany = PRIORITY_COMPANIES.find(
      (c) =>
        c.name.toLowerCase() === companyName.toLowerCase() ||
        c.aliases.some((a) => a.toLowerCase() === companyName.toLowerCase())
    )

    // Determine region from location
    const region = location.toLowerCase().includes('korea') ? 'Korea' : 'Global'

    // Generate unique URL for the job
    const jobUrl = `https://neun.jobs/job/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: just log and return success if no Supabase
      console.log('Job posted (no Supabase):', {
        companyName,
        jobTitle,
        walletAddress,
        isPriority: !!priorityCompany,
      })
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
    const { data, error } = await supabase
      .from('Job')
      .insert({
        title: jobTitle,
        company: companyName,
        location,
        type: jobType,
        category: sector,
        description: `${description}\n\nRequirements:\n${requirements}`,
        url: applyUrl || jobUrl,
        salary: salaryRange || null,
        tags: JSON.stringify(tags),
        source: 'user-posted',
        region,
        postedDate: new Date().toISOString(),
        isActive: true,
        status: 'active',
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
            title: jobTitle,
            company: companyName,
            location,
            type: jobType,
            category: sector,
            description: `${description}\n\nRequirements:\n${requirements}\n\nPosted by: ${walletAddress}`,
            url: applyUrl || jobUrl,
            salary: salaryRange || null,
            tags: JSON.stringify(tags),
            source: 'user-posted',
            region,
            postedDate: new Date().toISOString(),
            isActive: true,
            status: 'active',
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
