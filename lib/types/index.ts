export type OrgType = 'school' | 'club' | 'college' | 'elite'
export type MeetType = 'hs' | 'ncaa' | 'club' | 'elite'
export type GenderType = 'm' | 'f' | 'mixed'
export type EntryStatus = 'pending' | 'confirmed' | 'scratched'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Org {
  id: string
  name: string
  type: OrgType
  tfrrs_org_id?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  org_id?: string
  name: string
  email: string
  avatar?: string
  role: string
  created_at: string
  orgs?: Org
}

export interface Ruleset {
  id: string
  meet_type: MeetType
  name: string
  scoring_top_n: number
  fat_required: boolean
  wind_limit: number
  created_at: string
}

export interface Meet {
  id: string
  org_id: string
  name: string
  date: string
  end_date?: string
  venue?: string
  venue_address?: string
  meet_type: MeetType
  ruleset_id?: string
  public: boolean
  registration_open: boolean
  registration_deadline?: string
  entry_fee_per_athlete: number
  entry_fee_per_team: number
  max_athletes_per_event: number
  notes?: string
  status: string
  created_at: string
  updated_at: string
  orgs?: Org
  rulesets?: Ruleset
}

export interface Event {
  id: string
  meet_id: string
  name: string
  gender: GenderType
  distance?: number
  is_field: boolean
  is_relay: boolean
  max_lanes: number
  round: string
  scheduled_time?: string
  sort_order: number
  created_at: string
}

export interface Team {
  id: string
  meet_id: string
  org_id?: string
  name: string
  coach_id?: string
  abbrev?: string
  color?: string
  created_at: string
  orgs?: Org
}

export interface Athlete {
  id: string
  org_id?: string
  name: string
  grade?: string
  bib?: string
  gender?: GenderType
  tfrrs_id?: string
  prs: Record<string, number>
  dob?: string
  created_at: string
  orgs?: Org
}

export interface Entry {
  id: string
  meet_id: string
  athlete_id: string
  team_id?: string
  event_id: string
  seed_time?: number
  seed_mark?: string
  status: EntryStatus
  checked_in: boolean
  created_at: string
  athletes?: Athlete
  teams?: Team
  events?: Event
}

export interface HeatLane {
  lane: number
  entry_id: string
  athlete_id: string
  athlete_name: string
  team_name?: string
  seed_time?: number
}

export interface Heat {
  id: string
  event_id: string
  heat_num: number
  round: string
  lanes: number
  start_list: HeatLane[]
  scheduled_time?: string
  status: string
  created_at: string
  events?: Event
}

export interface Result {
  id: string
  entry_id: string
  heat_id?: string
  place?: number
  fat_time?: number
  hand_time?: number
  wind?: number
  mark?: string
  dq: boolean
  dq_reason?: string
  dns: boolean
  dnf: boolean
  points?: number
  reaction_time?: number
  splits?: number[]
  created_at: string
  entries?: Entry & { athletes?: Athlete; teams?: Team; events?: Event }
}

export interface Payment {
  id: string
  meet_id: string
  team_id?: string
  org_id?: string
  amount: number
  stripe_id?: string
  stripe_session_id?: string
  status: PaymentStatus
  metadata?: Record<string, unknown>
  created_at: string
}

export interface StandardEvent {
  id: string
  name: string
  distance?: number
  is_field: boolean
  is_relay: boolean
  gender: GenderType
  meet_types: MeetType[]
}

export const MEET_TYPE_LABELS: Record<MeetType, string> = {
  hs: 'High School (NFHS)',
  ncaa: 'NCAA / College',
  club: 'Club / AAU',
  elite: 'Elite / Open',
}

export const GENDER_LABELS: Record<GenderType, string> = {
  m: "Men's",
  f: "Women's",
  mixed: 'Mixed',
}

export function formatTime(seconds?: number | null): string {
  if (!seconds && seconds !== 0) return '--'
  if (seconds < 60) return seconds.toFixed(2)
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${mins}:${secs}`
}

export function parseTime(timeStr: string): number | null {
  if (!timeStr) return null
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':')
    return parseInt(mins) * 60 + parseFloat(secs)
  }
  const n = parseFloat(timeStr)
  return isNaN(n) ? null : n
}
