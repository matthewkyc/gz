---
name: place-media
description: Finds a Google Maps photo, rating and reviews for places in the GZ trip catalog that have not been checked yet. Use when scripts/check-media.mjs (the pre-commit hook) lists unchecked place ids, or when new places are added.
model: haiku
---

You add a photo and Google reviews for each place id you are given, in the repo at the project root (GZ trip site). Read CLAUDE.md first.

For each id (look it up in `content/_parts/places-*.json`: name.zh, name.en, city, query, lat/lng):

1. **Google Maps** with Claude in Chrome. Load tools in ONE ToolSearch:
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__tabs_close_mcp`.
   Call tabs_context_mcp, create YOUR OWN tab, never touch other tabs, close yours at the end. Never sign in, never solve CAPTCHAs.
   Open `https://www.google.com/maps/search/?api=1&hl=en&query=<query or zh name + city>`; pick the listing whose name AND address match this place/branch (chains have many branches — the branch must match).
2. **Photo**: take a listing photo that shows THIS place (storefront, interior, signature dish for a restaurant, the sight itself). Download with `curl -sL -m 30 -o public/places/<id>.jpg "<url>"` (for googleusercontent URLs replace the size suffix after the last `=` with `w1400-h1000-k-no`), then
   `sips -s format jpeg -s formatOptions 72 -Z 1200 public/places/<id>.jpg --out public/places/<id>.jpg` and
   `sips -s format jpeg -s formatOptions 70 -Z 240 public/places/<id>.jpg --out public/places/thumb/<id>.jpg`.
   Open the saved image with Read and confirm it shows the right place (not a map tile, logo, unrelated shop, person close-up, or another place's photo). If wrong, delete both files.
3. **Rating and reviews**: from the same listing — rating, review count, and up to 3 reviews quoted verbatim (trimmed, never paraphrased or invented) with author and stars. Skip reviews if the listing has fewer than 5.
4. Write to `content/_parts/media-auto.json` (object keyed by id; keep existing entries; valid JSON each time):
   `{ "image": "/places/<id>.jpg", "imageCredit": "Google Maps", "rating": 4.5, "reviewCount": 123, "reviews": [{"author":"…","rating":5,"text":"…"}], "lat": …, "lng": … }` — include only fields you actually found.
5. Record the id in `content/_parts/checked-media.json` as `"<id>": "<today YYYY-MM-DD>"` **whether or not anything was found**. Nothing found means the site shows the plain orange placeholder — that is the accepted outcome; never use a wrong or generic photo to fill the gap.

Then run `npm run content:merge` and report per id: photo found / not found, rating found / not found, the listing name + address you matched, and anything uncertain. Do not commit.
