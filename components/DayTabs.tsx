"use client";
import { useLang, type UIKey } from "@/lib/i18n";
import type { Day, Food, Place, Places, Stop, T } from "@/lib/types";
import { Thumb, transitIcon } from "./Timeline";

export type DayTab = "plan" | "transport" | "food" | "places";
const TABS: { key: DayTab; icon: string; label: UIKey }[] = [
  { key: "plan", icon: "fa-list-ul", label: "tabPlan" },
  { key: "transport", icon: "fa-car-side", label: "tabTransport" },
  { key: "food", icon: "fa-utensils", label: "tabFood" },
  { key: "places", icon: "fa-location-dot", label: "tabPlaces" },
];

/** Segmented control shown on away days (day trips). */
export function DayTabBar({ value, onChange }: { value: DayTab; onChange: (t: DayTab) => void }) {
  const { ui } = useLang();
  return (
    <div className="day-tabs" role="tablist" aria-label={ui("dayViews")}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          className={value === tab.key ? "on" : undefined}
          onClick={() => onChange(tab.key)}
        >
          <i className={`fa-solid ${tab.icon}`} aria-hidden />
          <span>{ui(tab.label)}</span>
        </button>
      ))}
    </div>
  );
}

interface ViewProps { day: Day; places: Places; onOpenPlace: (id: string) => void }

export function DayTabView({ tab, ...p }: ViewProps & { tab: Exclude<DayTab, "plan"> }) {
  if (tab === "transport") return <TransportView {...p} />;
  if (tab === "food") return <FoodView {...p} />;
  return <PlacesView {...p} />;
}

/* ---------------- Transport ---------------- */

const isMove = (zh: string) => /→/.test(zh);
/** First clause only: keeps "约50分钟" from "约50分钟；以买到的车次为准". */
const short = (x: string) => x.split(/[；;（(：]|: /)[0].trim();

/** Rides that are real transport (not theme-park rides). */
const PUBLIC_RIDE = /叮叮|电车|小轮|山顶缆车/;

interface Leg { time: string; icon: string; title: T; how?: T; pick?: T; optional: boolean }

/** One row per journey: the route legs of an item replace the item itself, so nothing repeats. */
function collectLegs(day: Day, places: Places): Leg[] {
  const legs: Leg[] = [];
  for (const it of day.items) {
    const stops = it.route.filter((s) => (isMove(s.title.zh) && !/→\s*包车$/.test(s.title.zh)) || PUBLIC_RIDE.test(s.title.zh));
    if (stops.length) {
      for (const s of stops) {
        const ride = !isMove(s.title.zh) || PUBLIC_RIDE.test(s.title.zh);
        legs.push({ time: s.time, icon: stopIcon(s, places), title: s.title, how: ride ? undefined : s.desc, pick: s.pick, optional: s.optional || it.optional });
      }
    } else if (isMove(it.title.zh)) {
      legs.push({ time: it.start, icon: transitIcon(it.title.zh + (it.note?.zh ?? "")), title: it.title, how: it.note, optional: it.optional });
    }
  }
  return legs.filter((l) => l.icon !== "fa-person-walking");
}

function TransportView({ day, places }: ViewProps) {
  const { t, ui } = useLang();
  const legs = collectLegs(day, places);
  if (!legs.length) return <p className="tleg-empty"><i className="fa-solid fa-circle-info" aria-hidden />{ui("noTransport")}</p>;
  return (
    <ol className="tlegs">
      {legs.map((l, i) => (
        <li key={i} className="tleg">
          <span className="tleg-time">{l.time}</span>
          <span className={`tleg-icon m-${MODE[l.icon] ?? "other"}`}><i className={`fa-solid ${l.icon}`} aria-hidden /></span>
          <span className="tleg-text">
            <b>{t(l.title)}{l.optional && <span className="badge">{ui("optional")}</span>}</b>
            {MODE[l.icon] === "taxi" && <span className="tleg-didi"><i className="fa-solid fa-mobile-screen" aria-hidden />{ui("callDidi")}</span>}
            {l.how && <span>{short(t(l.how))}</span>}
            {l.pick && <span className="tleg-pick"><i className="fa-solid fa-car-side" aria-hidden /><span><strong>{ui("pickUp")}</strong> {short(t(l.pick))}</span></span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Icon → colour class, so each kind of transport reads at a glance. */
const MODE: Record<string, string> = {
  "fa-taxi": "taxi", "fa-train": "train", "fa-train-subway": "metro", "fa-car-side": "van", "fa-shuttle-van": "van",
  "fa-van-shuttle": "van", "fa-train-tram": "tram", "fa-cable-car": "cable", "fa-ferry": "ferry", "fa-plane": "plane",
};

function stopIcon(s: Stop, places: Places) {
  if (/小轮|船/.test(s.title.zh)) return "fa-ferry";
  if (/叮叮|电车/.test(s.title.zh)) return "fa-train-tram";
  if (s.pick || s.drop) return "fa-car-side";
  if (/缆车/.test(s.title.zh)) return "fa-cable-car";
  const p = s.placeId ? places[s.placeId] : undefined;
  return p?.kind === "ride" ? "fa-ticket" : transitIcon(s.title.zh);
}

/* ---------------- Food ---------------- */

type Cat = "breakfast" | "lunch" | "dinner" | "snack" | "tea" | "coffee" | "bakery";
const CATS: { key: Cat; icon: string }[] = [
  { key: "breakfast", icon: "fa-mug-saucer" },
  { key: "lunch", icon: "fa-bowl-rice" },
  { key: "dinner", icon: "fa-utensils" },
  { key: "snack", icon: "fa-ice-cream" },
  { key: "tea", icon: "fa-glass-water" },
  { key: "coffee", icon: "fa-mug-hot" },
  { key: "bakery", icon: "fa-bread-slice" },
];
const MEAL: Record<string, Cat> = { 早餐: "breakfast", 午餐: "lunch", 晚餐: "dinner", 跨年晚餐: "dinner" };
const mealOf = (zh: string): Cat | undefined => {
  const m = zh.match(/^(早餐|午餐|晚餐|跨年晚餐)/);
  return m ? MEAL[m[1]] : undefined;
};
const RULES: [RegExp, Cat][] = [
  [/咖啡|Coffee|Starbucks|星巴克/i, "coffee"],
  [/饼家|西饼|面包|蛋挞|伦教糕|酥饼|Bakery/i, "bakery"],
  [/雞蛋仔|鸡蛋仔|双皮奶|糖水|甜品|冰淇淋|雪糕/, "snack"],
  [/冰室|茶餐厅|奶茶|柠檬茶|LINLEE|兰芳园|喜茶|茶/, "tea"],
];
function classify(name: string, desc: string, time: string): Cat {
  for (const text of [name, desc]) for (const [re, c] of RULES) if (re.test(text)) return c;
  if (time < "10:30") return "breakfast";
  if (time < "15:00") return "lunch";
  if (time >= "17:00") return "dinner";
  return "snack";
}

interface Entry { cat: Cat; time: string; name: T; desc?: T; placeId?: string; dishes: T[]; optional: boolean; where?: T }

function collectFood(day: Day, places: Places): Entry[] {
  const out: Entry[] = [];
  const isFoodPlace = (id?: string) => !id || places[id]?.kind === "food";
  /** Turn a food list into venues; each dish attaches to the venue before it. */
  const add = (food: Food[], time: string, meal: Cat | undefined, optional: boolean, where: T, head?: Entry) => {
    let cur = head;
    for (const f of food) {
      if (f.dish) {
        if (!cur) { cur = { cat: meal ?? classify(where.zh, "", time), time, name: where, dishes: [], optional }; out.push(cur); }
        cur.dishes.push(f.name);
        continue;
      }
      if (!meal && !isFoodPlace(f.placeId)) continue; // sights / shops to pass by (a meal list keeps malls)
      cur = {
        cat: meal ?? classify(f.name.zh, f.desc?.zh ?? "", time), time, name: f.name, desc: f.desc,
        placeId: f.placeId, dishes: [], optional, where,
      };
      out.push(cur);
    }
  };
  for (const it of day.items) {
    const meal = mealOf(it.title.zh);
    if (meal && it.food.length === 0) {
      out.push({ cat: meal, time: it.start, name: it.title, desc: it.note, dishes: [], optional: it.optional });
    } else if (meal || it.food.length) {
      add(it.food, it.start, meal, it.optional, it.title);
    }
    for (const s of it.route) {
      const sMeal = mealOf(s.title.zh) ?? (s.tags.some((x) => x.zh === "午餐") ? "lunch" : s.tags.some((x) => x.zh === "晚餐") ? "dinner" : undefined);
      const place = s.placeId ? places[s.placeId] : undefined;
      const venue = place?.kind === "food" || (!place && !sMeal && (s.tags.some((x) => x.zh === "甜品") || RULES.some(([re]) => re.test(s.title.zh))));
      let head: Entry | undefined;
      if (venue) {
        head = {
          cat: sMeal ?? classify(s.title.zh, s.desc?.zh ?? "", s.time), time: s.time, name: s.title, desc: s.desc,
          placeId: s.placeId, dishes: [], optional: s.optional,
        };
        out.push(head);
      }
      if (s.food.length) add(s.food, s.time, sMeal, s.optional || it.optional, s.title, head);
    }
  }
  return out;
}

function FoodView({ day, places, onOpenPlace }: ViewProps) {
  const { t, ui } = useLang();
  const entries = collectFood(day, places);
  return (
    <div className="xgroups">
      {CATS.map(({ key, icon }) => {
        const list = entries.filter((e) => e.cat === key);
        if (!list.length) return null;
        return (
          <section key={key} className="xgroup">
            <h3 className="food-label"><i className={`fa-solid ${icon}`} aria-hidden />{ui(`food_${key}` as UIKey)}</h3>
            <ul className="cards">
              {list.map((e, i) => {
                const p = e.placeId ? places[e.placeId] : undefined;
                const meta = [e.time, e.where && e.where.zh !== e.name.zh ? t(e.where) : ""].filter(Boolean).join(" · ");
                const inner = (
                  <>
                    <Thumb place={p} />
                    <span className="card-text">
                      <b>{t(e.name)}{e.optional && <span className="badge">{ui("optional")}</span>}</b>
                      <span className="xmeta">{meta}</span>
                      {e.desc && <span>{t(e.desc)}</span>}
                      {e.dishes.length > 0 && <span className="xdish"><i className="fa-solid fa-star" aria-hidden />{e.dishes.map((d) => t(d)).join(" · ")}</span>}
                    </span>
                    {p && <i className="fa-solid fa-chevron-right card-chev" aria-hidden />}
                  </>
                );
                return (
                  <li key={i}>
                    {p
                      ? <button type="button" className="card card-link" onClick={() => onOpenPlace(p.id)}>{inner}</button>
                      : <div className="card">{inner}</div>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- Places ---------------- */

const SKIP: Place["kind"][] = ["food", "transit", "hotel"];

function collectPlaces(day: Day, places: Places) {
  const seen = new Map<string, { place: Place; time: string; optional: boolean }>();
  const visit = (id: string | undefined, time: string, optional: boolean) => {
    const p = id ? places[id] : undefined;
    if (!p || SKIP.includes(p.kind) || seen.has(p.id)) return;
    seen.set(p.id, { place: p, time, optional });
  };
  for (const it of day.items) {
    visit(it.placeId, it.start, it.optional);
    for (const f of it.food) visit(f.placeId, it.start, it.optional);
    for (const s of it.route) {
      visit(s.placeId, s.time, s.optional || it.optional);
      for (const f of s.food) visit(f.placeId, s.time, s.optional || it.optional);
    }
  }
  return [...seen.values()];
}

function PlacesView({ day, places, onOpenPlace }: ViewProps) {
  const { t, ui } = useLang();
  const list = collectPlaces(day, places);
  const ticketed = list.filter((x) => x.place.ticket).length;
  return (
    <div className="xgroups">
      <p className="xsummary">
        {list.length} {ui("placesCountLabel")}
        {ticketed > 0 && <> · <span className="xticket-count"><i className="fa-solid fa-ticket" aria-hidden />{ticketed} {ui("ticketCount")}</span></>}
      </p>
      <ul className="cards">
        {list.map(({ place: p, time, optional }) => (
          <li key={p.id}>
            <button type="button" className={`card card-link${p.ticket ? " card-ticket" : ""}`} onClick={() => onOpenPlace(p.id)}>
              <Thumb place={p} />
              <span className="card-text">
                <b>{t(p.name)}{optional && <span className="badge">{ui("optional")}</span>}</b>
                <span className="xmeta">{time} · {ui(`kind_${p.kind}` as UIKey)}</span>
                {p.ticket && <span className="xticket"><i className="fa-solid fa-ticket" aria-hidden /><b>{ui("ticket")}</b>{t(p.ticket)}</span>}
              </span>
              <i className="fa-solid fa-chevron-right card-chev" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

