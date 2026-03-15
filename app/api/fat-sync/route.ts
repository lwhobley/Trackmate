import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// FAT Bridge posts parsed LIF/CSV results here
// Called by the trackmeet-bridge CLI
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
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

  // Validate heat belongs to meet
  const { data: heat, error: heatErr } = await supabaseAdmin
    .from('heats')
    .select('id, event_id, events(meet_id)')
    .eq('id', heatId)
    .single()

  if (heatErr || !heat) {
    return NextResponse.json({ error: 'Heat not found' }, { status: 404 })
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

  const { data, error } = await supabaseAdmin
    .from('results')
    .upsert(toUpsert, { onConflict: 'entry_id,heat_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    synced: toUpsert.length,
    heatId,
    meetId,
  })
}

// GET: return current heat start list for FAT bridge to display
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const meetId = searchParams.get('meetId')
  const heatId = searchParams.get('heatId')

  if (!meetId) return NextResponse.json({ error: 'meetId required' }, { status: 400 })

  if (heatId) {
    const { data } = await supabaseAdmin
      .from('heats')
      .select('*, events(*)')
      .eq('id', heatId)
      .single()
    return NextResponse.json(data)
  }

  // Return next pending heat
  const { data } = await supabaseAdmin
    .from('heats')
    .select('*, events!inner(meet_id, name)')
    .eq('events.meet_id', meetId)
    .eq('status', 'pending')
    .order('heat_num')
    .limit(1)
    .single()

  return NextResponse.json(data)
}
