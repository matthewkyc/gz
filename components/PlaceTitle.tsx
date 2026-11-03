import type { ReactNode } from "react";

/**
 * A linked location with an optional thumbnail. The thumbnail is a fixed flex item;
 * the name, chips and chevron flow inline in a separate text column, so wrapped
 * lines align with the start of the name rather than the thumbnail.
 */
export default function PlaceTitle({ placeId, thumb, title, chips, flagged, onOpen }: {
  placeId: string;
  thumb?: string;
  title: ReactNode;
  chips?: ReactNode;
  flagged?: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <a
      href={`#place-${placeId}`}
      className={`place-link${thumb ? " pt" : ""}`}
      onClick={(e) => { e.preventDefault(); onOpen(placeId); }}
    >
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element -- local thumbnail
        <img className="pt-thumb" src={thumb} alt="" loading="lazy" decoding="async" />
      )}
      <span className="pt-text">
        <span className={`pt-name${flagged ? " flagged" : ""}`}>{title}</span>
        <span className="pt-tail">
          {chips}
          <i className="fa-solid fa-circle-chevron-right" aria-hidden />
        </span>
      </span>
    </a>
  );
}
