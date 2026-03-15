import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Issue #4 fix: module-level singleton, not recreated per request
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Issue #1 fix: dedicated FAT_BRIDGE_SECRET, NOT the service role key
function verifyBridgeAuth(req: NextRequest): boolean {
  const secret = process.env.FAT_BRIDGE_SECRET
  if (!secret) {
    console.error('FAT_BRIDGE_SECRET env var is not set')
    return false
  }
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

// FAT Bridge posts parsed LIF/CSV results here
// Called by the trackmeet-bridge CLI
export async function POST(req: NextRequest) {
  // Issue #1 fix: use dedicated secret
  if (!verifyBridgeAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    meetId: string
    heatId: string
    results: Array<{
      lane: number
      entry_id: string
      fat_time?: number
      wind?: number
      place?: number
      dq?: boolean
      dns?: boolean
    }>
    source?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { meetId, heatId, results } = body

  if (!meetId || !heatId || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Missing required fields: meetId, heatId, results' }, { status: 400 })
  }

  // Issue #10 fix: verify heat belongs to the given meetId
  const { data: heat, error: heatErr } = await supabaseAdmin
    .from('heats')
    .select('id, event_id, events(meet_id)')
    .eq('id', heatId)
    .single()

  if (heatErr || !heat) {
    return NextResponse.json({ error: 'Heat not found' }, { status: 404 })
  }

  // Issue #10 fix: enforce heat→meet ownership
  const heatMeetId = (heat.events as any)?.meet_id
  if (heatMeetId !== meetId) {
    return NextResponse.json({ error: 'Heat does not belong to this meet' }, { status: 403 })
  }

  // Upsert results
  const toUpsert = results
    .filter(r => r.entry_id)
    .map(r => ({
      entry_id: r.entry_id,
      heat_id: heatId,
      fat_time: r.fat_time ?? null,
      wind: r.wind ?? null,
      place: r.place ?? null,
      dq: r.dq ?? false,
      dns: r.dns ?? false,
    }))

  const { error } = await supabaseAdmin
    .from('results')
    .upsert(toUpsert, { onConflict: 'entry_id,heat_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, synced: toUpsert.length, heatId, meetId })
}

// Issue #2 fix: GET also requires auth
export async function GET(req: NextRequest) {
  if (!verifyBridgeAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const meetId = searchParams.get('meetId')
  const heatId = searchParams.get('heatId')

  if (!meetId) return NextResponse.json({ error: 'meetId required' }, { status: 400 })

  if (heatId) {
    // Issue #10 fix: verify heat belongs to meetId even on GET
    const { data } = await supabaseAdmin
      .from('heats')
      .select('*, events!inner(meet_id, name)')
      .eq('id', heatId)
      .eq('events.meet_id', meetId)
      .single()

    if (!data) return NextResponse.json({ error: 'Heat not found for this meet' }, { status: 404 })
    return NextResponse.json(data)
  }

  // Return next pending heat for this meet
  const { data } = await supabaseAdmin
    .from('heats')
    .select('*, events!inner(meet_id, name)')
    .eq('events.meet_id', meetId)
    .eq('status', 'pending')
    .order('heat_num')
    .limit(1)
    .single()

  return NextResponse.json(data ?? null)
}
