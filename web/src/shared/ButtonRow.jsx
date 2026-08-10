import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const ButtonRowCompactContext = createContext(false);

/** True when the toolbar collapsed to icons to avoid wrapping. */
export function useButtonRowCompact() {
  return useContext(ButtonRowCompactContext);
}

/**
 * Label text inside a ButtonRow tool button — hidden when the row goes icon-only.
 */
export function ButtonRowLabel({ children }) {
  const compact = useButtonRowCompact();
  if (compact) return null;
  return children;
}

function oneLineWidth(el) {
  const kids = [...el.children];
  if (!kids.length) return 0;
  const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 0;
  return (
    kids.reduce((sum, kid) => sum + kid.offsetWidth, 0) +
    gap * Math.max(0, kids.length - 1)
  );
}

function isWrapped(el) {
  const kids = [...el.children];
  if (kids.length < 2) return false;
  const top = kids[0].offsetTop;
  return kids.some((kid) => kid.offsetTop !== top);
}

/**
 * Standard toolbar row under PageHeader — tool buttons aligned end.
 * If children wrap to a second row, switches to icon-only (via ButtonRowLabel)
 * with room for `title` / aria-label hover explainers.
 */
export function ButtonRow({ children, className = '' }) {
  const ref = useRef(null);
  const neededWidthRef = useRef(0);
  const compactRef = useRef(false);
  const [compact, setCompact] = useState(false);
  compactRef.current = compact;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextCompact = compactRef.current
          ? el.clientWidth < neededWidthRef.current
          : isWrapped(el);

        if (!compactRef.current && nextCompact) {
          neededWidthRef.current = oneLineWidth(el);
          compactRef.current = true;
          setCompact(true);
          return;
        }

        if (compactRef.current && !nextCompact) {
          compactRef.current = false;
          setCompact(false);
        }
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <ButtonRowCompactContext.Provider value={compact}>
      <div
        ref={ref}
        className={`flex flex-wrap items-center justify-end gap-2 mb-4 ${
          compact ? '[&>button]:px-2.5 [&>button]:gap-0' : ''
        } ${className}`.trim()}
        data-button-row
        data-compact={compact ? 'true' : undefined}
      >
        {children}
      </div>
    </ButtonRowCompactContext.Provider>
  );
}
