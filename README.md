# FitOrFat 💪

A group gym tracking PWA to help you and your friends stay accountable together.

## Features

- 📅 **Calendar View** - See everyone's gym days at a glance
- 🔥 **Streaks** - Track consecutive gym days
- 🎯 **Weekly Goals** - 4x per week target
- 📊 **Comparison Charts** - 7d / 30d / 90d / 1yr views
- 🏆 **Leaderboard** - Friendly competition
- 👥 **Group Codes** - Easy join with 6-character codes
- 📱 **PWA** - Install on your phone like a native app

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and anon key from Settings > API

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## PWA Icons

Generate PWA icons from the favicon:
1. Use [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload `public/favicon.svg`
3. Download and extract to `public/`

Or use the simple fallback SVG for all sizes.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (database + realtime)
- Recharts (charts)
- date-fns (date handling)
- vite-plugin-pwa

## License

MIT
