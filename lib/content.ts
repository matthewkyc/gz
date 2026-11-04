import "server-only";
import fs from "node:fs";
import path from "node:path";
import { isoFromZh } from "./dates";
import type {
  Day, Food, GuideSection, Item, Places, Place, RawDay, RawFood, RawItem, RawStop, RawTrip, Stop, T, Trip,
} from "./types";

const DIR = path.join(process.cwd(), "content");
const read = <X,>(f: string): X | null => {
  const p = path.join(DIR, f);
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as X) : null;
};

/** Hotel place ids per stay, used as the "previous location" for a day's first stop. */
const STAY_HOTELS = ["atour-liwan", "chimelong-panda-hotel", "from-k-hotel-tiyuxi"];

const pair = (zh?: string, en?: string): T | undefined =>
  zh ? { zh, en: en?.trim() ? en : zh } : undefined;
const req = (zh: string, en?: string): T => pair(zh, en)!;

/** Strip meal prefixes so "午餐：陶陶居（第十甫路）" can also match an alias "陶陶居（第十甫路）". */
const normalise = (s: string) => s.replace(/^(早餐|午餐|晚餐|早午茶|下午茶|跨年晚餐)[：:]\s*/, "").trim();

function aliasIndex(places: Places) {
  const idx = new Map<string, string>();
  for (const p of Object.values(places)) {
    for (const a of [...p.aliases, p.name.zh]) {
      idx.set(a, p.id);
      idx.set(normalise(a), p.id);
    }
  }
  return (zh: string) => idx.get(zh) ?? idx.get(normalise(zh));
}

export function loadContent(): { trip: Trip; places: Places; guides: GuideSection[] } {
  const zh = read<RawTrip>("itinerary.json");
  if (!zh) throw new Error("content/itinerary.json missing");
  const en = read<RawTrip>("itinerary.en.json");
  const placeList = read<Place[]>("places.json") ?? [];
  const places: Places = Object.fromEntries(placeList.map((p) => [p.id, p]));
  const find = aliasIndex(places);

  const food = (z: RawFood, e?: RawFood): Food => ({
    name: req(z.name, e?.name), desc: pair(z.desc, e?.desc), dish: !!z.dish,
    placeId: z.dish ? undefined : find(z.name),
  });
  const foods = (z?: RawFood[], e?: RawFood[]) => (z ?? []).map((f, i) => food(f, e?.[i]));
  const stop = (z: RawStop, e?: RawStop): Stop => ({
    time: z.time, title: req(z.title, e?.title), walk: pair(z.walk, e?.walk), desc: pair(z.desc, e?.desc),
    tags: (z.tags ?? []).map((t, i) => req(t, e?.tags?.[i])), tip: pair(z.tip, e?.tip),
    food: foods(z.food, e?.food), placeId: find(z.title),
    pick: pair(z.pick, e?.pick), drop: pair(z.drop, e?.drop), optional: !!z.optional,
    section: pair(z.section, e?.section),
  });
  const item = (z: RawItem, e?: RawItem): Item => ({
    start: z.start, end: z.end, title: req(z.title, e?.title), note: pair(z.note, e?.note),
    optional: !!z.optional, group: z.group, food: foods(z.food, e?.food),
    route: (z.route ?? []).map((s, i) => stop(s, e?.route?.[i])), tip: pair(z.tip, e?.tip),
    tags: (z.tags ?? []).map((t, i) => req(t, e?.tags?.[i])), placeId: find(z.title),
  });
  /** Sort by start time while keeping the en/zh pairs aligned. */
  const items = (z: RawItem[], e?: RawItem[]) =>
    z.map((it, i) => item(it, e?.[i])).map((it, i) => ({ it, i }))
      .sort((a, b) => a.it.start.localeCompare(b.it.start) || a.i - b.i).map((x) => x.it);

  const days: Day[] = zh.days.map((zd: RawDay, index) => {
    const ed = en?.days[index];
    const list = items(zd.items, ed?.items);
    const { prev, how } = sequence(list, places[STAY_HOTELS[zd.stay]] ? STAY_HOTELS[zd.stay] : undefined);
    return {
      index, iso: isoFromZh(zd.date), stay: zd.stay, locked: !!zd.locked,
      theme: req(zd.theme, ed?.theme), intro: pair(zd.intro, ed?.intro), away: pair(zd.away, ed?.away), notice: pair(zd.notice, ed?.notice),
      backup: zd.backup && {
        title: req(zd.backup.title, ed?.backup?.title), note: pair(zd.backup.note, ed?.backup?.note),
        items: items(zd.backup.items, ed?.backup?.items),
      },
      items: list, prev, how,
    };
  });

  const trip: Trip = {
    title: req(zh.title, en?.title), subtitle: req(zh.subtitle, en?.subtitle),
    groups: { a: req(zh.groups.a, en?.groups?.a), k: req(zh.groups.k, en?.groups?.k) },
    stays: zh.stays.map((s, i) => ({
      area: req(s.area, en?.stays?.[i]?.area), range: req(s.range, en?.stays?.[i]?.range),
      hotel: pair(s.hotel, en?.stays?.[i]?.hotel), address: pair(s.address, en?.stays?.[i]?.address), phone: s.phone,
      hotelId: places[STAY_HOTELS[i]] ? STAY_HOTELS[i] : undefined,
    })),
    days,
  };
  const guides = read<{ sections: GuideSection[] }>("guides.json")?.sections ?? [];
  return { trip, places, guides };
}

/** Walk the day in order to find, for each place, where you arrive from and the itinerary's travel note. */
function sequence(items: Item[], hotel?: string) {
  const prev: Record<string, string> = {};
  const how: Record<string, T> = {};
  let last = hotel;
  let pendingHow: T | undefined;
  const visit = (id: string | undefined, note?: T) => {
    if (!id) return;
    if (last && last !== id && !prev[id]) prev[id] = last;
    if (note && !how[id]) how[id] = note;
    last = id;
  };
  for (const it of items) {
    if (/→/.test(it.title.zh)) { pendingHow = it.note; continue; }
    const before = last;
    visit(it.placeId, pendingHow ?? it.note);
    pendingHow = undefined;
    for (const f of it.food) if (f.placeId && before && !prev[f.placeId]) { prev[f.placeId] = before; if (it.note) how[f.placeId] ??= it.note; }
    for (const s of it.route) {
      const beforeStop = last;
      visit(s.placeId, s.walk);
      for (const f of s.food) if (f.placeId && beforeStop && !prev[f.placeId]) { prev[f.placeId] = beforeStop; if (s.walk) how[f.placeId] ??= s.walk; }
    }
  }
  return { prev, how };
}
