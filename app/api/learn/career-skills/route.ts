import { NextRequest, NextResponse } from 'next/server'
import { getCareerSkills, careerPaths } from '@/lib/career-skills'

// GET /api/learn/career-skills?career=smart-contract-engineer
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const careerSlug = searchParams.get('career')

  // If no career specified, return all career paths summary
  if (!careerSlug) {
    return NextResponse.json({
      careers: Object.entries(careerPaths).map(([slug, data]) => ({
        slug,
        name: data.name,
        description: data.description,
      })),
    })
  }

  const data = await getCareerSkills(careerSlug)

  if (!data) {
    return NextResponse.json(
      { error: 'Career path not found or failed to fetch data' },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}
