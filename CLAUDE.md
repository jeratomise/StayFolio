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

All data lives in **localStorage** — no backend, no database. Two storage keys:
- `stayfolio_data` — array of `Stay` objects (hotel stays)
- `stayfolio_status_overrides` — manual elite status overrides per program

`services/storage.ts` handles CRUD, import/export, and data migration from older formats (e.g., `date` → `checkInDate`/`checkOutDate`, thumbs up/down → star ratings).

### Views (tabs in bottom nav)

The app has four view modes controlled by `ViewMode` type in `types.ts`:

| ViewMode | Tab Label | Component | Purpose |
|-----------|-----------|-----------|---------|
| `portfolio` | Portfolio | `BrandPortfolio` | Analytics dashboard — stats, charts (recharts), financials, persona commentary |
| `dashboard` | Manage | Inline in `App.tsx` | CRUD stays list with year/month filters, status tracker cards, nights-by-brand chart |
| `status` | Status | `EliteStatusView` | Elite status wallet — auto-calculated from prior year activity, manual overrides |
| `share` | Share | `ShareView` | Guest book card for social sharing, AI caption generation via Gemini |

### Key Domain Concepts

- **Stay** (`types.ts`) — core entity: hotel name, brand (loyalty program), country, check-in/out dates, cost, rating
- **Elite Programs** (`constants.ts`) — defines 8 hotel loyalty programs (Marriott, Hyatt, Hilton, IHG, Accor, Wyndham, Radisson, Best Western) with tier requirements (nights, stays, spend)
- **Status Tracker** (in `App.tsx`) — calculates progress toward next elite tier for current year
- **Elite Status View** — determines earned status based on **previous year's** activity; supports manual overrides stored separately

### External Services

- **Logo.dev API** — brand logos via `https://img.logo.dev/{domain}?token={token}` (token in `constants.ts`)
- **Google Gemini API** (`services/ai.ts`) — generates social captions (`gemini-3-flash-preview`) and travel images (`gemini-2.5-flash-image`)
- **Recharts** — bar charts in Portfolio and Manage views
- **Lucide React** — icon library

### Path Alias

`@/` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`).

## Import Map

`index.html` contains an import map pointing dependencies to `esm.sh` CDN URLs. These are separate from the npm dependencies in `package.json` — the import map is used when the app runs outside Vite's bundling (e.g., direct browser loading).
