#!/usr/bin/env node
/**
 * Builds the runtime content files from the editable sources.
 *
 *   content/itinerary.json            ← Chinese source of truth (hand-edited)
 *   content/_parts/en-day-XX.json     ← English translation, one file per day (same structure)
 *   content/_parts/places-*.json      ← place catalog fragments
 *   content/_parts/media-*.json       ← photos / ratings / reviews keyed by place id
 *
 * Outputs:
 *   content/itinerary.en.json
 *   content/places.json
 *
 * Usage: npm run content:merge
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const C = (...p) => path.join(ROOT, "content", ...p);
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const parts = fs.existsSync(C("_parts")) ? fs.readdirSync(C("_parts")).sort() : [];

/* ---------------- English itinerary ---------------- */
const zh = readJson(C("itinerary.json"));

// One English label per Chinese tag, so every day reads the same.
const TAGS = {
  打卡: "Must-see", 拍照: "Photos", 购物: "Shopping", 甜品: "Dessert", 晚餐: "Dinner", 午餐: "Lunch",
  刺激: "Thrill", 亲子: "Family",
};

const en = {
  title: "Guang Zhou",
  subtitle: "Dec 21, 2026 – Jan 5, 2027 · 16 days",
  groups: { a: "Option A", k: "Option B" },
  stays: [
    { area: "Liwan", range: "Dec 21–23", hotel: "Atour Hotel, Liwan (branch to be confirmed)", address: "Branch to be confirmed — see the booking confirmation" },
    { area: "Panyu", range: "Dec 24–26", hotel: "Chimelong Panda Hotel", address: "Chimelong Tourist Resort, Panyu Avenue, Panyu District, Guangzhou" },
    { area: "Tianhe", range: "Dec 27 – Jan 5", hotel: "From·K Hotel (Tiyu Xilu Station)", address: "81 Huangpu Avenue West, Tianhe District, Guangzhou" },
  ],
  days: zh.days.map((zd, i) => {
    const f = `en-day-${String(i).padStart(2, "0")}.json`;
    if (!parts.includes(f)) { console.warn(`! missing ${f} — Chinese text will be shown`); return zd; }
    const ed = readJson(C("_parts", f));
    // Tags are filled in from the Chinese source, so English parts never need to list them.
    const fixTags = (zItems = [], eItems = []) => eItems.forEach((it, k) => {
      const zi = zItems[k];
      if (zi?.tags) it.tags = zi.tags.map((t, n) => TAGS[t] ?? it.tags?.[n] ?? t);
      (it.route ?? []).forEach((s, j) => {
        const zs = zi?.route?.[j];
        if (zs?.tags) s.tags = zs.tags.map((t, n) => TAGS[t] ?? s.tags?.[n] ?? t);
      });
    });
    fixTags(zd.items, ed.items);
    if (zd.backup && ed.backup) fixTags(zd.backup.items, ed.backup.items);
    if (ed.items.length !== zd.items.length) console.warn(`! ${f}: item count differs from source`);
    return ed;
  }),
};
fs.writeFileSync(C("itinerary.en.json"), JSON.stringify(en, null, 2) + "\n");

/* ---------------- Places ---------------- */
// Ids that different fragments used for the same place.
const SAME_AS = { "k-hotel": "from-k-hotel-tiyuxi" };
const places = new Map();
for (const f of parts.filter((f) => /^places-.*\.json$/.test(f))) {
  for (const p of readJson(C("_parts", f))) {
    const id = SAME_AS[p.id] ?? p.id;
    const prev = places.get(id);
    if (prev) prev.aliases = [...new Set([...prev.aliases, ...(p.aliases ?? [])])];
    else places.set(id, { ...p, id, aliases: [...new Set(p.aliases ?? [])] });
  }
}
for (const f of parts.filter((f) => /^media-.*\.json$/.test(f))) {
  for (const [rawId, m] of Object.entries(readJson(C("_parts", f)))) {
    const p = places.get(SAME_AS[rawId] ?? rawId);
    if (!p) { console.warn(`! media for unknown place ${rawId} (${f})`); continue; }
    for (const [k, v] of Object.entries(m)) if (v != null && v !== "" && !(Array.isArray(v) && !v.length)) p[k] = v;
  }
}
// Places whose Google data came from a parent listing (whole park / temple / hotel):
// the photo is kept, but the parent's rating and reviews would mislead, so they are dropped.
const BORROWED_RATING = new Set([
  "chimelong-dive-coaster", "chimelong-food-town", "chimelong-rocket-coaster", "chimelong-super-pendulum",
  "canton-tower-bubble-tram", "wanfu-stage-cantonese-opera", "foshan-lion-dance-show", "panda-hotel-restaurant",
  "guangzhou-marriott-tianhe-chinese-restaurant", "fengyuan-street-xiguan-mansions",
  "chimelong-drone-show", "fashion-tianhe", "mall-of-the-world", "shawan-anning-square-night-market",
]);
const MIN_REVIEWS_FOR_RATING = 5;
for (const p of places.values()) {
  // Drop image paths that do not exist on disk.
  if (p.image && p.image.startsWith("/") && !fs.existsSync(path.join(ROOT, "public", p.image))) delete p.image;
  if (p.image && fs.existsSync(path.join(ROOT, "public/places/thumb", path.basename(p.image)))) p.thumb = `/places/thumb/${path.basename(p.image)}`;
  if (BORROWED_RATING.has(p.id)) { delete p.rating; delete p.reviewCount; delete p.reviews; }
  if (p.reviewCount != null && p.reviewCount < MIN_REVIEWS_FOR_RATING) { delete p.rating; delete p.reviewCount; }
}
const list = [...places.values()].sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(C("places.json"), JSON.stringify(list, null, 2) + "\n");

/* ---------------- Report ---------------- */
const norm = (s) => s.replace(/^(早餐|午餐|晚餐|早午茶|下午茶|跨年晚餐)[：:]\s*/, "").trim();
const known = new Set(list.flatMap((p) => [...p.aliases, p.name.zh]).flatMap((a) => [a, norm(a)]));
const unmatched = new Set();
const scan = (items = []) => items.forEach((it) => {
  if (!/→/.test(it.title) && !known.has(it.title) && !known.has(norm(it.title))) unmatched.add(`item  ${it.title}`);
  (it.food ?? []).filter((f) => !f.dish && !known.has(f.name)).forEach((f) => unmatched.add(`food  ${f.name}`));
  (it.route ?? []).forEach((s) => {
    if (!known.has(s.title)) unmatched.add(`stop  ${s.title}`);
    (s.food ?? []).filter((f) => !f.dish && !known.has(f.name)).forEach((f) => unmatched.add(`food  ${f.name}`));
  });
});
zh.days.forEach((d) => { scan(d.items); scan(d.backup?.items); });

const withImg = list.filter((p) => p.image).length;
console.log(`✓ itinerary.en.json (${en.days.length} days)`);
console.log(`✓ places.json (${list.length} places, ${withImg} with photos, ${list.filter((p) => p.reviews?.length).length} with reviews)`);
if (process.argv.includes("--unmatched")) console.log(`\nNot linked to a place (${unmatched.size}):\n` + [...unmatched].join("\n"));
