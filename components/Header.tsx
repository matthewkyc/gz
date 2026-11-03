"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { parts, todayIso } from "@/lib/dates";
import type { Trip } from "@/lib/types";

export default function Header({ trip, index, onSelect }: { trip: Trip; index: number; onSelect: (i: number) => void }) {
  const { lang, setLang, t, ui } = useLang();
  const strip = useRef<HTMLDivElement>(null);
  const today = todayIso();
  const day = trip.days[index];

  // Keep the selected date centred in the strip.
  useEffect(() => {
    const box = strip.current;
    const el = box?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (!box || !el) return;
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    const left = box.scrollLeft + (r.left - b.left) - b.width / 2 + r.width / 2;
    box.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [index]);

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <span className="brand-title">{t(trip.title)}</span>
          <span className="brand-sub">
            <i className="fa-solid fa-location-dot" aria-hidden /> {t(trip.stays[day.stay].area)}
            <span className="sep">·</span>
            {lang === "en" ? `Day ${index + 1} of ${trip.days.length}` : `第 ${index + 1} 天 / 共 ${trip.days.length} 天`}
          </span>
        </div>
        <button
          type="button"
          className="globe"
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          aria-label={ui("language")}
          title={ui("language")}
        >
          <i className="fa-solid fa-globe" aria-hidden />
          <span>{lang === "en" ? "EN" : "中"}</span>
        </button>
      </div>

      <nav className="strip" ref={strip} aria-label="Trip days">
        {trip.days.map((d, i) => {
          const p = parts(d.iso);
          const firstOfStay = i === 0 || trip.days[i - 1].stay !== d.stay;
          const sel = i === index;
          return (
            <div className="strip-cell" key={d.iso}>
              {firstOfStay && (
                <span className="stay-mark" aria-hidden>{t(trip.stays[d.stay].area)}</span>
              )}
              <button
                type="button"
                data-i={i}
                className={`sq${sel ? " sel" : ""}${d.locked ? "" : " flex"}`}
                aria-current={sel ? "date" : undefined}
                aria-label={`${p.monthEn} ${p.day}, ${p.dowEn}`}
                onClick={() => onSelect(i)}
              >
                {sel && <motion.span layoutId="sq-sel" className="sq-bg" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
                <span className="sq-dow">{lang === "en" ? p.dowEn : p.dowZh}</span>
                <span className="sq-num">{p.day}</span>
                {d.iso === today && <span className="sq-today" />}
              </button>
            </div>
          );
        })}
      </nav>
    </header>
  );
}
