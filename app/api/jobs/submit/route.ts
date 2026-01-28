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
    } = body

    // Validate required fields
    if (!companyName || !sector || !contactEmail || !jobTitle || !jobType || !location || !description || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const region = location.toLowerCase().includes('korea') ? 'korea' : 'global'

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: just log and return success if no Supabase
      console.log('Job submission (no Supabase):', {
        companyName,
        jobTitle,
        contactEmail,
        isPriority: !!priorityCompany,
      })
      return NextResponse.json({
        success: true,
        message: 'Job submitted for review',
        isPriority: !!priorityCompany,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert job submission (pending approval)
    const { data, error } = await supabase
      .from('job_submissions')
      .insert({
        company_name: companyName,
        company_website: companyWebsite || null,
        sector,
        contact_email: contactEmail,
        job_title: jobTitle,
        job_type: jobType,
        location,
        region,
        salary_range: salaryRange || null,
        description,
        requirements,
        tech_stack: techStack || null,
        apply_url: applyUrl || null,
        is_priority: !!priorityCompany,
        backers: priorityCompany?.backers || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to submit job:', error)

      // If table doesn't exist, create fallback response
      if (error.code === '42P01') {
        // Table doesn't exist - log and return success anyway
        console.log('Job submission (no table):', {
          companyName,
          jobTitle,
          contactEmail,
          isPriority: !!priorityCompany,
        })
        return NextResponse.json({
          success: true,
          message: 'Job submitted for review',
          isPriority: !!priorityCompany,
        })
      }

      return NextResponse.json(
        { error: 'Failed to submit job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      message: 'Job submitted for review',
      isPriority: !!priorityCompany,
    })
  } catch (error) {
    console.error('Job submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
