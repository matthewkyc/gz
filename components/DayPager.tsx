"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import type { Places, Trip } from "@/lib/types";
import DayView from "./DayView";

const variants = {
  enter: (dir: number) => ({ x: dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -56, opacity: 0 }),
};

interface Props {
  trip: Trip; places: Places; index: number; dir: number;
  onGo: (i: number) => void; onOpenPlace: (id: string) => void;
}

export default function DayPager({ trip, places, index, dir, onGo, onOpenPlace }: Props) {
  const { ui } = useLang();
  const day = trip.days[index];
  const last = trip.days.length - 1;

  return (
    <main className="pager">
      <button type="button" className="edge edge-prev" onClick={() => onGo(index - 1)} disabled={index === 0} aria-label={ui("prevDay")}>
        <i className="fa-solid fa-chevron-left" aria-hidden />
      </button>
      <button type="button" className="edge edge-next" onClick={() => onGo(index + 1)} disabled={index === last} aria-label={ui("nextDay")}>
        <i className="fa-solid fa-chevron-right" aria-hidden />
      </button>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={day.iso}
          className="page"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.16 } }}
        >
          <DayView
            trip={trip}
            places={places}
            day={day}
            onOpenPlace={onOpenPlace}
            onPrev={index > 0 ? () => onGo(index - 1) : undefined}
            onNext={index < last ? () => onGo(index + 1) : undefined}
          />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
