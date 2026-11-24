# ASO Radar — dashboard

Web dashboard for **ASO Radar**, an App Store competitor tracker for the iGaming niche.
An n8n workflow checks competitor store pages every day, stores snapshots in Supabase,
detects changes (metadata, creatives, in-app events, IAP, developer account) and keeps copies of all images.
This app is the read/annotate side of that pipeline.

## Screens

- **Competitors** — every tracked app × storefront: status, version, days since update, days in tracking,
  last change, chart position, rating, tags; filters, sorting, pause/resume tracking, add a competitor by App Store link.
- **App page** — header with store metadata and rating histogram, lifetime counters, tags,
  a timeline of detected changes and manual marks (e.g. "top-1 by keyword" → days alive after the mark),
  before/after strips for icons, screenshots and event cards with changed positions highlighted, and the current store page.
- **Changes** — feed of all changes across competitors with filters by kind, field group and geo.

EN/RU interface, dark theme. Images are served from the project's own Supabase Storage copies when available.

## Stack

React 19 + Vite, Tailwind CSS v4, supabase-js (Auth + PostgREST), React Router. Hosted on Cloudflare Pages.
Data access is isolated in `src/lib/api.js`; `src/lib/mock.js` provides the same API with fake data for demo mode.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + publishable key
npm run dev
```

Without Supabase variables (or with `VITE_DEMO=1`) the app starts in **demo mode** with built-in fake data and no login.

## Security model

- Only the **publishable** key is used in the browser. All tables have RLS: authenticated users can read;
  writes are limited to `apps` (add / pause), `marks` and `tags`.
- Sign-ups are disabled in Supabase Auth — only pre-created users can sign in.
- The n8n workflow uses the secret key server-side; it never reaches this app.
