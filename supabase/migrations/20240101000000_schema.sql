-- TrackMate Complete Schema
-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type org_type as enum ('school', 'club', 'college', 'elite');
create type meet_type as enum ('hs', 'ncaa', 'club', 'elite');
create type gender_type as enum ('m', 'f', 'mixed');
create type entry_status as enum ('pending', 'confirmed', 'scratched');
create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');

-- ============================================================
-- ORGS
-- ============================================================
create table orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type org_type not null default 'school',
  tfrrs_org_id text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references orgs(id) on delete set null,
  name text not null,
  email text not null,
  avatar text,
  role text default 'coach',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RULESETS
-- ============================================================
create table rulesets (
  id uuid primary key default uuid_generate_v4(),
  meet_type meet_type not null,
  name text not null,
  scoring_top_n integer default 8,
  fat_required boolean default false,
  wind_limit numeric(4,2) default 2.0,
  min_hurdle_height numeric(5,2),
  stagger_required boolean default true,
  created_at timestamptz default now()
);

-- Default rulesets
insert into rulesets (meet_type, name, scoring_top_n, fat_required, wind_limit) values
  ('hs', 'NFHS Standard', 8, false, 2.0),
  ('ncaa', 'NCAA Division I', 8, true, 2.0),
  ('club', 'AAU Standard', 6, false, 2.0),
  ('elite', 'World Athletics', 8, true, 2.0);

-- ============================================================
-- MEETS
-- ============================================================
create table meets (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  date date not null,
  end_date date,
  venue text,
  venue_address text,
  meet_type meet_type not null default 'hs',
  ruleset_id uuid references rulesets(id),
  public boolean default true,
  registration_open boolean default true,
  registration_deadline timestamptz,
  entry_fee_per_athlete numeric(10,2) default 0,
  entry_fee_per_team numeric(10,2) default 0,
  max_athletes_per_event integer default 3,
  notes text,
  status text default 'upcoming',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EVENTS (within a meet)
-- ============================================================
create table events (
  id uuid primary key default uuid_generate_v4(),
  meet_id uuid not null references meets(id) on delete cascade,
  name text not null,
  gender gender_type not null default 'mixed',
  distance numeric(8,2),
  is_field boolean default false,
  is_relay boolean default false,
  max_lanes integer default 8,
  round text default 'final',
  scheduled_time timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- TEAMS
-- ============================================================
create table teams (
  id uuid primary key default uuid_generate_v4(),
  meet_id uuid not null references meets(id) on delete cascade,
  org_id uuid references orgs(id),
  name text not null,
  coach_id uuid references profiles(id),
  abbrev text,
  color text,
  created_at timestamptz default now()
);

-- ============================================================
-- ATHLETES
-- ============================================================
create table athletes (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references orgs(id) on delete cascade,
  name text not null,
  grade text,
  bib text,
  gender gender_type,
  tfrrs_id text,
  prs jsonb default '{}',
  dob date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ENTRIES
-- ============================================================
create table entries (
  id uuid primary key default uuid_generate_v4(),
  meet_id uuid not null references meets(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  event_id uuid not null references events(id) on delete cascade,
  seed_time numeric(10,4),
  seed_mark text,
  status entry_status default 'pending',
  checked_in boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(meet_id, athlete_id, event_id)
);

-- ============================================================
-- HEATS
-- ============================================================
create table heats (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  heat_num integer not null,
  round text default 'final',
  lanes integer default 8,
  start_list jsonb default '[]',
  scheduled_time timestamptz,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- RESULTS
-- ============================================================
create table results (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid not null references entries(id) on delete cascade,
  heat_id uuid references heats(id) on delete set null,
  place integer,
  fat_time numeric(10,4),
  hand_time numeric(10,4),
  wind numeric(5,2),
  mark text,
  dq boolean default false,
  dq_reason text,
  dns boolean default false,
  dnf boolean default false,
  points integer,
  reaction_time numeric(6,4),
  splits jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  meet_id uuid not null references meets(id) on delete cascade,
  team_id uuid references teams(id),
  org_id uuid references orgs(id),
  amount numeric(10,2) not null,
  stripe_id text,
  stripe_session_id text,
  status payment_status default 'pending',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- STANDARD TRACK EVENTS (reference table)
-- ============================================================
create table standard_events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  distance numeric(8,2),
  is_field boolean default false,
  is_relay boolean default false,
  gender gender_type default 'mixed',
  meet_types meet_type[] default '{hs,ncaa,club,elite}'
);

insert into standard_events (name, distance, is_field, is_relay, meet_types) values
  ('100m', 100, false, false, '{hs,ncaa,club,elite}'),
  ('200m', 200, false, false, '{hs,ncaa,club,elite}'),
  ('400m', 400, false, false, '{hs,ncaa,club,elite}'),
  ('800m', 800, false, false, '{hs,ncaa,club,elite}'),
  ('1500m', 1500, false, false, '{hs,ncaa,club,elite}'),
  ('Mile', 1609.34, false, false, '{hs,club}'),
  ('3000m', 3000, false, false, '{hs,ncaa,club,elite}'),
  ('5000m', 5000, false, false, '{hs,ncaa,club,elite}'),
  ('10000m', 10000, false, false, '{ncaa,club,elite}'),
  ('110m Hurdles', 110, false, false, '{hs,ncaa,club,elite}'),
  ('100m Hurdles', 100, false, false, '{hs,ncaa,club,elite}'),
  ('400m Hurdles', 400, false, false, '{hs,ncaa,club,elite}'),
  ('3000m Steeplechase', 3000, false, false, '{hs,ncaa,club,elite}'),
  ('4x100m Relay', 400, false, true, '{hs,ncaa,club,elite}'),
  ('4x400m Relay', 1600, false, true, '{hs,ncaa,club,elite}'),
  ('4x800m Relay', 3200, false, true, '{hs,ncaa,club}'),
  ('4x1600m Relay', 6400, false, true, '{hs}'),
  ('SMR', 1200, false, true, '{hs,ncaa}'),
  ('DMR', 4800, false, true, '{hs,ncaa}'),
  ('High Jump', null, true, false, '{hs,ncaa,club,elite}'),
  ('Pole Vault', null, true, false, '{hs,ncaa,club,elite}'),
  ('Long Jump', null, true, false, '{hs,ncaa,club,elite}'),
  ('Triple Jump', null, true, false, '{hs,ncaa,club,elite}'),
  ('Shot Put', null, true, false, '{hs,ncaa,club,elite}'),
  ('Discus', null, true, false, '{hs,ncaa,club,elite}'),
  ('Hammer', null, true, false, '{ncaa,club,elite}'),
  ('Javelin', null, true, false, '{hs,ncaa,club,elite}'),
  ('Heptathlon', null, false, false, '{hs,ncaa,club,elite}'),
  ('Decathlon', null, false, false, '{hs,ncaa,club,elite}'),
  ('Pentathlon', null, false, false, '{hs,ncaa}');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table results;
alter publication supabase_realtime add table heats;
alter publication supabase_realtime add table entries;
alter publication supabase_realtime add table meets;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ORGS
alter table orgs enable row level security;
create policy "Public orgs visible to all" on orgs for select using (true);
create policy "Org members can update" on orgs for update using (
  auth.uid() in (select id from profiles where org_id = orgs.id)
);
create policy "Authenticated can create orgs" on orgs for insert with check (auth.role() = 'authenticated');

-- PROFILES
alter table profiles enable row level security;
create policy "Users see own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- MEETS
alter table meets enable row level security;
create policy "Public meets visible" on meets for select using (public = true or org_id in (
  select org_id from profiles where id = auth.uid()
));
create policy "Org members create meets" on meets for insert with check (
  org_id in (select org_id from profiles where id = auth.uid())
);
create policy "Org members update meets" on meets for update using (
  org_id in (select org_id from profiles where id = auth.uid())
);

-- EVENTS
alter table events enable row level security;
create policy "Events visible via meet" on events for select using (
  meet_id in (select id from meets where public = true or org_id in (
    select org_id from profiles where id = auth.uid()
  ))
);
create policy "Org members manage events" on events for all using (
  meet_id in (select id from meets where org_id in (
    select org_id from profiles where id = auth.uid()
  ))
);

-- TEAMS
alter table teams enable row level security;
create policy "Teams visible" on teams for select using (true);
create policy "Authenticated manage teams" on teams for all using (auth.role() = 'authenticated');

-- ATHLETES
alter table athletes enable row level security;
create policy "Athletes visible" on athletes for select using (true);
create policy "Org members manage athletes" on athletes for all using (
  org_id in (select org_id from profiles where id = auth.uid()) or auth.role() = 'authenticated'
);

-- ENTRIES
alter table entries enable row level security;
create policy "Entries visible" on entries for select using (true);
create policy "Authenticated manage entries" on entries for all using (auth.role() = 'authenticated');

-- HEATS
alter table heats enable row level security;
create policy "Heats visible" on heats for select using (true);
create policy "Authenticated manage heats" on heats for all using (auth.role() = 'authenticated');

-- RESULTS
alter table results enable row level security;
create policy "Results visible" on results for select using (true);
create policy "Authenticated manage results" on results for all using (auth.role() = 'authenticated');

-- PAYMENTS
alter table payments enable row level security;
create policy "Payments visible to org" on payments for select using (
  org_id in (select org_id from profiles where id = auth.uid()) or
  meet_id in (select id from meets where org_id in (select org_id from profiles where id = auth.uid()))
);
create policy "Authenticated create payments" on payments for insert with check (auth.role() = 'authenticated');
create policy "Service can update payments" on payments for update using (true);

-- RULESETS
alter table rulesets enable row level security;
create policy "Rulesets public read" on rulesets for select using (true);

-- STANDARD EVENTS
alter table standard_events enable row level security;
create policy "Standard events public read" on standard_events for select using (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_orgs_updated_at before update on orgs for each row execute function update_updated_at_column();
create trigger update_profiles_updated_at before update on profiles for each row execute function update_updated_at_column();
create trigger update_meets_updated_at before update on meets for each row execute function update_updated_at_column();
create trigger update_athletes_updated_at before update on athletes for each row execute function update_updated_at_column();
create trigger update_entries_updated_at before update on entries for each row execute function update_updated_at_column();
create trigger update_heats_updated_at before update on heats for each row execute function update_updated_at_column();
create trigger update_results_updated_at before update on results for each row execute function update_updated_at_column();
create trigger update_payments_updated_at before update on payments for each row execute function update_updated_at_column();

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-seed meet events based on meet_type
create or replace function seed_meet_events(p_meet_id uuid, p_meet_type meet_type)
returns void as $$
begin
  insert into events (meet_id, name, distance, is_field, is_relay, gender, sort_order)
  select 
    p_meet_id,
    name,
    distance,
    is_field,
    is_relay,
    'mixed'::gender_type,
    row_number() over ()
  from standard_events
  where p_meet_type = any(meet_types)
  order by is_relay, is_field, distance nulls last, name;
end;
$$ language plpgsql;

-- Auto-generate heats from entries
create or replace function generate_heats(p_event_id uuid, p_lanes integer default 8)
returns void as $$
declare
  v_entries record;
  v_heat_num integer := 1;
  v_lane integer := 1;
  v_start_list jsonb := '[]';
  v_entry_count integer;
begin
  -- Delete existing heats
  delete from heats where event_id = p_event_id;
  
  -- Count entries
  select count(*) into v_entry_count
  from entries where event_id = p_event_id and status != 'scratched';
  
  -- Simple heat generation by seed time
  for v_entries in (
    select e.id, e.athlete_id, a.name, e.seed_time, e.team_id
    from entries e
    join athletes a on a.id = e.athlete_id
    where e.event_id = p_event_id and e.status != 'scratched'
    order by e.seed_time asc nulls last
  ) loop
    v_start_list := v_start_list || jsonb_build_object(
      'lane', v_lane,
      'entry_id', v_entries.id,
      'athlete_id', v_entries.athlete_id,
      'athlete_name', v_entries.name,
      'seed_time', v_entries.seed_time
    );
    v_lane := v_lane + 1;
    
    if v_lane > p_lanes then
      insert into heats (event_id, heat_num, lanes, start_list)
      values (p_event_id, v_heat_num, p_lanes, v_start_list);
      v_heat_num := v_heat_num + 1;
      v_lane := 1;
      v_start_list := '[]';
    end if;
  end loop;
  
  -- Insert remaining
  if jsonb_array_length(v_start_list) > 0 then
    insert into heats (event_id, heat_num, lanes, start_list)
    values (p_event_id, v_heat_num, p_lanes, v_start_list);
  end if;
end;
$$ language plpgsql;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed orgs
insert into orgs (id, name, type, tfrrs_org_id) values
  ('11111111-1111-1111-1111-111111111111', 'Jefferson High School', 'school', null),
  ('22222222-2222-2222-2222-222222222222', 'State University', 'college', 'tf-12345'),
  ('33333333-3333-3333-3333-333333333333', 'Bayou Track Club', 'club', null);

-- Seed meets
insert into meets (id, org_id, name, date, venue, meet_type, ruleset_id, public, registration_open, entry_fee_per_athlete) 
select
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Jefferson Invitational 2025',
  '2025-04-15',
  'Jefferson Stadium, New Orleans, LA',
  'hs',
  id,
  true,
  true,
  8.00
from rulesets where meet_type = 'hs' limit 1;

insert into meets (id, org_id, name, date, venue, meet_type, ruleset_id, public, registration_open, entry_fee_per_athlete)
select
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'State University NCAA Qualifier',
  '2025-05-02',
  'State University Track, Baton Rouge, LA',
  'ncaa',
  id,
  true,
  true,
  15.00
from rulesets where meet_type = 'ncaa' limit 1;

-- Seed events for HS meet
insert into events (meet_id, name, distance, is_field, is_relay, gender, sort_order) values
  ('44444444-4444-4444-4444-444444444444', '100m', 100, false, false, 'mixed', 1),
  ('44444444-4444-4444-4444-444444444444', '200m', 200, false, false, 'mixed', 2),
  ('44444444-4444-4444-4444-444444444444', '400m', 400, false, false, 'mixed', 3),
  ('44444444-4444-4444-4444-444444444444', '800m', 800, false, false, 'mixed', 4),
  ('44444444-4444-4444-4444-444444444444', '1600m', 1600, false, false, 'mixed', 5),
  ('44444444-4444-4444-4444-444444444444', '3200m', 3200, false, false, 'mixed', 6),
  ('44444444-4444-4444-4444-444444444444', '110m Hurdles', 110, false, false, 'm', 7),
  ('44444444-4444-4444-4444-444444444444', '100m Hurdles', 100, false, false, 'f', 8),
  ('44444444-4444-4444-4444-444444444444', '4x100m Relay', 400, false, true, 'mixed', 9),
  ('44444444-4444-4444-4444-444444444444', '4x400m Relay', 1600, false, true, 'mixed', 10),
  ('44444444-4444-4444-4444-444444444444', 'High Jump', null, true, false, 'mixed', 11),
  ('44444444-4444-4444-4444-444444444444', 'Long Jump', null, true, false, 'mixed', 12),
  ('44444444-4444-4444-4444-444444444444', 'Shot Put', null, true, false, 'mixed', 13),
  ('44444444-4444-4444-4444-444444444444', 'Discus', null, true, false, 'mixed', 14);

-- Seed events for NCAA meet
insert into events (meet_id, name, distance, is_field, is_relay, gender, sort_order) values
  ('55555555-5555-5555-5555-555555555555', '100m', 100, false, false, 'mixed', 1),
  ('55555555-5555-5555-5555-555555555555', '200m', 200, false, false, 'mixed', 2),
  ('55555555-5555-5555-5555-555555555555', '400m', 400, false, false, 'mixed', 3),
  ('55555555-5555-5555-5555-555555555555', '800m', 800, false, false, 'mixed', 4),
  ('55555555-5555-5555-5555-555555555555', '1500m', 1500, false, false, 'mixed', 5),
  ('55555555-5555-5555-5555-555555555555', '5000m', 5000, false, false, 'mixed', 6),
  ('55555555-5555-5555-5555-555555555555', '10000m', 10000, false, false, 'mixed', 7),
  ('55555555-5555-5555-5555-555555555555', '110m Hurdles', 110, false, false, 'm', 8),
  ('55555555-5555-5555-5555-555555555555', '100m Hurdles', 100, false, false, 'f', 9),
  ('55555555-5555-5555-5555-555555555555', '400m Hurdles', 400, false, false, 'mixed', 10),
  ('55555555-5555-5555-5555-555555555555', '3000m Steeplechase', 3000, false, false, 'mixed', 11),
  ('55555555-5555-5555-5555-555555555555', '4x100m Relay', 400, false, true, 'mixed', 12),
  ('55555555-5555-5555-5555-555555555555', '4x400m Relay', 1600, false, true, 'mixed', 13),
  ('55555555-5555-5555-5555-555555555555', 'High Jump', null, true, false, 'mixed', 14),
  ('55555555-5555-5555-5555-555555555555', 'Pole Vault', null, true, false, 'mixed', 15),
  ('55555555-5555-5555-5555-555555555555', 'Long Jump', null, true, false, 'mixed', 16),
  ('55555555-5555-5555-5555-555555555555', 'Triple Jump', null, true, false, 'mixed', 17),
  ('55555555-5555-5555-5555-555555555555', 'Shot Put', null, true, false, 'mixed', 18),
  ('55555555-5555-5555-5555-555555555555', 'Discus', null, true, false, 'mixed', 19),
  ('55555555-5555-5555-5555-555555555555', 'Hammer', null, true, false, 'mixed', 20),
  ('55555555-5555-5555-5555-555555555555', 'Javelin', null, true, false, 'mixed', 21);

-- Seed sample athletes
insert into athletes (id, org_id, name, grade, gender, prs) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Marcus Johnson', '12', 'm', '{"100m": 10.45, "200m": 21.3}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Destiny Williams', '11', 'f', '{"100m": 11.82, "200m": 24.1}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Jordan Smith', '10', 'm', '{"400m": 49.8, "800m": 1.58}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Alex Rivera', null, 'm', '{"100m": 10.12, "200m": 20.45}'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Taylor Brooks', null, 'f', '{"800m": 2.05, "1500m": 4.18}');
