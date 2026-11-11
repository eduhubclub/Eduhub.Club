import { useId } from 'react';
import { shapePathData } from './shapeLibrary';

/**
 * Clip a square surface to a library shape (SVG path, object-bounding-box).
 * Prefer for badges, counts, and accents — not text-heavy containers.
 *
 * @param {object} props
 * @param {string} [props.shape='Circle'] — shape id (e.g. Cookie9Sided, SemiCircle)
 * @param {string} [props.className]
 * @param {import('react').CSSProperties} [props.style]
 * @param {import('react').ReactNode} props.children
 */
export function ShapeSurface({
  shape = 'Circle',
  className = '',
  style,
  children,
  ...props
}) {
  const uid = useId().replace(/:/g, '');
  const clipId = `edu-shape-${uid}`;
  const d = shapePathData(shape);

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`.trim()}
      style={{
        ...style,
        clipPath: `url(#${clipId})`,
        WebkitClipPath: `url(#${clipId})`,
      }}
      {...props}
    >
      <svg
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={d} />
          </clipPath>
        </defs>
      </svg>
      {children}
    </span>
  );
}
