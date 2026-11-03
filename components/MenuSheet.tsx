"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { parts } from "@/lib/dates";
import { amapSearch } from "@/lib/maps";
import type { GuideItem, GuideSection, Places, Trip } from "@/lib/types";

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 900px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

interface Props {
  open: boolean; trip: Trip; places: Places; guides: GuideSection[]; index: number;
  onSelect: (i: number) => void; onClose: () => void; onOpenPlace: (id: string) => void;
}

/** ☰ menu: a home list that slides into Days, Hotels and the curated guides. */
export default function MenuSheet(props: Props) {
  const { open, onClose } = props;
  const { ui } = useLang();
  const wide = useWide();
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="menu-scrim" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      )}
      {open && (
        <motion.aside
          key="menu"
          className={`sheet menu${wide ? " sheet-side" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={ui("menu")}
          initial={wide ? { x: "100%" } : { y: "100%" }}
          animate={wide ? { x: 0 } : { y: 0 }}
          exit={wide ? { x: "100%" } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40, mass: 0.9 }}
          drag={wide ? false : "y"}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
        >
          {/* Remounted on every open, so the menu always starts at the home list. */}
          <MenuBody {...props} wide={wide} onHandle={(e) => !wide && drag.start(e)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

type View = "home" | "days" | "hotels" | string;

function MenuBody({ trip, places, guides, index, onSelect, onClose, onOpenPlace, onHandle }: Props & {
  wide: boolean; onHandle: (e: React.PointerEvent) => void;
}) {
  const { t, ui } = useLang();
  const [view, setView] = useState<View>("home");
  const [dir, setDir] = useState(1);
  const go = (v: View) => { setDir(v === "home" ? -1 : 1); setView(v); };
  const guide = guides.find((g) => g.id === view);

  const entries: { id: View; icon: string; title: string; sub: string }[] = [
    { id: "days", icon: "fa-calendar-days", title: ui("daysTitle"), sub: ui("daysSub") },
    { id: "hotels", icon: "fa-hotel", title: ui("hotelsTitle"), sub: ui("hotelsSub") },
    ...guides.map((g) => ({ id: g.id, icon: g.icon, title: t(g.title), sub: t(g.subtitle) })),
  ];
  const title = view === "home" ? ui("menu") : entries.find((e) => e.id === view)?.title ?? "";

  return (
    <div className="sheet-inner">
      <header className="menu-head" onPointerDown={onHandle}>
        <span className="menu-grab" aria-hidden />
        {view !== "home" ? (
          <button type="button" className="menu-back" onClick={() => go("home")}>
            <i className="fa-solid fa-chevron-left" aria-hidden />{ui("menu")}
          </button>
        ) : <span />}
        <button type="button" className="menu-close" onClick={onClose} aria-label={ui("close")}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
      </header>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={view}
          className="menu-view"
          initial={{ x: dir * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: dir * -60, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="menu-title">{title}</h2>

          {view === "home" && (
            <ul className="menu-list">
              {entries.map((e, i) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25 }}
                >
                  <button type="button" className="menu-entry" onClick={() => go(e.id)}>
                    <span className="menu-ico"><i className={`fa-solid ${e.icon}`} aria-hidden /></span>
                    <span className="menu-entry-text"><b>{e.title}</b><small>{e.sub}</small></span>
                    <i className="fa-solid fa-chevron-right menu-chev" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}

          {view === "days" && <DaysList trip={trip} index={index} onSelect={(i) => { onSelect(i); onClose(); }} />}
          {view === "hotels" && <HotelsList trip={trip} places={places} />}

          {guide && <GuideView guide={guide} places={places} onOpenPlace={onOpenPlace} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DaysList({ trip, index, onSelect }: { trip: Trip; index: number; onSelect: (i: number) => void }) {
  const { lang, t } = useLang();
  return (
    <ul className="daylist">
      {trip.days.map((d, i) => {
        const p = parts(d.iso);
        const newStay = i === 0 || trip.days[i - 1].stay !== d.stay;
        return (
          <li key={d.iso}>
            {newStay && <span className="daylist-stay">{t(trip.stays[d.stay].area)} · {t(trip.stays[d.stay].range)}</span>}
            <button type="button" className={`dayrow${i === index ? " on" : ""}${d.away ? " away" : ""}`} onClick={() => onSelect(i)}>
              <span className="dayrow-sq"><small>{p.dowEn}</small><b>{p.day}</b></span>
              <span className="dayrow-text">
                <small>{lang === "en" ? `${p.monthEn} ${p.day} · Day ${i + 1}` : `${p.month}月${p.day}日 · 第 ${i + 1} 天`}</small>
                {t(d.theme)}
              </span>
              {d.away && <span className="dayrow-away"><i className="fa-solid fa-plane-departure" aria-hidden />{t(d.away)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HotelsList({ trip, places }: { trip: Trip; places: Places }) {
  const { lang, t, ui } = useLang();
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (i: number, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1600); } catch {}
  };
  return (
    <>
      <ul className="hotels">
        {trip.stays.map((s, i) => {
          const place = s.hotelId ? places[s.hotelId] : undefined;
          return (
            <li key={i} className="hotel">
              <span className="hotel-when">{t(s.area)} · {t(s.range)}</span>
              <b className="hotel-name">{t(s.hotel)}</b>
              {lang === "en" && s.address && <span className="hotel-addr">{s.address.en}</span>}
              <div className="taxi">
                <small>{ui("showDriver")}</small>
                <p className="taxi-name">{s.hotel?.zh}</p>
                <p className="taxi-addr">{s.address?.zh}</p>
              </div>
              <div className="hotel-actions">
                <button type="button" className="navbtn" onClick={() => copy(i, [s.hotel?.zh, s.address?.zh].filter(Boolean).join("\n"))}>
                  <i className={`fa-solid ${copied === i ? "fa-check" : "fa-copy"}`} aria-hidden />{copied === i ? ui("copied") : ui("copyAddress")}
                </button>
                {place && (
                  <a className="navbtn primary" href={amapSearch(place)} target="_blank" rel="noopener noreferrer">
                    <i className="fa-solid fa-location-arrow" aria-hidden />{ui("amap")}
                  </a>
                )}
                {s.phone && (
                  <a className="navbtn" href={`tel:${s.phone.replace(/\s/g, "")}`}>
                    <i className="fa-solid fa-phone" aria-hidden />{ui("call")}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="fine">{ui("hotelNote")}</p>
    </>
  );
}

/** Strip the bracketed Chinese from an English heading: "Liwan (荔湾)" → "Liwan". */
const short = (s: string) => s.replace(/\s*[（(].*?[)）]\s*/g, "").trim();
const isUnscheduled = (it: GuideItem) => /^Not scheduled/.test(it.when?.en ?? "") || /^未排入/.test(it.when?.zh ?? "");

function GuideView({ guide, places, onOpenPlace }: { guide: GuideSection; places: Places; onOpenPlace: (id: string) => void }) {
  const { lang, t, ui } = useLang();

  // Split the flat item list into groups at each heading.
  const groups: { heading?: GuideItem["heading"]; items: GuideItem[] }[] = [];
  for (const it of guide.items) {
    if (it.heading || groups.length === 0) groups.push({ heading: it.heading, items: [] });
    groups[groups.length - 1].items.push(it);
  }
  const headed = groups.filter((g) => g.heading);
  const jump = (k: number) => document.getElementById(`gsec-${guide.id}-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      {guide.intro && <p className="guide-intro">{t(guide.intro)}</p>}
      {headed.length > 1 && (
        <nav className="gjump" aria-label={ui("jumpTo")}>
          {groups.map((g, k) => g.heading && (
            <button key={k} type="button" className="gjump-chip" onClick={() => jump(k)}>
              {lang === "en" ? short(g.heading.en) : g.heading.zh}
            </button>
          ))}
        </nav>
      )}
      {groups.map((g, k) => {
        const counted = g.items.filter((x) => x.badge).length;
        return (
          <section key={k} id={`gsec-${guide.id}-${k}`} className="gsec">
            {g.heading && (
              <h4 className="gsec-head">
                <i className={`fa-solid ${counted ? "fa-location-dot" : "fa-circle-info"}`} aria-hidden />
                <span>{t(g.heading)}</span>
                {counted > 0 && (
                  <small>{lang === "en" ? `${counted} ${counted === 1 ? "place" : "places"}` : `${counted} 个地点`}</small>
                )}
              </h4>
            )}
            <ul className="guide-list">
              {g.items.map((it, i) => {
                const linked = it.placeId && places[it.placeId];
                const body = (
                  <>
                    <span className="gi-top">
                      <b className="gi-title">{t(it.title)}</b>
                      {it.badge && <span className="gi-badge">{t(it.badge)}</span>}
                    </span>
                    <span className="gi-desc">{t(it.desc)}</span>
                    {it.meta && <span className="gi-meta"><i className="fa-solid fa-location-dot" aria-hidden />{t(it.meta)}</span>}
                    {it.hours && <span className="gi-meta"><i className="fa-regular fa-clock" aria-hidden />{t(it.hours)}</span>}
                    {it.when && (
                      <span className={`gi-when${isUnscheduled(it) ? " muted" : ""}`}>
                        <i className="fa-regular fa-calendar" aria-hidden />{t(it.when)}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={i}>
                    {linked ? (
                      <button type="button" className="gi gi-link" onClick={() => onOpenPlace(it.placeId!)}>
                        <span className="gi-body">{body}</span>
                        <i className="fa-solid fa-chevron-right menu-chev" aria-hidden />
                      </button>
                    ) : (
                      <div className="gi"><span className="gi-body">{body}</span></div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
