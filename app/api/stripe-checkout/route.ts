import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Issue #4 fix: module-level singleton
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Issue #9: input validation types
interface CheckoutBody {
  meetId: string
  teamId: string
  orgId: string
  athleteCount: number
  entryFeePerAthlete: number
  entryFeePerTeam: number
  meetName: string
}

function validateCheckoutBody(body: unknown): { valid: boolean; error?: string; data?: CheckoutBody } {
  const b = body as Record<string, unknown>

  if (!b.meetId || typeof b.meetId !== 'string') return { valid: false, error: 'meetId is required' }
  if (!b.teamId || typeof b.teamId !== 'string') return { valid: false, error: 'teamId is required' }
  if (!b.orgId  || typeof b.orgId  !== 'string') return { valid: false, error: 'orgId is required' }
  if (!b.meetName || typeof b.meetName !== 'string') return { valid: false, error: 'meetName is required' }

  // Issue #9 fix: enforce non-negative fees and counts
  const athleteCount = Number(b.athleteCount)
  const entryFeePerAthlete = Number(b.entryFeePerAthlete)
  const entryFeePerTeam = Number(b.entryFeePerTeam)

  if (!Number.isFinite(athleteCount) || athleteCount < 0) return { valid: false, error: 'athleteCount must be a non-negative number' }
  if (!Number.isFinite(entryFeePerAthlete) || entryFeePerAthlete < 0) return { valid: false, error: 'entryFeePerAthlete must be non-negative' }
  if (!Number.isFinite(entryFeePerTeam) || entryFeePerTeam < 0) return { valid: false, error: 'entryFeePerTeam must be non-negative' }

  return {
    valid: true,
    data: {
      meetId: b.meetId as string,
      teamId: b.teamId as string,
      orgId: b.orgId as string,
      meetName: b.meetName as string,
      athleteCount,
      entryFeePerAthlete,
      entryFeePerTeam,
    }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Issue #9 fix: validate all inputs before touching Stripe or Supabase
  const validation = validateCheckoutBody(rawBody)
  if (!validation.valid || !validation.data) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { meetId, teamId, orgId, athleteCount, entryFeePerAthlete, entryFeePerTeam, meetName } = validation.data
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!

  try {
    const session = await createCheckoutSession({
      meetId, teamId, orgId, athleteCount,
      entryFeePerAthlete, entryFeePerTeam, meetName,
      successUrl: `${origin}/meets/${meetId}?registered=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/meets/${meetId}/register/team?cancelled=true`,
    })

    if (!session) {
      return NextResponse.json({ error: 'No fees required for this meet' }, { status: 400 })
    }

    await supabaseAdmin.from('payments').insert({
      meet_id: meetId,
      team_id: teamId,
      org_id: orgId,
      amount: (session.amount_total || 0) / 100,
      stripe_session_id: session.id,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
