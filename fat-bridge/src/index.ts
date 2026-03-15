#!/usr/bin/env node
/**
 * trackmeet-bridge — FAT Bridge CLI
 * 
 * Usage:
 *   npx trackmeet-bridge --url https://your-project.supabase.co --meet MEET_ID --key SERVICE_KEY --dir /path/to/Results
 * 
 * Or via env vars:
 *   BRIDGE_SUPABASE_URL=... BRIDGE_SUPABASE_SERVICE_KEY=... npx trackmeet-bridge --meet MEET_ID
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Simple arg parser
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'
      args[key] = val
    }
  }
  return args
}

const args = parseArgs(process.argv)

const SUPABASE_URL = args.url || process.env.BRIDGE_SUPABASE_URL || ''
const SERVICE_KEY = args.key || process.env.BRIDGE_SUPABASE_SERVICE_KEY || ''
const MEET_ID = args.meet || process.env.BRIDGE_MEET_ID || ''
const WATCH_DIR = args.dir || process.env.BRIDGE_WATCH_DIR || './Results'
const API_URL = args['api-url'] || `${SUPABASE_URL.replace('.supabase.co', '')}/functions/v1` || ''
const TRACKMATE_URL = args['trackmate-url'] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Color helpers (simple ANSI)
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
}

if (!SUPABASE_URL || !SERVICE_KEY || !MEET_ID) {
  console.error(c.red('Error: Missing required config'))
  console.log('')
  console.log('Usage:')
  console.log('  trackmeet-bridge --url SUPABASE_URL --key SERVICE_KEY --meet MEET_ID [--dir /path/to/Results]')
  console.log('')
  console.log('Or set env vars: BRIDGE_SUPABASE_URL, BRIDGE_SUPABASE_SERVICE_KEY, BRIDGE_MEET_ID')
  process.exit(1)
}

// ============================================================
// LIF PARSER — FinishLynx .lif format
// ============================================================
interface ParsedResult {
  place: number
  lane: number
  athleteName: string
  fatTime?: number
  wind?: number
  dq?: boolean
  dns?: boolean
  raw: string
}

function parseLIF(content: string): ParsedResult[] {
  const lines = content.split('\n').filter(l => l.trim())
  const results: ParsedResult[] = []

  for (const line of lines) {
    // Skip header/comment lines
    if (line.startsWith('[') || line.startsWith('#') || line.startsWith(';')) continue

    // LIF format: Place,Lane,LastName,FirstName,Team,Time,Wind,...
    // Example: 1,4,Johnson,Marcus,Jefferson HS,10.45,1.2
    const parts = line.split(',').map(p => p.trim())
    if (parts.length < 4) continue

    const place = parseInt(parts[0])
    const lane = parseInt(parts[1])
    const lastName = parts[2] || ''
    const firstName = parts[3] || ''
    const athleteName = `${firstName} ${lastName}`.trim()
    const timeStr = parts[5] || ''
    const windStr = parts[6] || ''
    const flag = (parts[7] || '').toUpperCase()

    if (isNaN(lane)) continue

    const fatTime = parseTimeToSeconds(timeStr)
    const wind = windStr ? parseFloat(windStr) : undefined

    results.push({
      place: isNaN(place) ? 0 : place,
      lane,
      athleteName,
      fatTime,
      wind,
      dq: flag === 'DQ' || flag.includes('DQ'),
      dns: flag === 'DNS',
      raw: line,
    })
  }

  return results
}

// ============================================================
// CSV PARSER — Generic results CSV
// ============================================================
function parseCSV(content: string): ParsedResult[] {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase().split(',').map(h => h.trim())
  const placeIdx = header.findIndex(h => h.includes('place') || h === 'pl')
  const laneIdx = header.findIndex(h => h.includes('lane'))
  const nameIdx = header.findIndex(h => h.includes('name') || h.includes('athlete'))
  const timeIdx = header.findIndex(h => h.includes('time') || h.includes('fat'))
  const windIdx = header.findIndex(h => h.includes('wind'))

  const results: ParsedResult[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim())
    if (parts.length < 3) continue

    const lane = laneIdx >= 0 ? parseInt(parts[laneIdx]) : i
    const place = placeIdx >= 0 ? parseInt(parts[placeIdx]) : 0
    const athleteName = nameIdx >= 0 ? parts[nameIdx] : ''
    const timeStr = timeIdx >= 0 ? parts[timeIdx] : ''
    const windStr = windIdx >= 0 ? parts[windIdx] : ''

    results.push({
      place,
      lane,
      athleteName,
      fatTime: parseTimeToSeconds(timeStr),
      wind: windStr ? parseFloat(windStr) : undefined,
      raw: lines[i],
    })
  }

  return results
}

// ============================================================
// TIME HELPERS
// ============================================================
function parseTimeToSeconds(timeStr: string): number | undefined {
  if (!timeStr || timeStr === 'NT' || timeStr === 'NM' || timeStr === '—') return undefined
  const clean = timeStr.trim()
  if (clean.includes(':')) {
    const [mins, secs] = clean.split(':')
    return parseInt(mins) * 60 + parseFloat(secs)
  }
  const n = parseFloat(clean)
  return isNaN(n) ? undefined : n
}

// ============================================================
// HEAT LOOKUP — match results to entries via Supabase
// ============================================================
async function fetchHeat(heatId?: string): Promise<any | null> {
  const url = `${TRACKMATE_URL}/api/fat-sync?meetId=${MEET_ID}${heatId ? `&heatId=${heatId}` : ''}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SERVICE_KEY}` }
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function syncResults(heatId: string, results: ParsedResult[], heat: any) {
  const startList: any[] = heat?.start_list || []

  const toSync = results.map(r => {
    // Match by lane
    const laneEntry = startList.find((l: any) => l.lane === r.lane)
    if (!laneEntry) return null
    return {
      lane: r.lane,
      entry_id: laneEntry.entry_id,
      fat_time: r.fatTime ?? null,
      wind: r.wind ?? null,
      place: r.place || null,
      dq: r.dq || false,
      dns: r.dns || false,
    }
  }).filter(Boolean)

  const res = await fetch(`${TRACKMATE_URL}/api/fat-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      meetId: MEET_ID,
      heatId,
      results: toSync,
      source: 'fat-bridge-cli',
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Sync failed')
  return data
}

// ============================================================
// FILE WATCHER
// ============================================================
const processedFiles = new Set<string>()
let currentHeatId: string | null = null

function log(level: 'info' | 'ok' | 'warn' | 'error', msg: string) {
  const ts = new Date().toLocaleTimeString()
  const prefix = {
    info: c.cyan('ℹ'),
    ok: c.green('✓'),
    warn: c.yellow('⚠'),
    error: c.red('✗'),
  }[level]
  console.log(`${c.dim(ts)} ${prefix} ${msg}`)
}

async function processFile(filePath: string) {
  if (processedFiles.has(filePath)) return

  const ext = path.extname(filePath).toLowerCase()
  if (!['.lif', '.csv', '.txt'].includes(ext)) return

  log('info', `Processing: ${c.bold(path.basename(filePath))}`)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    let results: ParsedResult[]

    if (ext === '.lif' || ext === '.txt') {
      results = parseLIF(content)
    } else {
      results = parseCSV(content)
    }

    if (results.length === 0) {
      log('warn', 'No results parsed from file')
      return
    }

    log('info', `Parsed ${results.length} results`)

    // Fetch current heat
    const heat = await fetchHeat(currentHeatId || undefined)
    if (!heat) {
      log('warn', 'No active heat found. Set heat via dashboard Timing page.')
      return
    }

    log('info', `Syncing to heat #${heat.heat_num} — ${heat.events?.name || 'Unknown event'}`)

    const synced = await syncResults(heat.id, results, heat)
    log('ok', `Synced ${synced.synced} results → ${TRACKMATE_URL}/meets/${MEET_ID}/live`)

    processedFiles.add(filePath)
  } catch (err: any) {
    log('error', `Failed to process ${path.basename(filePath)}: ${err.message}`)
  }
}

// ============================================================
// INTERACTIVE CLI
// ============================================================
function startInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log(c.dim('Commands: [h] set heat ID  [s] sync last file  [q] quit'))

  rl.on('line', async (input) => {
    const cmd = input.trim()
    if (cmd.startsWith('h ')) {
      currentHeatId = cmd.slice(2).trim()
      log('ok', `Active heat set to: ${currentHeatId}`)
    } else if (cmd === 's') {
      const files = fs.readdirSync(WATCH_DIR)
        .map(f => path.join(WATCH_DIR, f))
        .filter(f => ['.lif', '.csv'].includes(path.extname(f).toLowerCase()))
        .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime())
      if (files.length > 0) {
        processedFiles.delete(files[0])
        await processFile(files[0])
      } else {
        log('warn', 'No result files found')
      }
    } else if (cmd === 'q') {
      console.log('Goodbye!')
      process.exit(0)
    }
  })
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('')
  console.log(c.bold('  TrackMate FAT Bridge'))
  console.log(c.dim('  ─────────────────────────────'))
  console.log(`  Meet ID:   ${c.cyan(MEET_ID)}`)
  console.log(`  Watch dir: ${c.cyan(WATCH_DIR)}`)
  console.log(`  Server:    ${c.cyan(TRACKMATE_URL)}`)
  console.log(c.dim('  ─────────────────────────────'))
  console.log('')

  // Ensure watch dir exists
  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true })
    log('info', `Created watch directory: ${WATCH_DIR}`)
  }

  // Verify connection
  try {
    const heat = await fetchHeat()
    if (heat) {
      log('ok', `Connected! Next heat: ${heat.events?.name} Heat #${heat.heat_num}`)
      currentHeatId = heat.id
    } else {
      log('warn', 'No pending heats found — generate heats in the Manage tab first')
    }
  } catch {
    log('warn', 'Could not connect to TrackMate server — check TRACKMATE_URL')
  }

  // Watch for new files using fs.watch (no chokidar dependency needed)
  log('info', `Watching ${WATCH_DIR} for .lif and .csv files...`)

  fs.watch(WATCH_DIR, { recursive: false }, async (event, filename) => {
    if (!filename) return
    const filePath = path.join(WATCH_DIR, filename)
    if (event === 'rename' && fs.existsSync(filePath)) {
      // Small delay to ensure file is fully written
      await new Promise(r => setTimeout(r, 500))
      await processFile(filePath)
    }
  })

  startInteractive()
}

main().catch(err => {
  console.error(c.red('Fatal error:'), err.message)
  process.exit(1)
})
