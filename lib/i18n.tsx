"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang, T } from "./types";

const UI = {
  tripDay: { en: "Day", zh: "第" },
  of: { en: "of", zh: "/" },
  flexible: { en: "Flexible", zh: "待定" },
  optional: { en: "Optional", zh: "可选" },
  tip: { en: "Tip", zh: "温馨提示" },
  restaurants: { en: "Where to eat", zh: "餐厅选择" },
  restaurant: { en: "Where to eat", zh: "餐厅" },
  mustOrder: { en: "Must try", zh: "必试" },
  backup: { en: "Backup plan", zh: "备案" },
  prevDay: { en: "Previous day", zh: "前一天" },
  nextDay: { en: "Next day", zh: "后一天" },
  language: { en: "切换到中文", zh: "Switch to English" },
  close: { en: "Close", zh: "关闭" },
  whyGo: { en: "Why go", zh: "为什么值得去" },
  whyEat: { en: "Why eat here", zh: "为什么值得吃" },
  highlights: { en: "Highlights", zh: "亮点" },
  mustTry: { en: "Must try", zh: "必试" },
  reviews: { en: "What visitors say", zh: "网友评价" },
  reviewsSource: { en: "From Google Maps reviews", zh: "来自 Google 地图评价" },
  gettingThere: { en: "Getting there", zh: "怎么去" },
  from: { en: "From", zh: "从" },
  itineraryNote: { en: "Per the itinerary", zh: "行程安排" },
  google: { en: "Google", zh: "Google" },
  apple: { en: "Apple", zh: "苹果地图" },
  amap: { en: "Amap", zh: "高德" },
  vpnNote: {
    en: "Google Maps is blocked in mainland China without a VPN. Amap is recommended there.",
    zh: "内地使用 Google 地图需要 VPN，建议用高德地图导航。",
  },
  tips: { en: "Good to know", zh: "小贴士" },
  reviewsOn: { en: "Google reviews", zh: "条 Google 评价" },
  photo: { en: "Photo", zh: "图片" },
  kind_sight: { en: "Sight", zh: "景点" },
  kind_food: { en: "Food", zh: "美食" },
  kind_shop: { en: "Shopping", zh: "购物" },
  kind_show: { en: "Show", zh: "演出" },
  kind_ride: { en: "Ride", zh: "游乐" },
  kind_transit: { en: "Transit", zh: "交通" },
  kind_hotel: { en: "Hotel", zh: "住宿" },
  swipeHint: { en: "Swipe for the next day", zh: "左右滑动切换日期" },
  places: { en: "places", zh: "个地点" },
  chooseOne: { en: "Choose one", zh: "二选一" },
  menu: { en: "Menu", zh: "菜单" },
  jumpTo: { en: "Jump to district", zh: "跳到区域" },
  daysTitle: { en: "Days", zh: "每日行程" },
  daysSub: { en: "Jump to any day of the trip", zh: "跳到任意一天" },
  hotelsTitle: { en: "Hotels & Taxi Cards", zh: "酒店·给司机看" },
  hotelsSub: { en: "Addresses in Chinese for drivers", zh: "中文地址，直接给司机看" },
  openMenu: { en: "Open menu", zh: "打开菜单" },
  jumpToDay: { en: "Jump to day", zh: "跳到某一天" },
  hotels: { en: "Hotels", zh: "酒店" },
  showDriver: { en: "Show the taxi driver", zh: "给司机看" },
  copyAddress: { en: "Copy", zh: "复制" },
  copied: { en: "Copied", zh: "已复制" },
  call: { en: "Call", zh: "电话" },
  hotelNote: {
    en: "Addresses are from Google Maps; they should be checked against the booking confirmations.",
    zh: "地址来自 Google 地图，请以订房确认信为准。",
  },
} satisfies Record<string, T>;
export type UIKey = keyof typeof UI;

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (x?: T) => string; ui: (k: UIKey) => string }
const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "gz-trip-lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved preference after SSR
      if (saved === "zh" || saved === "en") setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);
  const t = useCallback((x?: T) => (x ? x[lang] || x.zh : ""), [lang]);
  const ui = useCallback((k: UIKey) => UI[k][lang], [lang]);
  return <LangContext.Provider value={{ lang, setLang, t, ui }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const c = useContext(LangContext);
  if (!c) throw new Error("useLang outside LangProvider");
  return c;
}
