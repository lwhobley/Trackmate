# TrackMate 🏃

**The complete Track & Field meet management SaaS platform.**

Multi-tenant support for High School (NFHS), NCAA/TFRRS, Club/AAU, and Elite meets — with FinishLynx FAT bridge, real-time scoreboards, Stripe payments, and automated exports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS, custom design system |
| Database | Supabase (Postgres + Realtime + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe Checkout |
| Email | Resend |
| Deploy | Vercel |
| FAT Bridge | Node.js CLI (`trackmeet-bridge`) |

---

## Quick Deploy

### 1. Clone & Install

```bash
git clone https://github.com/lwhobley/TrackMate.git
cd TrackMate
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full migration:
   ```
   supabase/migrations/20240101000000_schema.sql
   ```
3. This creates all tables, RLS policies, triggers, and seeds sample data.
4. Enable **Realtime** for: `results`, `heats`, `entries`, `meets`
   - Dashboard → Database → Replication → toggle those tables

### 3. Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get your keys from Dashboard → Developers → API Keys
3. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`
4. Copy the webhook secret

### 4. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email (optional)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard and it will auto-deploy.

Add all environment variables in Vercel → Project → Settings → Environment Variables.

---

## Local Development

```bash
npm run dev
# Open http://localhost:3000
```

---

## Feature Guide

### Creating a Meet

1. Sign up / sign in
2. Dashboard → **+ New Meet**
3. Select meet type (HS, NCAA, Club, Elite)
4. Events auto-load based on type (e.g. NCAA gets Hammer, Steeplechase; HS gets Mile, etc.)
5. Set entry fees, registration deadline

### Team Registration + Stripe

1. Coaches visit `/meets/[id]/register/team`
2. Create team → select athletes → pick events (PRs auto-populate seed times)
3. Submit → Stripe Checkout for entry fees
4. Webhook confirms payment → entries marked `confirmed`

### Seeding Heats

1. Manage → **Seeding & Heats** tab
2. Select an event → **Auto-Generate Heats**
3. Athletes sorted by seed time, assigned to lanes
4. Export LIF start list for FinishLynx

### FAT Bridge (FinishLynx Integration)

```bash
cd fat-bridge
npm install
npm run build

# Run the bridge
node dist/index.js \
  --url https://your-project.supabase.co \
  --key YOUR_SERVICE_ROLE_KEY \
  --meet YOUR_MEET_ID \
  --dir /path/to/FinishLynx/Results \
  --trackmate-url https://your-domain.com
```

The bridge:
- Watches your FinishLynx Results folder for `.lif` and `.csv` files
- Parses athlete times, lanes, places, wind
- POSTs to `/api/fat-sync` which upserts results to Supabase
- Results appear instantly on `/meets/[id]/live` via Realtime

**Interactive commands while running:**
- `h [heat-id]` — set the active heat ID
- `s` — re-sync the last file
- `q` — quit

### Live Results & Scoreboard

- `/meets/[id]/live` — Supabase Realtime, updates instantly, team scores auto-calculated
- `/meets/[id]/scoreboard` — Fullscreen scoreboard with gold/silver/bronze medal counts, latest event results

### Exports

From Manage → Export tab or via API:

| Format | Endpoint | Use |
|---|---|---|
| Hy-Tek CSV | `GET /api/export?meetId=...&type=hytek` | Standard timing software |
| TFRRS XML | `GET /api/export?meetId=...&type=tfrrs` | NCAA submission |
| LIF | `GET /api/export?meetId=...&type=lif&heatId=...&eventId=...` | FinishLynx start list |
| CSV Start List | `GET /api/export?meetId=...&type=csv-startlist&heatId=...&eventId=...` | Generic |

---

## Database Schema

```
orgs          — Schools, clubs, colleges, elite programs
profiles      — Users (linked to org)
meets         — Meet events (HS/NCAA/club/elite)
rulesets      — Scoring rules per meet type
events        — Individual events within a meet
teams         — Team registration per meet
athletes      — Athlete roster (with PRs JSON)
entries       — Athlete ↔ event registrations
heats         — Generated heats with start lists
results       — FAT times, wind, places, DQ flags
payments      — Stripe payment records
```

All tables have Row Level Security (RLS). Org isolation is enforced at the database level.

---

## Sample Data

Two meets are pre-seeded:
- **Jefferson Invitational 2025** (`44444444-...`) — HS/NFHS, 14 events
- **State University NCAA Qualifier** (`55555555-...`) — NCAA, 21 events

Three orgs and five sample athletes are included.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/stripe-checkout` | POST | Create Stripe checkout session |
| `/api/stripe-webhook` | POST | Handle Stripe payment events |
| `/api/fat-sync` | GET | Fetch next pending heat |
| `/api/fat-sync` | POST | Sync FAT results (from bridge) |
| `/api/export` | GET | Export results (type param) |

---

## Meet Types & Rulesets

| Type | Scoring | FAT | Wind Limit | Key Differences |
|---|---|---|---|---|
| `hs` | Top 8 | Optional | 2.0 m/s | Mile instead of 1500m, no Hammer |
| `ncaa` | Top 8 | Required | 2.0 m/s | All standard events + Steeplechase |
| `club` | Top 6 | Optional | 2.0 m/s | Simplified event list |
| `elite` | Top 8 | Required | 2.0 m/s | All events, World Athletics rules |

---

## License

MIT © TrackMate
