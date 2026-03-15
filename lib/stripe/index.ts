import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export async function createCheckoutSession({
  meetId,
  teamId,
  orgId,
  athleteCount,
  entryFeePerAthlete,
  entryFeePerTeam,
  meetName,
  successUrl,
  cancelUrl,
}: {
  meetId: string
  teamId: string
  orgId: string
  athleteCount: number
  entryFeePerAthlete: number
  entryFeePerTeam: number
  meetName: string
  successUrl: string
  cancelUrl: string
}) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  if (entryFeePerAthlete > 0 && athleteCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: `${meetName} - Athlete Entries (${athleteCount})` },
        unit_amount: Math.round(entryFeePerAthlete * 100),
      },
      quantity: athleteCount,
    })
  }

  if (entryFeePerTeam > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: `${meetName} - Team Entry Fee` },
        unit_amount: Math.round(entryFeePerTeam * 100),
      },
      quantity: 1,
    })
  }

  if (lineItems.length === 0) return null

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      meet_id: meetId,
      team_id: teamId,
      org_id: orgId,
      athlete_count: athleteCount.toString(),
    },
  })

  return session
}
