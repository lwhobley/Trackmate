import { Meet, Event, Heat, Result, Entry, Athlete, Team } from '@/lib/types'

// ============================================================
// LIF (FinishLynx) Start List Format
// ============================================================
export function generateLIF(heat: Heat, event: Event): string {
  const lines: string[] = []
  lines.push(`[LIF]`)
  lines.push(`Event=${event.name}`)
  lines.push(`Round=1`)
  lines.push(`Heat=${heat.heat_num}`)
  lines.push(``)
  
  const startList = Array.isArray(heat.start_list) ? heat.start_list : []
  for (const lane of startList) {
    lines.push(`${lane.lane},${lane.athlete_name},,${lane.seed_time ? formatTime(lane.seed_time) : ''}`)
  }
  
  return lines.join('\n')
}

// ============================================================
// CSV Start List
// ============================================================
export function generateCSVStartList(heat: Heat, event: Event): string {
  const rows: string[][] = [
    ['Lane', 'Name', 'Team', 'Seed Time', 'Bib']
  ]
  
  const startList = Array.isArray(heat.start_list) ? heat.start_list : []
  for (const lane of startList) {
    rows.push([
      lane.lane.toString(),
      lane.athlete_name,
      lane.team_name || '',
      lane.seed_time ? formatTime(lane.seed_time) : '',
      '',
    ])
  }
  
  return rows.map(r => r.join(',')).join('\n')
}

// ============================================================
// Hy-Tek CSV Results Export
// ============================================================
export function generateHyTekCSV(results: Result[]): string {
  const rows: string[][] = [
    ['Place', 'Name', 'Team', 'Time', 'Wind', 'DQ', 'Event', 'Heat']
  ]
  
  for (const r of results) {
    rows.push([
      r.place?.toString() || '',
      r.entries?.athletes?.name || '',
      r.entries?.teams?.name || '',
      r.fat_time ? formatTime(r.fat_time) : (r.hand_time ? formatTime(r.hand_time) : ''),
      r.wind !== null && r.wind !== undefined ? r.wind.toFixed(1) : '',
      r.dq ? 'DQ' : '',
      r.entries?.events?.name || '',
      '',
    ])
  }
  
  return rows.map(r => r.join(',')).join('\n')
}

// ============================================================
// TFRRS XML Export (NCAA)
// ============================================================
export function generateTFRRSXML(meet: Meet, results: Result[]): string {
  const grouped: Record<string, Result[]> = {}
  
  for (const r of results) {
    const eventName = r.entries?.events?.name || 'Unknown'
    if (!grouped[eventName]) grouped[eventName] = []
    grouped[eventName].push(r)
  }
  
  const eventXML = Object.entries(grouped).map(([name, evResults]) => {
    const resultXML = evResults.map(r => `
      <result>
        <place>${r.place || ''}</place>
        <athlete_name>${escapeXML(r.entries?.athletes?.name || '')}</athlete_name>
        <team>${escapeXML(r.entries?.teams?.name || '')}</team>
        <mark>${r.fat_time ? formatTime(r.fat_time) : ''}</mark>
        <wind>${r.wind !== null && r.wind !== undefined ? r.wind : ''}</wind>
        <dq>${r.dq}</dq>
      </result>`).join('')
    
    return `
  <event>
    <name>${escapeXML(name)}</name>
    <results>${resultXML}
    </results>
  </event>`
  }).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<meet>
  <name>${escapeXML(meet.name)}</name>
  <date>${meet.date}</date>
  <venue>${escapeXML(meet.venue || '')}</venue>
  <tfrrs_org_id></tfrrs_org_id>
  <events>${eventXML}
  </events>
</meet>`
}

// ============================================================
// Heat Sheet Text
// ============================================================
export function generateHeatSheetText(heats: Heat[], event: Event): string {
  const lines: string[] = []
  lines.push(`HEAT SHEET: ${event.name}`)
  lines.push(`Gender: ${event.gender.toUpperCase()}`)
  lines.push('='.repeat(50))
  
  for (const heat of heats) {
    lines.push(`\nHeat ${heat.heat_num}`)
    lines.push('-'.repeat(30))
    lines.push('Lane  Name                Team            Seed')
    lines.push('-'.repeat(60))
    
    const startList = Array.isArray(heat.start_list) ? heat.start_list : []
    for (const lane of startList.sort((a, b) => a.lane - b.lane)) {
      const name = (lane.athlete_name || '').padEnd(20)
      const team = (lane.team_name || '').padEnd(15)
      const seed = lane.seed_time ? formatTime(lane.seed_time) : 'NM'
      lines.push(`${lane.lane.toString().padStart(4)}  ${name}${team}${seed}`)
    }
  }
  
  return lines.join('\n')
}

// ============================================================
// Team Scores
// ============================================================
export function calculateTeamScores(
  results: Result[],
  scoringTopN: number = 8
): Record<string, number> {
  const POINTS = [10, 8, 6, 5, 4, 3, 2, 1]
  const teamScores: Record<string, number> = {}
  
  const byEvent: Record<string, Result[]> = {}
  for (const r of results) {
    const eid = r.entries?.events?.id || 'unknown'
    if (!byEvent[eid]) byEvent[eid] = []
    byEvent[eid].push(r)
  }
  
  for (const evResults of Object.values(byEvent)) {
    const sorted = evResults
      .filter(r => !r.dq && !r.dns && r.place)
      .sort((a, b) => (a.place || 99) - (b.place || 99))
      .slice(0, scoringTopN)
    
    sorted.forEach((r, i) => {
      const teamName = r.entries?.teams?.name || 'Unknown'
      const pts = POINTS[i] || 0
      teamScores[teamName] = (teamScores[teamName] || 0) + pts
    })
  }
  
  return teamScores
}

// ============================================================
// Helpers
// ============================================================
function formatTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2)
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${mins}:${secs}`
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
