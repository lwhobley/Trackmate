import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as supabaseAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { meetId, teamId, orgId, athleteCount, entryFeePerAthlete, entryFeePerTeam, meetName } = body

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!

  try {
    const session = await createCheckoutSession({
      meetId, teamId, orgId,
      athleteCount: parseInt(athleteCount) || 0,
      entryFeePerAthlete: parseFloat(entryFeePerAthlete) || 0,
      entryFeePerTeam: parseFloat(entryFeePerTeam) || 0,
      meetName,
      successUrl: `${origin}/meets/${meetId}?registered=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/meets/${meetId}/register/team?cancelled=true`,
    })

    if (!session) {
      return NextResponse.json({ error: 'No fees required' }, { status: 400 })
    }

    // Create pending payment record
    const admin = supabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('payments').insert({
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
