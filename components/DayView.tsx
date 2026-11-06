"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLang } from "@/lib/i18n";
import { parts } from "@/lib/dates";
import type { Day, Places, Trip } from "@/lib/types";
import Timeline from "./Timeline";
import { DayTabBar, DayTabView, type DayTab } from "./DayTabs";

gsap.registerPlugin(useGSAP);

interface Props {
  trip: Trip; places: Places; day: Day;
  onOpenPlace: (id: string) => void; onPrev?: () => void; onNext?: () => void;
}

export default function DayView({ trip, places, day, onOpenPlace, onPrev, onNext }: Props) {
  const { lang, t, ui } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<DayTab>("plan");
  const p = parts(day.iso);
  const span = day.items.length
    ? `${day.items.map((x) => x.start).sort()[0]} – ${day.items.map((x) => x.end).sort().pop()}`
    : "";
  const prev = onPrev ? trip.days[day.index - 1] : undefined;
  const next = onNext ? trip.days[day.index + 1] : undefined;
  const label = (iso: string) => {
    const d = parts(iso);
    return lang === "en" ? `${d.dowEn}, ${d.monthEn} ${d.day}` : `${d.month}月${d.day}日 ${d.dowZh}`;
  };

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".bd-num", { yPercent: 35, opacity: 0, duration: 0.6 })
        .from(".bd-meta > *", { x: -12, opacity: 0, stagger: 0.06, duration: 0.45 }, "<0.08")
        .from(".dh-reveal", { y: 14, opacity: 0, stagger: 0.06, duration: 0.5 }, "<0.05")
        .from(".tl > .row", { y: 18, opacity: 0, stagger: 0.035, duration: 0.5, clearProps: "transform,opacity" }, "<0.1");
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [day.iso] });

  return (
    <article className="day" ref={root} aria-label={`${p.monthEn} ${p.day}`}>
      <section className="dayhead">
        <div className="bigdate">
          <span className="bd-num">{p.day}</span>
          <div className="bd-meta">
            <span className="bd-dow">{lang === "en" ? p.dowEn : p.dowZh}</span>
            <span className="bd-month">{lang === "en" ? `${p.monthEnLong} ${p.year}` : `${p.year}年${p.month}月`}</span>
          </div>
        </div>
        <div className="chips dh-reveal">
          <span className="chip"><i className="fa-solid fa-hotel" aria-hidden />{t(trip.stays[day.stay].area)}</span>
          {day.away && <span className="chip chip-away"><i className="fa-solid fa-plane-departure" aria-hidden />{t(day.away)}</span>}
          <span className="chip mono"><i className="fa-regular fa-calendar" aria-hidden />{lang === "en" ? `Day ${day.index + 1}/${trip.days.length}` : `第 ${day.index + 1}/${trip.days.length} 天`}</span>
          {span && <span className="chip mono"><i className="fa-regular fa-clock" aria-hidden />{span}</span>}
          {!day.locked && <span className="chip chip-accent"><i className="fa-solid fa-pen-ruler" aria-hidden />{ui("flexible")}</span>}
        </div>
        <h1 className="theme dh-reveal">{t(day.theme)}</h1>
        {day.intro && (t(day.intro).includes("\n") ? (
          <ul className="intro intro-list dh-reveal">
            {t(day.intro).split("\n").filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        ) : (
          <p className="intro dh-reveal">{t(day.intro)}</p>
        ))}
        {day.notice && (
          <p className="day-notice dh-reveal" role="note">
            <i className="fa-solid fa-circle-exclamation" aria-hidden />
            <span>{t(day.notice)}</span>
          </p>
        )}
      </section>

      <DayTabBar value={tab} onChange={setTab} />

      {tab === "plan"
        ? <Timeline items={day.items} places={places} groups={trip.groups} onOpenPlace={onOpenPlace} />
        : <DayTabView tab={tab} day={day} places={places} onOpenPlace={onOpenPlace} />}

      {tab === "plan" && day.backup && (
        <details className="backup">
          <summary>
            <span className="backup-icon"><i className="fa-solid fa-box-archive" aria-hidden /></span>
            <span>
              <small>{ui("backup")}</small>
              {t(day.backup.title)}
            </span>
            <i className="fa-solid fa-chevron-down backup-chev" aria-hidden />
          </summary>
          {day.backup.note && <p className="backup-note">{t(day.backup.note)}</p>}
          <Timeline items={day.backup.items} places={places} groups={trip.groups} onOpenPlace={onOpenPlace} compact />
        </details>
      )}

      <nav className="daynav" aria-label={lang === "en" ? "Change day" : "切换日期"}>
        {prev && onPrev ? (
          <button type="button" className="dn dn-prev" onClick={onPrev} aria-label={`${ui("prevDay")}: ${label(prev.iso)}`}>
            <i className="fa-solid fa-arrow-left" aria-hidden />
            <span>{label(prev.iso)}</span>
          </button>
        ) : <span />}
        {next && onNext ? (
          <button type="button" className="dn dn-next" onClick={onNext} aria-label={`${ui("nextDay")}: ${label(next.iso)}`}>
            <span>{label(next.iso)}</span>
            <i className="fa-solid fa-arrow-right" aria-hidden />
          </button>
        ) : <span />}
      </nav>
    </article>
  );
}
