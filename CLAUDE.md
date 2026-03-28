# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
```

No test framework is configured. No linter is configured.

## Environment Variables

The app uses a Gemini API key for AI caption/image generation in the Share view:
- Set `GEMINI_API_KEY` in a `.env` file at the project root
- Vite injects it as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`)

## Architecture

Single-page React 19 + TypeScript app built with Vite. Styled with Tailwind CSS loaded via CDN (`<script src="https://cdn.tailwindcss.com">` in `index.html`). No CSS modules or PostCSS pipeline.

### Data Layer

**Backend: Supabase** — the app uses Supabase for auth, data storage, and edge functions. The Supabase client is configured in `services/supabase.ts`.

**Supabase tables:**
- `stays` — hotel stay records (snake_case columns: `user_id`, `hotel_name`, `check_in_date`, etc.)
- `user_subscriptions` — user registry and subscription status (`free` / `pro`)
- `app_config` — key-value config (e.g., `stripe_enabled` toggle)
- `hotel_news` — cached hotel news articles fetched by an edge function

**Column naming convention:** Supabase uses `snake_case` (e.g., `check_in_date`), TypeScript uses `camelCase` (e.g., `checkInDate`). All mapping between the two happens in `services/storage.ts` — every Supabase read maps `snake_case → camelCase`, every write maps `camelCase → snake_case`.

**Auth:** Supabase Auth with email/password. The `Auth` component handles login/signup. All data queries are scoped to the authenticated user via `supabase.auth.getUser()`.

**Admin access:** Hard-coded to `jeratomise@gmail.com` in `services/storage.ts`. Admin can view all users and manage subscriptions.

**Local storage** is only used for:
- `stayfolio_status_overrides` — manual elite status overrides per program (not synced to Supabase)

### Views (tabs in bottom nav)

The app has seven view modes controlled by `ViewMode` type in `types.ts`:

| ViewMode | Component | Purpose |
|-----------|-----------|---------|
| `portfolio` | `BrandPortfolio` | Analytics dashboard — stats, charts (recharts), financials, persona commentary |
| `dashboard` | Inline in `App.tsx` | CRUD stays list with year/month filters, status tracker cards, nights-by-brand chart |
| `status` | `EliteStatusView` | Elite status wallet — auto-calculated from prior year activity, manual overrides |
| `share` | `ShareView` | Guest book card for social sharing, AI caption generation via Gemini |
| `profile` | `ProfileView` | User profile with avatar upload (Supabase storage bucket: `avatars`) |
| `admin_users` | `AdminUserList` | SuperAdmin user management (subscription status, user list) |
| `concierge` | `ConciergeView` | AI concierge chat interface |

### Key Domain Concepts

- **Stay** (`types.ts`) — core entity: hotel name, brand (loyalty program), country, check-in/out dates, cost, rating
- **Elite Programs** (`constants.ts`) — defines hotel loyalty programs (Marriott, Hyatt, Hilton, IHG, Accor, GHA Discovery, Best Western, Wyndham, Radisson) with tier requirements (nights, stays, spend)
- **Status Tracker** (in `App.tsx`) — calculates progress toward next elite tier for current year
- **Elite Status View** — determines earned status based on **previous year's** activity; supports manual overrides stored in localStorage
- **Subscription** — `free` or `pro` status per user, managed via `user_subscriptions` table

### External Services

- **Supabase** (`services/supabase.ts`) — auth, database, storage (avatars bucket), edge functions (hotel news)
- **Logo.dev API** — brand logos via `https://img.logo.dev/{domain}?token={token}` (token in `constants.ts`)
- **Google Gemini API** (`services/ai.ts`) — generates social captions and travel images
- **Recharts** — bar charts in Portfolio and Manage views
- **Lucide React** — icon library

### Path Alias

`@/` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`).

## Import Map

`index.html` contains an import map pointing dependencies to `esm.sh` CDN URLs. These are separate from the npm dependencies in `package.json` — the import map is used when the app runs outside Vite's bundling (e.g., direct browser loading).
