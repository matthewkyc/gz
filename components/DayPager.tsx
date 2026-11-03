"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useLang } from "@/lib/i18n";
import type { Places, Trip } from "@/lib/types";
import DayView from "./DayView";

const variants = {
  enter: (dir: number) => ({ x: dir * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -56, opacity: 0 }),
};

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(pointer: coarse)");
    const on = () => setCoarse(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return coarse;
}

interface Props {
  trip: Trip; places: Places; index: number; dir: number;
  onGo: (i: number) => void; onOpenPlace: (id: string) => void;
}

export default function DayPager({ trip, places, index, dir, onGo, onOpenPlace }: Props) {
  const { ui } = useLang();
  const touch = useCoarsePointer();
  const day = trip.days[index];
  const last = trip.days.length - 1;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -90) onGo(index + 1);
    else if (swipe > 90) onGo(index - 1);
  };

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
          drag={touch ? "x" : false}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.22}
          onDragEnd={onDragEnd}
          style={{ touchAction: "pan-y" }}
        >
          <DayView
            trip={trip}
            places={places}
            day={day}
            onOpenPlace={onOpenPlace}
            onNext={index < last ? () => onGo(index + 1) : undefined}
          />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
