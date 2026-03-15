import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Issue #4 fix: module-level singleton
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const { meet_id, team_id, org_id } = session.metadata || {}

    await supabaseAdmin.from('payments').upsert({
      meet_id,
      team_id,
      org_id,
      amount: (session.amount_total || 0) / 100,
      stripe_id: session.payment_intent as string,
      stripe_session_id: session.id,
      status: 'paid',
      metadata: session.metadata,
    }, { onConflict: 'stripe_session_id' })

    await supabaseAdmin.from('entries')
      .update({ status: 'confirmed' })
      .eq('meet_id', meet_id)
      .eq('team_id', team_id)
      .eq('status', 'pending')
  }

  // Issue #3 fix: expired sessions clean up pending entries
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.CheckoutSession
    const { meet_id, team_id } = session.metadata || {}

    await supabaseAdmin.from('payments')
      .update({ status: 'failed' })
      .eq('stripe_session_id', session.id)

    // Clean up dangling pending entries so they don't pollute the meet
    if (meet_id && team_id) {
      await supabaseAdmin.from('entries')
        .update({ status: 'scratched' })
        .eq('meet_id', meet_id)
        .eq('team_id', team_id)
        .eq('status', 'pending')
    }
  }

  return NextResponse.json({ received: true })
}

// Issue #11 fix: removed dead Pages Router `export const config` — not used in App Router
