import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateHyTekCSV, generateTFRRSXML, generateCSVStartList, generateLIF } from '@/lib/export'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const meetId = searchParams.get('meetId')
  const type = searchParams.get('type') || 'hytek'
  const heatId = searchParams.get('heatId')
  const eventId = searchParams.get('eventId')

  if (!meetId) return NextResponse.json({ error: 'meetId required' }, { status: 400 })

  const { data: meet } = await supabaseAdmin.from('meets').select('*, orgs(*)').eq('id', meetId).single()

  if (type === 'hytek') {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('*, entries!inner(meet_id, athletes(name), teams(name), events(name))')
      .eq('entries.meet_id', meetId)

    const csv = generateHyTekCSV((results || []) as any)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${meet?.name || 'meet'}-hytek.csv"`,
      },
    })
  }

  if (type === 'tfrrs') {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('*, entries!inner(meet_id, athletes(name), teams(name), events(name))')
      .eq('entries.meet_id', meetId)

    const xml = generateTFRRSXML(meet as any, (results || []) as any)
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml',
        'Content-Disposition': `attachment; filename="${meet?.name || 'meet'}-tfrrs.xml"`,
      },
    })
  }

  if (type === 'lif' && heatId && eventId) {
    const { data: heat } = await supabaseAdmin.from('heats').select('*').eq('id', heatId).single()
    const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single()

    if (!heat || !event) return NextResponse.json({ error: 'Heat or event not found' }, { status: 404 })

    const lif = generateLIF(heat as any, event as any)
    return new NextResponse(lif, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${event.name}-heat${heat.heat_num}.lif"`,
      },
    })
  }

  if (type === 'csv-startlist' && heatId && eventId) {
    const { data: heat } = await supabaseAdmin.from('heats').select('*').eq('id', heatId).single()
    const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single()

    if (!heat || !event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const csv = generateCSVStartList(heat as any, event as any)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${event.name}-heat${heat.heat_num}-startlist.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown export type' }, { status: 400 })
}
