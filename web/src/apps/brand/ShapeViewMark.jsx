/**
 * HubBrand page art — Shape View composition (circle · triangle · square).
 * Sourced from SVG/HubBrand/Shape View.svg; brand colors match logo glyphs.
 */
export function ShapeViewMark({ className = 'h-24 w-auto' }) {
  return (
    <svg
      viewBox="0 0 133.49 158.27"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle
        cx="33.34"
        cy="33.34"
        r="33.34"
        className="fill-rose-500"
      />
      <path
        d="M93.16,24.47l-25.39,43.97c-3.08,5.33.77,12,6.93,12h50.78c6.16,0,10.01-6.67,6.93-12l-25.39-43.97c-3.08-5.33-10.78-5.33-13.86,0Z"
        className="fill-amber-500"
      />
      <rect
        x="17.29"
        y="91.58"
        width="66.69"
        height="66.69"
        rx="8"
        ry="8"
        className="fill-emerald-500"
      />
    </svg>
  );
}
