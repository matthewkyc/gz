# GZ — Guangzhou winter trip site

Read-only, bilingual (EN default / 中文) itinerary site for a family trip, Dec 21 2026 – Jan 5 2027.
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · framer-motion · GSAP · Font Awesome. Hosted on Vercel.

## Commands
- `npm run dev` — dev server on **http://localhost:6700** (always this port)
- `npm run content:merge` — rebuild `content/itinerary.en.json` + `content/places.json` from sources (add `-- --unmatched` to list titles not linked to a place)
- `npm run typecheck` · `npm run lint` · `npm run build` — run all three before calling work done

## Content model (the only place itinerary facts live)
- `content/itinerary.json` — **Chinese source of truth**. Hand-edit this.
- `content/_parts/en-day-XX.json` — English translation per day; MUST mirror the Chinese day's structure exactly (same keys, array lengths, order, times).
- `content/_parts/places-*.json` — place catalog fragments. `aliases` = exact Chinese strings from itinerary titles / food names; that is how rows link to places.
- `content/_parts/media-*.json` — photos / rating / reviews / coords per place id (from Google Maps). Photos live in `public/places/<id>.jpg`.
- `content/itinerary.en.json`, `content/places.json` — **generated** by `npm run content:merge`; never edit by hand.
- Item fields: `start end title note optional group(a|k) food[] route[] tip`. Food: `name desc dish`. Stop: `time title walk desc tags tip food`.

## Code map
- `lib/content.ts` (server-only) merges zh + en into `{en, zh}` pairs, links places by alias, and computes each place's "previous location" + travel note for directions.
- `lib/i18n.tsx` — language context + UI strings. Every user-visible string needs `en` and `zh`.
- `components/` — `TripApp` (state, hash routing `#YYYY-MM-DD`), `Header` (sticky bar + date squares), `DayPager` (swipe/arrow nav), `DayView`, `Timeline`, `PlaceDrawer`.
- `app/globals.css` — all styles; design tokens at the top.

## Conventions
- Design: Apple-like — white/black/grey neutrals, one accent `--accent` (iPhone 17 Pro cosmic orange). Generous spacing, no extra colours. Light + dark via tokens only.
- iPhone first: test at 390px; tap targets ≥ 44px; respect `env(safe-area-inset-*)`.
- Motion: framer-motion for layout/gesture/presence, GSAP for entrance timelines. Honour `prefers-reduced-motion`.
- Icons: Font Awesome (`fa-solid`, `fa-regular`, `fa-brands`) only.
- Copy (English): precise, short, passive voice where natural. Place names as `English (中文)`.
- Never invent facts, reviews or ratings; flag uncertainty in a place's `tips`.
- Mainland China: Google Maps needs a VPN — always offer Amap (高德) too.

## Not yet built (by decision)
- Editing / writing content from the UI. Vercel's filesystem is read-only; when added, write via the GitHub Contents API (commit `content/*.json`) or Vercel Blob.

@AGENTS.md
