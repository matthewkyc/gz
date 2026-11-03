"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
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
const isTransit = (it: Item) => /→/.test(it.title.zh);
const isMeal = (it: Item) => /^(早餐|午餐|晚餐|早午茶|下午茶|跨年晚餐)/.test(it.title.zh) || it.food.some((f) => !f.dish);

interface Ctx { places: Places; onOpenPlace: (id: string) => void }

export default function Timeline({ items, places, groups, onOpenPlace, compact }: {
  items: Item[]; places: Places; groups: Record<"a" | "k", T>; onOpenPlace: (id: string) => void; compact?: boolean;
}) {
  const { t } = useLang();
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
        return (
          <li key={bi} className="row row-split">
            <Time start={b.s} end={b.e} />
            <span className="dot" aria-hidden />
            <div className="body">
              <div className="cols">
                {(["a", "k"] as const).map((g) => {
                  const list = b.run.filter((x) => x.group === g);
                  if (!list.length) return null;
                  return (
                    <div key={g} className={`col col-${g}`}>
                      <span className="col-label"><i className="fa-solid fa-signs-post" aria-hidden />{t(groups[g])}</span>
                      {list.map((it, k) => (
                        <div key={k} className="sub">
                          <span className="sub-time">{it.start} – {it.end}</span>
                          <ItemBody it={it} ctx={ctx} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
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
  const [tip, setTip] = useState(false);
  return (
    <>
      <div className="title-line">
        <Title text={it.title} placeId={it.placeId} ctx={ctx} as="h3" />
        {it.optional && <span className="badge">{ui("optional")}</span>}
        {it.tip && <TipButton open={tip} onToggle={() => setTip(!tip)} />}
      </div>
      {it.tip && <TipText open={tip} text={t(it.tip)} />}
      {it.note && <p className="note">{t(it.note)}</p>}
      <Banner placeId={it.placeId} ctx={ctx} />
      <FoodBlock food={it.food} ctx={ctx} />
      {it.route.length > 0 && (
        <ol className="route">
          {it.route.map((s, i) => <StopRow key={i} s={s} ctx={ctx} />)}
        </ol>
      )}
    </>
  );
}

function StopRow({ s, ctx }: { s: Stop; ctx: Ctx }) {
  const { t } = useLang();
  const [tip, setTip] = useState(false);
  return (
    <li className="stop">
      {s.walk && <span className="walk"><i className="fa-solid fa-arrow-down" aria-hidden />{t(s.walk)}</span>}
      <div className="title-line">
        <span className="stop-time">{s.time}</span>
        <Title text={s.title} placeId={s.placeId} ctx={ctx} as="h4" />
        {s.tip && <TipButton open={tip} onToggle={() => setTip(!tip)} />}
      </div>
      {s.tags.length > 0 && (
        <div className="tags">{s.tags.map((tag, i) => <span key={i} className="tag">{t(tag)}</span>)}</div>
      )}
      {s.tip && <TipText open={tip} text={t(s.tip)} />}
      {s.desc && <p className="note">{t(s.desc)}</p>}
      <FoodBlock food={s.food} ctx={ctx} />
    </li>
  );
}

function Title({ text, placeId, ctx, as: Tag }: { text: T; placeId?: string; ctx: Ctx; as: "h3" | "h4" }) {
  const { t } = useLang();
  const place = placeId ? ctx.places[placeId] : undefined;
  if (!place) return <Tag className="title">{t(text)}</Tag>;
  return (
    <Tag className="title">
      <button type="button" className="place-link" onClick={() => ctx.onOpenPlace(place.id)}>
        {Tag === "h4" && place.image && (
          // eslint-disable-next-line @next/next/no-img-element -- local thumbnail
          <img className="stop-thumb" src={place.image} alt="" loading="lazy" decoding="async" />
        )}
        <span>{t(text)}</span>
        <i className="fa-solid fa-circle-chevron-right" aria-hidden />
      </button>
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
  if (!food.length) return null;
  return (
    <div className="food">
      {rest.length > 0 && (
        <div className="food-group">
          <span className="food-label"><i className="fa-solid fa-utensils" aria-hidden />{ui(rest.length > 1 ? "restaurants" : "restaurant")}</span>
          <ul className="cards">
            {rest.map((f, i) => {
              const p = f.placeId ? ctx.places[f.placeId] : undefined;
              const inner = (
                <>
                  <Thumb place={p} />
                  <span className="card-text">
                    <b>{t(f.name)}</b>
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
    return <img className="thumb" src={place.image} alt="" loading="lazy" decoding="async" />;
  }
  return <span className="thumb thumb-icon"><i className={`fa-solid ${place ? KIND_ICON[place.kind] : "fa-utensils"}`} aria-hidden /></span>;
}

function TipButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { ui } = useLang();
  return (
    <button type="button" className={`tip-btn${open ? " on" : ""}`} onClick={onToggle} aria-expanded={open} aria-label={ui("tip")}>
      <i className="fa-solid fa-lightbulb" aria-hidden />
    </button>
  );
}

function TipText({ open, text }: { open: boolean; text: string }) {
  const { ui } = useLang();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className="tip"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          <p><b>{ui("tip")}</b>{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { KIND_ICON };
