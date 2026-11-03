# Guangzhou Winter Trip

Bilingual (EN / 中文) family itinerary site · Dec 21 2026 – Jan 5 2027.

```bash
npm install
npm run dev          # http://localhost:6700
```

- Swipe left/right (iPhone) or use the hover arrows / ← → keys (desktop) to change day.
- Tap any place to open its drawer: photo, why it is worth going, Google reviews, and directions from the previous stop (Amap / Google / Apple Maps).
- 🌐 button (top right) switches language.

## Editing content
See `CLAUDE.md` → *Content model*. In short: edit `content/itinerary.json` (+ the matching `content/_parts/en-day-XX.json`), then `npm run content:merge`.

## Deploy
Push to GitHub and import the repo in Vercel (framework preset: Next.js). No environment variables are needed.
