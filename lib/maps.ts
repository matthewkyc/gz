import type { Place } from "./types";

const coord = (p: Place) => (p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : null);
const label = (p: Place) => p.query || `${p.name.zh} ${p.city ?? ""}`.trim();
const enc = encodeURIComponent;

/** Google Maps directions (opens app on iPhone if installed). */
export function googleDirections(to: Place, from?: Place) {
  const dest = coord(to) ?? label(to);
  const o = from ? `&origin=${enc(coord(from) ?? label(from))}` : "";
  return `https://www.google.com/maps/dir/?api=1${o}&destination=${enc(dest)}&travelmode=transit`;
}

/** Keyless Google Maps embed — directions when an origin is known, otherwise a pin. */
export function googleEmbed(to: Place, from?: Place) {
  const dest = coord(to) ?? label(to);
  if (from) return `https://maps.google.com/maps?saddr=${enc(coord(from) ?? label(from))}&daddr=${enc(dest)}&dirflg=r&output=embed`;
  return `https://maps.google.com/maps?q=${enc(dest)}&z=16&output=embed`;
}

export function appleDirections(to: Place, from?: Place) {
  const d = coord(to) ?? label(to);
  const s = from ? `&saddr=${enc(coord(from) ?? label(from))}` : "";
  return `https://maps.apple.com/?daddr=${enc(d)}${s}&dirflg=r`;
}

/** Amap (高德) — works in mainland China without a VPN. Name search is used because Amap uses GCJ-02 coordinates. */
export function amapSearch(p: Place) {
  const city = p.city === "Hong Kong" ? "香港" : p.city === "Shenzhen" ? "深圳" : p.city === "Foshan" || p.city === "Shunde" ? "佛山" : "广州";
  return `https://uri.amap.com/search?keyword=${enc(p.name.zh.replace(/（.*?）/g, ""))}&city=${enc(city)}&callnative=1`;
}
