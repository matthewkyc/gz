---
name: update-itinerary
description: Change the trip itinerary (times, activities, restaurants, places, translations, photos) for the GZ trip site. Use whenever the user asks to add, move, remove or reword anything in the itinerary or a place drawer.
---

# Updating the itinerary

1. **Edit the Chinese source** `content/itinerary.json` (the only hand-edited itinerary file).
2. **Mirror the change in English** in `content/_parts/en-day-XX.json` (XX = zero-padded day index, 00 = Dec 21). Structure must match the Chinese day exactly: same keys, same array lengths and order, same times / `group` / `optional` / `dish` values. English style: precise, short, passive voice where natural; place names as `English (中文)`.
3. **New place?** Add it to a `content/_parts/places-*.json` fragment (shape: see `lib/types.ts` → `Place`). Put the exact Chinese title / food name in `aliases` so the row links to it. Write `why` to persuade with concrete specifics; never invent facts.
4. **Photo / reviews?** Use Claude in Chrome on Google Maps (`https://www.google.com/maps/search/?api=1&hl=en&query=…`), save the photo to `public/places/<id>.jpg`, and add `{image, rating, reviewCount, reviews, lat, lng}` under the id in a `content/_parts/media-*.json` file. Quote reviews verbatim (trimmed); never fabricate.
5. Run `npm run content:merge -- --unmatched` and check the new rows are linked.
6. Run `npm run typecheck && npm run lint`, then view the day at `http://localhost:6700/#YYYY-MM-DD` at 390px width in both EN and 中文.
