"use client";
import { Fragment, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import PlaceTitle from "./PlaceTitle";
import type { Food, Item, Place, Places, Stop, T } from "@/lib/types";

const KIND_ICON: Record<Place["kind"], string> = {
  sight: "fa-landmark", food: "fa-utensils", shop: "fa-bag-shopping", show: "fa-masks-theater",
  ride: "fa-ticket", transit: "fa-train-subway", hotel: "fa-bed",
};

/** Pick a transport icon from the itinerary's own wording. */
function transitIcon(zh: string) {
  if (/高铁/.test(zh)) return "fa-train";
  if (/地铁/.test(zh)) return "fa-train-subway";
  if (/接驳车/.test(zh)) return "fa-van-shuttle";
  if (/包车/.test(zh)) return "fa-shuttle-van";
  if (/打车|的士|接机车|六座车/.test(zh)) return "fa-taxi";
  if (/步行/.test(zh)) return "fa-person-walking";
  if (/航班|机场/.test(zh)) return "fa-plane";
  if (/小轮|夜游|船/.test(zh)) return "fa-ferry";
  return "fa-route";
}
/** Tag (by Chinese source text) → colour class. */
const TAG_CLASS: Record<string, string> = {
  打卡: "must", 拍照: "photo", 购物: "shop", 甜品: "dessert", 午餐: "meal", 晚餐: "meal", 刺激: "thrill", 亲子: "family",
};
const isTransit = (it: Item) => /→/.test(it.title.zh);
const isMeal = (it: Item) => /^(早餐|午餐|晚餐|早午茶|下午茶|跨年晚餐)/.test(it.title.zh) || it.food.some((f) => !f.dish);

interface Ctx { places: Places; onOpenPlace: (id: string) => void }

export default function Timeline({ items, places, groups, onOpenPlace, compact }: {
  items: Item[]; places: Places; groups: Record<"a" | "k", T>; onOpenPlace: (id: string) => void; compact?: boolean;
}) {
  const ctx = { places, onOpenPlace };

  // Overlapping group items (a / k) render side by side as one block.
  const blocks: ({ one: Item } | { run: Item[]; s: string; e: string })[] = [];
  for (let i = 0; i < items.length;) {
    if (!items[i].group) { blocks.push({ one: items[i] }); i++; continue; }
    const run: Item[] = []; const s = items[i].start; let e = items[i].end;
    while (i < items.length && items[i].group && (run.length === 0 || items[i].start <= e)) {
      run.push(items[i]); if (items[i].end > e) e = items[i].end; i++;
    }
    blocks.push({ run, s, e });
  }

  return (
    <ol className={`tl${compact ? " tl-compact" : ""}`}>
      {blocks.map((b, bi) => {
        if ("one" in b) return <Row key={bi} it={b.one} ctx={ctx} />;
        return <OptionsRow key={bi} run={b.run} s={b.s} e={b.e} groups={groups} ctx={ctx} />;
      })}
    </ol>
  );
}

const GROUPS = ["a", "k"] as const;
type Group = (typeof GROUPS)[number];

/**
 * Two alternative plans for the same time slot: time on the left like every row,
 * two large tabs (Option A / Option B) and one card showing the chosen option.
 * Option A is shown by default.
 */
function OptionsRow({ run, s, e, groups, ctx }: {
  run: Item[]; s: string; e: string; groups: Record<Group, T>; ctx: Ctx;
}) {
  const { t } = useLang();
  const present = GROUPS.filter((g) => run.some((x) => x.group === g));
  const [active, setActive] = useState<Group>(present[0] ?? "a");
  const [dir, setDir] = useState(0);
  const pick = (g: Group) => { setDir(GROUPS.indexOf(g) > GROUPS.indexOf(active) ? 1 : -1); setActive(g); };
  const list = (g: Group) => run.filter((x) => x.group === g);

  return (
    <li className="row row-split">
      <Time start={s} end={e} />
      <span className="dot dot-split" aria-hidden><i className="fa-solid fa-signs-post" /></span>
      <div className="body">
        <div className="opt-tabs" role="tablist">
          {present.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={active === g}
              className={`opt-tab${active === g ? " on" : ""}`}
              onClick={() => pick(g)}
            >
              <small>{t(groups[g])}</small>
              <span>{t(list(g)[0]?.title)}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={active}
            role="tabpanel"
            className={`opt-card opt-card-${active}`}
            initial={{ opacity: 0, x: dir * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -20 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            {list(active).map((it, k) => (
              <div key={k} className="opt-item">
                {(list(active).length > 1 || it.start !== s || it.end !== e) && <span className="sub-time">{it.start} – {it.end}</span>}
                <ItemBody it={it} ctx={ctx} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </li>
  );
}

function Time({ start, end }: { start: string; end: string }) {
  return (
    <div className="time">
      <b>{start}</b>
      {end !== start && <span>{end}</span>}
    </div>
  );
}

function Row({ it, ctx }: { it: Item; ctx: Ctx }) {
  const transit = isTransit(it);
  const cls = `row${transit ? " row-transit" : ""}${isMeal(it) ? " row-meal" : ""}${it.placeId ? " row-place" : ""}`;
  return (
    <li className={cls}>
      <Time start={it.start} end={it.end} />
      <span className="dot" aria-hidden>
        {transit && <i className={`fa-solid ${transitIcon(it.title.zh + (it.note?.zh ?? ""))}`} />}
      </span>
      <div className="body"><ItemBody it={it} ctx={ctx} /></div>
    </li>
  );
}

function ItemBody({ it, ctx }: { it: Item; ctx: Ctx }) {
  const { t, ui } = useLang();
  return (
    <>
      <div className="title-line">
        <Title text={it.title} placeId={it.placeId} ctx={ctx} as="h3" chips={<Chips tags={it.tags} />} />
        {it.optional && <span className="badge">{ui("optional")}</span>}
      </div>
      {it.note && <p className="note">{t(it.note)}</p>}
      {it.tip && <Tip text={t(it.tip)} />}
      <Banner placeId={it.placeId} ctx={ctx} />
      <FoodBlock food={it.food} ctx={ctx} />
      {it.route.length > 0 && (
        <ol className="route">
          {it.route.map((s, i) => (
            <Fragment key={i}>
              {s.section && <SectionHead text={s.section} />}
              <StopRow s={s} ctx={ctx} />
            </Fragment>
          ))}
        </ol>
      )}
    </>
  );
}

/** Heading for a cluster of stops (e.g. "Lychee Bay: lake, canal, mansions"). */
function SectionHead({ text }: { text: T }) {
  const { t } = useLang();
  return (
    <li className="stop-section" role="presentation">
      <i className="fa-solid fa-location-dot" aria-hidden />{t(text)}
    </li>
  );
}

function StopRow({ s, ctx }: { s: Stop; ctx: Ctx }) {
  const { t } = useLang();
  return (
    <li className="stop">
      {s.walk && <span className="walk"><i className="fa-solid fa-arrow-down" aria-hidden />{t(s.walk)}</span>}
      <span className="stop-time">{s.time}</span>
      <div className="title-line title-inline">
        <Title
          text={s.title}
          placeId={s.placeId}
          ctx={ctx}
          as="h4"
          chips={<Chips tags={s.tags} optional={s.optional} />}
        />
      </div>
      {s.desc && <p className="note">{t(s.desc)}</p>}
      {s.pick && <VanLine kind="pickUp" text={t(s.pick)} />}
      {s.drop && <VanLine kind="dropOff" text={t(s.drop)} />}
      {s.tip && <Tip text={t(s.tip)} />}
      <FoodBlock food={s.food} ctx={ctx} />
    </li>
  );
}

/** Tag chips after a title; the photo tag carries a camera icon. */
function Chips({ tags, optional }: { tags: T[]; optional?: boolean }) {
  const { t, ui } = useLang();
  if (tags.length === 0 && !optional) return null;
  return (
    <span className="chips-inline">
      {optional && <span className="badge">{ui("optional")}</span>}
      {tags.map((tag, i) => {
        const cls = TAG_CLASS[tag.zh];
        return (
          <span key={i} className={`tag${cls ? ` tag-${cls}` : ""}`}>
            {cls === "photo" && <i className="fa-solid fa-camera" aria-hidden />}
            {t(tag)}
          </span>
        );
      })}
    </span>
  );
}

function Title({ text, placeId, ctx, as: Tag, chips }: {
  text: T; placeId?: string; ctx: Ctx; as: "h3" | "h4"; chips?: React.ReactNode;
}) {
  const { t } = useLang();
  const place = placeId ? ctx.places[placeId] : undefined;
  if (!place) return <Tag className="title">{t(text)}{chips}</Tag>;
  return (
    <Tag className="title">
      <PlaceTitle
        placeId={place.id}
        thumb={Tag === "h4" && place.image ? (place.thumb ?? place.image) : undefined}
        title={t(text)}
        chips={chips}
        flagged={!!place.flag}
        onOpen={ctx.onOpenPlace}
      />
    </Tag>
  );
}

/** Wide photo card under a top-level item that is a place. */
function Banner({ placeId, ctx }: { placeId?: string; ctx: Ctx }) {
  const { t } = useLang();
  const place = placeId ? ctx.places[placeId] : undefined;
  if (!place?.image) return null;
  return (
    <button type="button" className="banner" onClick={() => ctx.onOpenPlace(place.id)} aria-label={place.name.en}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local photo */}
      <img src={place.image} alt="" loading="lazy" decoding="async" />
      <span className="banner-shade" />
      <span className="banner-text">
        {place.rating != null && <span className="banner-rating"><i className="fa-solid fa-star" aria-hidden />{place.rating.toFixed(1)}</span>}
        {place.summary && <span className="banner-sum">{t(place.summary)}</span>}
      </span>
    </button>
  );
}

function FoodBlock({ food, ctx }: { food: Food[]; ctx: Ctx }) {
  const { t, ui } = useLang();
  const rest = food.filter((f) => !f.dish);
  const dish = food.filter((f) => f.dish);
  /** Every entry is a non-food place: a list of sights to pop into on the way. */
  const passBy = rest.length > 0 && rest.every((f) => f.placeId && ctx.places[f.placeId]?.kind !== "food");
  if (!food.length) return null;
  return (
    <div className="food">
      {rest.length > 0 && (
        <div className="food-group">
          <span className="food-label">
            <i className={`fa-solid ${passBy ? "fa-location-dot" : "fa-utensils"}`} aria-hidden />
            {passBy ? ui("passBy") : ui(rest.length > 1 ? "restaurants" : "restaurant")}
          </span>
          <ul className="cards">
            {rest.map((f, i) => {
              const p = f.placeId ? ctx.places[f.placeId] : undefined;
              const inner = (
                <>
                  <Thumb place={p} />
                  <span className="card-text">
                    <b className={p?.flag ? "flagged" : undefined}>{t(f.name)}</b>
                    {f.desc && <span>{t(f.desc)}</span>}
                  </span>
                  {p && <i className="fa-solid fa-chevron-right card-chev" aria-hidden />}
                </>
              );
              return (
                <li key={i}>
                  {p
                    ? <button type="button" className="card card-link" onClick={() => ctx.onOpenPlace(p.id)}>{inner}</button>
                    : <div className="card">{inner}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {dish.length > 0 && (
        <div className="food-group">
          <span className="food-label food-label-dish"><i className="fa-solid fa-bowl-food" aria-hidden />{ui("mustOrder")}</span>
          <ul className="dishes">
            {dish.map((f, i) => (
              <li key={i}><b>{t(f.name)}</b>{f.desc && <span>{t(f.desc)}</span>}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Thumb({ place }: { place?: Place }) {
  if (place?.image) {
    // eslint-disable-next-line @next/next/no-img-element -- small local thumbnails, lazy-loaded
    return <img className="thumb" src={place.thumb ?? place.image} alt="" loading="lazy" decoding="async" />;
  }
  return <span className="thumb thumb-icon"><i className={`fa-solid ${place ? KIND_ICON[place.kind] : "fa-utensils"}`} aria-hidden /></span>;
}

/** Always-visible tip: lightbulb in a fixed left column, text wraps beside it. */
function Tip({ text }: { text: string }) {
  const { ui } = useLang();
  return (
    <div className="tip" role="note" aria-label={ui("tip")}>
      <i className="fa-solid fa-lightbulb tip-icon" aria-hidden />
      <p>{text}</p>
    </div>
  );
}

export { KIND_ICON, Thumb, Tip, VanLine, transitIcon };

/** Where the chartered car picks the group up or drops it off. */
function VanLine({ kind, text }: { kind: "pickUp" | "dropOff"; text: string }) {
  const { ui } = useLang();
  return (
    <p className={`van van-${kind}`}>
      <i className="fa-solid fa-car-side" aria-hidden />
      <span><b>{ui(kind)}</b>{text}</span>
    </p>
  );
}
