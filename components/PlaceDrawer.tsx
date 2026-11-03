"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLang } from "@/lib/i18n";
import { amapSearch, appleDirections, googleDirections, googleEmbed } from "@/lib/maps";
import type { Place, T } from "@/lib/types";
import { KIND_ICON } from "./Timeline";

gsap.registerPlugin(useGSAP);

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 900px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

interface Props { place?: Place; from?: Place; how?: T; onClose: () => void }

export default function PlaceDrawer({ place, from, how, onClose }: Props) {
  const wide = useWide();
  const drag = useDragControls();

  useEffect(() => {
    if (!place) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [place, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          className="scrim"
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        />
      )}
      {place && (
        <motion.aside
          key={`sheet-${place.id}`}
          className={`sheet${wide ? " sheet-side" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={place.name.en}
          initial={wide ? { x: "100%" } : { y: "100%" }}
          animate={wide ? { x: 0 } : { y: 0 }}
          exit={wide ? { x: "100%" } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40, mass: 0.9 }}
          drag={wide ? false : "y"}
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
        >
          <SheetBody place={place} from={from} how={how} onClose={onClose} onHandle={(e) => drag.start(e)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={`fa-solid ${rating >= n ? "fa-star" : rating >= n - 0.5 ? "fa-star-half-stroke" : "fa-star empty"}`} aria-hidden />
      ))}
    </span>
  );
}

function SheetBody({ place, from, how, onClose, onHandle }: Props & { place: Place; onHandle: (e: React.PointerEvent) => void }) {
  const { lang, t, ui } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const [mapOn, setMapOn] = useState(false);
  const isFood = place.kind === "food";
  const other = lang === "en" ? place.name.zh : place.name.en;

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".hero-img", { scale: 1.12, duration: 1.1, ease: "power2.out" });
      gsap.from(".reveal", { y: 22, opacity: 0, stagger: 0.07, duration: 0.6, ease: "power3.out", delay: 0.12 });
    });
    return () => mm.revert();
  }, { scope: root });

  const list = (x?: { en: string[]; zh: string[] }) => (x ? x[lang]?.length ? x[lang] : x.zh : []);

  return (
    <div className="sheet-inner" ref={root}>
      <div className="hero" onPointerDown={onHandle}>
        <span className="handle" aria-hidden />
        {place.image && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element -- local photo, sized by CSS
          <img className="hero-img" src={place.image} alt={place.name.en} onError={() => setImgOk(false)} draggable={false} />
        ) : (
          <div className="hero-img hero-fallback"><i className={`fa-solid ${KIND_ICON[place.kind]}`} aria-hidden /></div>
        )}
        <div className="hero-shade" />
        <button type="button" className="close" onClick={onClose} aria-label={ui("close")}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>
        <div className="hero-text">
          <span className="kind"><i className={`fa-solid ${KIND_ICON[place.kind]}`} aria-hidden />{ui(`kind_${place.kind}`)}{place.city ? ` · ${place.city}` : ""}</span>
          <h2>{t(place.name)}</h2>
          {other && other !== t(place.name) && <p className="hero-alt">{other}</p>}
        </div>
      </div>

      <div className="sheet-body">
        {place.rating != null && (
          <div className="rating reveal">
            <span className="rating-num">{place.rating.toFixed(1)}</span>
            <Stars rating={place.rating} />
            {place.reviewCount != null && (
              <span className="rating-count">{place.reviewCount.toLocaleString()} {ui("reviewsOn")}</span>
            )}
          </div>
        )}

        {place.summary && <p className="lead reveal">{t(place.summary)}</p>}

        {place.why && (
          <section className="block reveal">
            <h3><i className="fa-solid fa-heart" aria-hidden />{ui(isFood ? "whyEat" : "whyGo")}</h3>
            <p>{t(place.why)}</p>
          </section>
        )}

        {list(place.mustTry).length > 0 && (
          <section className="block reveal">
            <h3><i className="fa-solid fa-bowl-food" aria-hidden />{ui("mustTry")}</h3>
            <ul className="musttry">{list(place.mustTry).map((d, i) => <li key={i}>{d}</li>)}</ul>
          </section>
        )}

        {list(place.highlights).length > 0 && (
          <section className="block reveal">
            <h3><i className="fa-solid fa-wand-magic-sparkles" aria-hidden />{ui("highlights")}</h3>
            <ul className="checks">
              {list(place.highlights).map((h, i) => <li key={i}><i className="fa-solid fa-circle-check" aria-hidden />{h}</li>)}
            </ul>
          </section>
        )}

        {place.reviews && place.reviews.length > 0 && (
          <section className="block reveal">
            <h3><i className="fa-solid fa-comment-dots" aria-hidden />{ui("reviews")}</h3>
            <ul className="reviews">
              {place.reviews.map((r, i) => (
                <li key={i} className="review">
                  {r.rating != null && <Stars rating={r.rating} />}
                  <blockquote>{r.text}</blockquote>
                  <cite>{r.author}{r.when ? ` · ${r.when}` : ""}</cite>
                </li>
              ))}
            </ul>
            <p className="fine">{ui("reviewsSource")}</p>
          </section>
        )}

        <section className="block reveal">
          <h3><i className="fa-solid fa-route" aria-hidden />{ui("gettingThere")}</h3>
          <div className="journey">
            {from && (
              <div className="leg">
                <span className="leg-dot" />
                <span><small>{ui("from")}</small>{t(from.name)}</span>
              </div>
            )}
            <div className="leg leg-to">
              <span className="leg-dot" />
              <span><small>{lang === "en" ? "To" : "到"}</small>{t(place.name)}</span>
            </div>
          </div>
          {how && (
            <p className="how"><b>{ui("itineraryNote")}</b>{t(how)}</p>
          )}
          <div className="mapframe">
            {mapOn ? (
              <iframe
                title="Map"
                src={googleEmbed(place, from)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <button type="button" className="map-load" onClick={() => setMapOn(true)}>
                <i className="fa-solid fa-map-location-dot" aria-hidden />
                <span>{lang === "en" ? (from ? "Show route on map" : "Show on map") : (from ? "在地图上显示路线" : "在地图上显示")}</span>
              </button>
            )}
          </div>
          <div className="navbtns">
            <a className="navbtn primary" href={amapSearch(place)} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-location-arrow" aria-hidden />{ui("amap")}
            </a>
            <a className="navbtn" href={googleDirections(place, from)} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-google" aria-hidden />{ui("google")}
            </a>
            <a className="navbtn" href={appleDirections(place, from)} target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-apple" aria-hidden />{ui("apple")}
            </a>
          </div>
          <p className="fine">{ui("vpnNote")}</p>
        </section>

        {place.tips && (
          <section className="block reveal">
            <h3><i className="fa-solid fa-lightbulb" aria-hidden />{ui("tips")}</h3>
            <p>{t(place.tips)}</p>
          </section>
        )}

        {place.imageCredit && <p className="fine credit">{ui("photo")}: {place.imageCredit}</p>}
      </div>
    </div>
  );
}
