"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLang } from "@/lib/i18n";
import { parts } from "@/lib/dates";
import type { Day, Places, Trip } from "@/lib/types";
import Timeline from "./Timeline";

gsap.registerPlugin(useGSAP);

interface Props {
  trip: Trip; places: Places; day: Day;
  onOpenPlace: (id: string) => void; onNext?: () => void;
}

export default function DayView({ trip, places, day, onOpenPlace, onNext }: Props) {
  const { lang, t, ui } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const p = parts(day.iso);
  const span = day.items.length
    ? `${day.items.map((x) => x.start).sort()[0]} – ${day.items.map((x) => x.end).sort().pop()}`
    : "";
  const next = onNext ? trip.days[day.index + 1] : undefined;
  const np = next && parts(next.iso);

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
          <span className="chip mono"><i className="fa-regular fa-calendar" aria-hidden />{lang === "en" ? `Day ${day.index + 1}/${trip.days.length}` : `第 ${day.index + 1}/${trip.days.length} 天`}</span>
          {span && <span className="chip mono"><i className="fa-regular fa-clock" aria-hidden />{span}</span>}
          {!day.locked && <span className="chip chip-accent"><i className="fa-solid fa-pen-ruler" aria-hidden />{ui("flexible")}</span>}
        </div>
        <h1 className="theme dh-reveal">{t(day.theme)}</h1>
        {day.intro && <p className="intro dh-reveal">{t(day.intro)}</p>}
      </section>

      <Timeline items={day.items} places={places} groups={trip.groups} onOpenPlace={onOpenPlace} />

      {day.backup && (
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

      {next && np && (
        <button type="button" className="nextday" onClick={onNext}>
          <span className="nd-date">
            <span className="nd-num">{np.day}</span>
            <span className="nd-dow">{lang === "en" ? np.dowEn : np.dowZh}</span>
          </span>
          <span className="nd-text">
            <small>{ui("nextDay")}</small>
            {t(next.theme)}
          </span>
          <i className="fa-solid fa-arrow-right" aria-hidden />
        </button>
      )}
      <p className="hint">{ui("swipeHint")}</p>
    </article>
  );
}
