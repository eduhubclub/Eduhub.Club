import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD } from '../../../shared/layout';
import { STATUS_META } from '../attendanceState';

function buildCountItems(counts) {
  return [
    { key: 'present', label: STATUS_META.present.label, value: counts.present },
    { key: 'tardy', label: STATUS_META.tardy.label, value: counts.tardy },
    { key: 'absent', label: STATUS_META.absent.label, value: counts.absent },
    { key: 'excused', label: STATUS_META.excused.label, value: counts.excused },
    {
      key: 'unmarked',
      label: 'Unmarked',
      value: counts.unmarked,
      muted: true,
    },
  ];
}

function CountsRow({ items, isDarkMode, theme, className = '' }) {
  return (
    <div
      className={`flex h-8 flex-nowrap items-stretch whitespace-nowrap ${className}`.trim()}
    >
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? (
            <span
              aria-hidden
              className={`mx-1 w-[1.5px] shrink-0 self-stretch rounded-full ${
                isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            />
          ) : null}
          <span
            className={`inline-flex shrink-0 items-center gap-1 px-2.5 ${TYPE.labelMd} ${
              item.muted ? theme.colorOnSurfaceVariant : theme.colorOnSurface
            }`}
          >
            {item.label}: <strong className="tabular-nums">{item.value}</strong>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Attendance status totals — full row when space allows, dropdown when narrow.
 * Never scrolls horizontally.
 */
export function AttendanceCountsCard({ counts, theme, isDarkMode }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const menuRef = useRef(null);
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const items = buildCountItems(counts);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const update = () => {
      const next = measure.scrollWidth > wrap.clientWidth - 32;
      setCompact((prev) => (prev === next ? prev : next));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [counts]);

  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const summary = `Present ${counts.present} · Tardy ${counts.tardy} · Absent ${counts.absent}`;

  return (
    <div
      ref={wrapRef}
      className={`relative flex min-w-0 flex-1 items-center overflow-hidden ${APP_GRID_CARD} px-4 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] top-0 opacity-0"
      >
        <CountsRow items={items} isDarkMode={isDarkMode} theme={theme} />
      </div>

      {compact ? (
        <div className="relative w-full min-w-0" ref={menuRef}>
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => setOpen((v) => !v)}
            className={`edu-control flex w-full min-w-0 items-center gap-2 rounded-xl px-1 py-0.5 text-left ${TYPE.labelMd} ${theme.colorOnSurface}`}
          >
            <span className="min-w-0 flex-1 truncate">{summary}</span>
            <ChevronDown
              size={16}
              strokeWidth={2.25}
              className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${theme.colorOnSurfaceVariant}`}
            />
          </button>
          {open ? (
            <div
              role="listbox"
              className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border-[1.5px] py-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
            >
              {items.map((item) => (
                <div
                  key={item.key}
                  role="option"
                  aria-selected={false}
                  className={`flex items-center justify-between gap-4 px-4 py-2.5 ${TYPE.labelMd} ${
                    item.muted ? theme.colorOnSurfaceVariant : theme.colorOnSurface
                  }`}
                >
                  <span>{item.label}</span>
                  <strong className="tabular-nums">{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <CountsRow items={items} isDarkMode={isDarkMode} theme={theme} />
      )}
    </div>
  );
}
