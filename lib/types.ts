/** Raw content shapes (one file per language, identical structure). */
export type Lang = "en" | "zh";

export interface RawFood { name: string; desc?: string; dish?: boolean }
export interface RawStop {
  time: string; title: string; walk?: string; desc?: string;
  tags?: string[]; tip?: string; food?: RawFood[]; optional?: boolean;
  /** Chartered car: where it picks the group up / drops it off at this stop. */
  pick?: string; drop?: string;
  /** Section heading shown above this stop; groups the following stops until the next section. */
  section?: string;
}
export interface RawItem {
  start: string; end: string; title: string; note?: string; optional?: boolean;
  group?: "a" | "k"; food?: RawFood[]; route?: RawStop[]; tip?: string; tags?: string[];
}
export interface RawDay {
  stay: number; date: string; dow: string; locked?: boolean; theme: string;
  pace?: string; intro?: string; away?: string;
  /** Reminder shown at the top of the day. */
  notice?: string;
  backup?: { title: string; note?: string; items: RawItem[] };
  items: RawItem[];
}
export interface RawTrip {
  title: string; subtitle: string;
  groups: Record<"a" | "k", string>;
  stays: { area: string; range: string; hotel?: string; address?: string; phone?: string }[];
  days: RawDay[];
}

/** Bilingual text pair. */
export interface T { en: string; zh: string }

export interface Food { name: T; desc?: T; dish: boolean; placeId?: string }
export interface Stop {
  time: string; title: T; walk?: T; desc?: T; tags: T[]; tip?: T; food: Food[]; placeId?: string;
  pick?: T; drop?: T; optional: boolean; section?: T;
}
export interface Item {
  start: string; end: string; title: T; note?: T; optional: boolean;
  group?: "a" | "k"; food: Food[]; route: Stop[]; tip?: T; placeId?: string; tags: T[];
}
export interface Day {
  index: number; iso: string; stay: number; locked: boolean; theme: T; intro?: T; away?: T; notice?: T;
  backup?: { title: T; note?: T; items: Item[] };
  items: Item[];
  /** placeId → previous placeId in the day's walking order (first falls back to the hotel). */
  prev: Record<string, string>;
  /** placeId → itinerary's own travel note for reaching it (e.g. "Taxi, ~15 min"). */
  how: Record<string, T>;
}
export interface Stay { area: T; range: T; hotelId?: string; hotel?: T; address?: T; phone?: string }
export interface Trip {
  title: T; subtitle: T; groups: Record<"a" | "k", T>;
  stays: Stay[]; days: Day[];
}

export interface Review { author: string; rating?: number; text: string; when?: string }
export interface Place {
  id: string;
  aliases: string[];
  kind: "sight" | "food" | "shop" | "show" | "ride" | "transit" | "hotel";
  name: T;
  city?: string;
  query?: string;
  lat?: number; lng?: number;
  summary?: T; why?: T;
  highlights?: { en: string[]; zh: string[] };
  mustTry?: { en: string[]; zh: string[] };
  tips?: T;
  image?: string;
  /** 240px thumbnail for timeline cards. */
  thumb?: string;
  imageCredit?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  mapsUrl?: string;
  /** Marked for attention: name is shown in light red. */
  flag?: boolean;
}
export type Places = Record<string, Place>;

/** Menu guides (content/guides.json): curated lists shown in the ☰ menu. */
export interface GuideItem {
  title: T; desc: T; meta?: T; hours?: T; when?: T; placeId?: string; badge?: T; heading?: T;
}
export interface GuideSection {
  id: string; icon: string; title: T; subtitle: T; intro?: T; items: GuideItem[];
}
