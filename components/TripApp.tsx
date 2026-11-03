"use client";
import { useCallback, useEffect, useState } from "react";
import { LangProvider } from "@/lib/i18n";
import { todayIso } from "@/lib/dates";
import type { GuideSection, Places, Trip } from "@/lib/types";
import Header from "./Header";
import DayPager from "./DayPager";
import PlaceDrawer from "./PlaceDrawer";
import MenuSheet from "./MenuSheet";

export interface OpenPlace { id: string; day: number }

export default function TripApp({ trip, places, guides }: { trip: Trip; places: Places; guides: GuideSection[] }) {
  return (
    <LangProvider>
      <Shell trip={trip} places={places} guides={guides} />
    </LangProvider>
  );
}

function initialIndex(trip: Trip) {
  const fromHash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const byHash = trip.days.findIndex((d) => d.iso === fromHash);
  if (byHash >= 0) return byHash;
  const today = trip.days.findIndex((d) => d.iso === todayIso());
  return today >= 0 ? today : 0;
}

function Shell({ trip, places, guides }: { trip: Trip; places: Places; guides: GuideSection[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [open, setOpen] = useState<OpenPlace | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL hash / today is only known on the client
    setIndex(initialIndex(trip));
  }, [trip]);

  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(trip.days.length - 1, i));
    if (next === index) return;
    setDir(next > index ? 1 : -1);
    setIndex(next);
    history.replaceState(null, "", `#${trip.days[next].iso}`);
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, trip.days]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open || menu || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, open, menu]);

  const day = trip.days[index];
  const closeMenu = useCallback(() => setMenu(false), []);
  const openPlace = useCallback((id: string) => setOpen({ id, day: day.index }), [day.index]);
  const drawerDay = open ? trip.days[open.day] : undefined;

  return (
    <>
      <Header trip={trip} index={index} onSelect={go} onMenu={() => setMenu(true)} />
      <DayPager trip={trip} places={places} index={index} dir={dir} onGo={go} onOpenPlace={openPlace} />
      <MenuSheet open={menu} trip={trip} places={places} guides={guides} index={index} onSelect={go} onClose={closeMenu} onOpenPlace={(id) => setOpen({ id, day: index })} />
      <PlaceDrawer
        place={open ? places[open.id] : undefined}
        from={open && drawerDay?.prev[open.id] ? places[drawerDay.prev[open.id]] : undefined}
        how={open ? drawerDay?.how[open.id] : undefined}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
