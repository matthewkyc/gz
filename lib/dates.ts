const TRIP_START_YEAR = 2026;
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_EN_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DOW_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** "12月21日" → "2026-12-21" (January onwards rolls into the next year). */
export function isoFromZh(date: string): string {
  const m = date.match(/(\d+)月(\d+)日/);
  if (!m) throw new Error(`Unparseable date: ${date}`);
  const month = +m[1], day = +m[2];
  const year = month >= 12 ? TRIP_START_YEAR : TRIP_START_YEAR + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parts(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return {
    year: y, month: mo, day: d,
    dowEn: DOW_EN[dow], dowZh: DOW_ZH[dow],
    monthEn: MONTHS_EN[mo - 1], monthEnLong: MONTHS_EN_LONG[mo - 1],
  };
}

/** Local "today" as ISO, for highlighting the current trip day. */
export function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
