import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  isValidWalletAddress,
  checkRateLimit,
  rateLimitedResponse,
  checkSybilRisk,
  meetsMinimumRequirements,
  sanitizeInput,
} from '@/lib/security'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/trust/vote - Get active votes
export async function GET(request: NextRequest) {
  const voteId = request.nextUrl.searchParams.get('id')
  const voterWallet = request.nextUrl.searchParams.get('voter')

  try {
    if (voteId) {
      // Get specific vote with records
      const { data: vote, error } = await supabase
        .from('community_votes')
        .select('*')
        .eq('id', voteId)
        .single()

      if (error || !vote) {
        return NextResponse.json({ error: 'Vote not found' }, { status: 404 })
      }

      // Get vote records
      const { data: records } = await supabase
        .from('vote_records')
        .select('*')
        .eq('vote_id', voteId)
        .order('created_at', { ascending: false })

      // Check if user has voted
      let userVote = null
      if (voterWallet) {
        const { data: userRecord } = await supabase
          .from('vote_records')
          .select('decision')
          .eq('vote_id', voteId)
          .eq('voter_wallet', voterWallet.toLowerCase())
          .single()

        userVote = userRecord?.decision || null
      }

      return NextResponse.json({
        vote: {
          id: vote.id,
          targetWallet: vote.target_wallet,
          title: vote.title,
          description: vote.description,
          votingStartsAt: vote.voting_starts_at,
          votingEndsAt: vote.voting_ends_at,
          votesGuilty: vote.votes_guilty,
          votesNotGuilty: vote.votes_not_guilty,
          votesAbstain: vote.votes_abstain,
          totalVoters: vote.total_voters,
          result: vote.result,
          resultFinalizedAt: vote.result_finalized_at,
        },
        records: records?.map(r => ({
          id: r.id,
          voterWallet: r.voter_wallet,
          decision: r.decision,
          comment: r.comment,
          createdAt: r.created_at,
        })) || [],
        userVote,
      })
    }

    // Get all active votes
    const { data: votes, error } = await supabase
      .from('community_votes')
      .select('*')
      .is('result', null)
      .gt('voting_ends_at', new Date().toISOString())
      .order('voting_ends_at', { ascending: true })

    if (error) {
      console.error('Error fetching votes:', error)
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    return NextResponse.json({
      votes: votes?.map(v => ({
        id: v.id,
        targetWallet: v.target_wallet,
        title: v.title,
        description: v.description,
        votingStartsAt: v.voting_starts_at,
        votingEndsAt: v.voting_ends_at,
        votesGuilty: v.votes_guilty,
        votesNotGuilty: v.votes_not_guilty,
        votesAbstain: v.votes_abstain,
        totalVoters: v.total_voters,
        result: v.result,
      })) || [],
    })
  } catch (error) {
    console.error('Error in vote GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trust/vote - Cast a vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voteId, voterWallet, decision, comment } = body

    // Validate required fields
    if (!voteId || !voterWallet || !decision) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // Validate wallet address
    if (!isValidWalletAddress(voterWallet)) {
      return NextResponse.json({ error: '올바른 지갑 주소 형식이 아닙니다.' }, { status: 400 })
    }

    // Validate decision
    if (!['guilty', 'not_guilty', 'abstain'].includes(decision)) {
      return NextResponse.json({ error: '유효하지 않은 투표입니다.' }, { status: 400 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(voterWallet.toLowerCase(), 'vote')
    if (rateLimit.limited) {
      return rateLimitedResponse(rateLimit.retryAfter!)
    }

    // Check minimum requirements
    const requirements = await meetsMinimumRequirements(voterWallet)
    if (!requirements.eligible) {
      return NextResponse.json({ error: requirements.reason }, { status: 403 })
    }

    // Sybil risk check
    const sybilCheck = await checkSybilRisk(voterWallet)
    if (sybilCheck.isSuspicious && sybilCheck.riskScore >= 60) {
      console.warn(`Sybil risk detected for voter ${voterWallet}: ${sybilCheck.reason}`)
      return NextResponse.json({
        error: '의심스러운 활동이 감지되었습니다.',
      }, { status: 403 })
    }

    // Check if vote exists and is still active
    const { data: vote, error: voteError } = await supabase
      .from('community_votes')
      .select('*')
      .eq('id', voteId)
      .single()

    if (voteError || !vote) {
      return NextResponse.json({ error: '투표를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (vote.result) {
      return NextResponse.json({ error: '이미 종료된 투표입니다.' }, { status: 400 })
    }

    if (new Date(vote.voting_ends_at) < new Date()) {
      return NextResponse.json({ error: '투표 기간이 만료되었습니다.' }, { status: 400 })
    }

    // Check if already voted (duplicate prevention)
    const { data: existing } = await supabase
      .from('vote_records')
      .select('id')
      .eq('vote_id', voteId)
      .eq('voter_wallet', voterWallet.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: '이미 투표했습니다.' }, { status: 400 })
    }

    // Sanitize comment
    const sanitizedComment = comment ? sanitizeInput(comment, { limitKey: 'comment' }) : null

    // Cast vote
    const { data, error } = await supabase
      .from('vote_records')
      .insert({
        vote_id: voteId,
        voter_wallet: voterWallet.toLowerCase(),
        decision,
        comment: sanitizedComment,
      })
      .select()
      .single()

    if (error) {
      console.error('Error casting vote:', error)
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
    }

    // Update vote counts
    const updateField = decision === 'guilty' ? 'votes_guilty'
      : decision === 'not_guilty' ? 'votes_not_guilty'
      : 'votes_abstain'

    await supabase
      .from('community_votes')
      .update({
        [updateField]: vote[updateField] + 1,
        total_voters: vote.total_voters + 1,
      })
      .eq('id', voteId)

    // Log the action
    await supabase.from('trust_logs').insert({
      wallet: voterWallet.toLowerCase(),
      action: 'vote_cast',
      related_wallet: vote.target_wallet,
      related_id: voteId,
      reason: decision,
    })

    return NextResponse.json({
      success: true,
      voteRecord: {
        id: data.id,
        voteId: data.vote_id,
        voterWallet: data.voter_wallet,
        decision: data.decision,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error('Error in vote POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
