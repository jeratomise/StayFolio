<div align="center">

# StayFolio

### The [Flighty](https://flighty.com) for your Hotel Stays.

Stop using spreadsheets. StayFolio is the ultimate companion for the elite traveler. Track your history, visualize your footprint, and optimize your status strategy.

[![Live Demo](https://img.shields.io/badge/Live-stayfolio.vercel.app-7C3AED?style=for-the-badge)](https://stayfolio.vercel.app)

![StayFolio Landing Page](docs/screenshot-landing.png)

</div>

---

## Features

- **Portfolio Tracking** — Analytics dashboard with stats, charts, financials, and traveler persona insights
- **Stay Management** — Full CRUD for hotel stays with year/month filters and nights-by-brand breakdown
- **Status Calculator** — Real-time progress tracking toward your next elite tier across 9 loyalty programs
- **Elite Status Wallet** — Auto-calculated status based on prior year activity, with manual override support
- **Travel AI** — AI-powered guest book cards and social captions via Google Gemini
- **Hotel Intel** — Weekly curated news feed from major hotel brands
- **AI Concierge** — Chat-based travel assistant

## Supported Loyalty Programs

Marriott Bonvoy · World of Hyatt · Hilton Honors · IHG One Rewards · Accor Live Limitless · GHA Discovery · Best Western Rewards · Wyndham Rewards · Radisson Rewards

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS (CDN) |
| Backend | Supabase (Auth, Database, Storage, Edge Functions) |
| AI | Google Gemini API |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Vercel |

## Getting Started

**Prerequisites:** Node.js

1. Clone the repo
   ```bash
   git clone https://github.com/jeratomise/StayFolio.git
   cd StayFolio
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables — create a `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the dev server
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## License

MIT
