import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import {
  addDaysIso,
  parseIsoDate,
  toIsoDate,
} from '../../data/calendar/calendarModel';
import { expandOccurrencesForRange } from '../../data/calendar/expandOccurrences';
import {
  readAcademic,
  readClosures,
  readEvents,
  readLayers,
} from '../../data/calendar/calendarStorage';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthGridStart(iso) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  first.setDate(first.getDate() - first.getDay());
  return toIsoDate(first);
}

function monthLabel(iso) {
  const d = parseIsoDate(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function shiftMonth(iso, dir) {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  d.setMonth(d.getMonth() + dir);
  return toIsoDate(d);
}

/**
 * Compact square month widget for Hub Dashboard.
 * Today = primary-filled day number; event days get a colored dot under the number.
 */
export function HubMiniCalendar({ isDarkMode, theme, onOpenCalendar }) {
  const { classes, selectedClass } = useClasses();
  const [cursor, setCursor] = useState(() => toIsoDate(new Date()));

  const todayIso = toIsoDate(new Date());
  const cursorDate = parseIsoDate(cursor);
  const viewMonth = cursorDate?.getMonth() ?? new Date().getMonth();
  const viewYear = cursorDate?.getFullYear() ?? new Date().getFullYear();

  const gridStart = monthGridStart(cursor);
  const gridEnd = addDaysIso(gridStart, 41);

  const classIds = useMemo(() => {
    if (selectedClass?.id != null) return [String(selectedClass.id)];
    return (classes || []).filter((c) => !c.isArchived).map((c) => String(c.id));
  }, [classes, selectedClass]);

  const classMetaById = useMemo(() => {
    const map = {};
    for (const c of classes || []) {
      map[String(c.id)] = { name: c.name };
    }
    return map;
  }, [classes]);

  const datesWithEvents = useMemo(() => {
    if (classIds.length === 0) return new Map();
    const rows = expandOccurrencesForRange({
      rangeStart: gridStart,
      rangeEnd: gridEnd,
      classIds,
      classMetaById,
      getAcademic: readAcademic,
      getClosures: readClosures,
      getLayers: readLayers,
      getEvents: readEvents,
    });
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.date)) map.set(row.date, row.color || null);
    }
    return map;
  }, [classIds, classMetaById, gridStart, gridEnd]);

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 42; i += 1) {
      out.push(addDaysIso(gridStart, i));
    }
    return out;
  }, [gridStart]);

  return (
    <div
      className={`w-full max-w-[280px] aspect-square flex flex-col ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex items-center gap-1 px-3 pt-3 pb-1 shrink-0">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setCursor((c) => shiftMonth(c, -1))}
          className={`edu-control p-1 rounded-lg ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onOpenCalendar?.()}
          className={`edu-control flex-1 min-w-0 text-center ${TYPE.labelLg} truncate ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
          title="Open Calendar"
        >
          {monthLabel(cursor)}
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor((c) => shiftMonth(c, 1))}
          className={`edu-control p-1 rounded-lg ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 px-2 shrink-0">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className={`text-center ${TYPE.labelMicro} py-1 ${theme.colorOnSurfaceVariant}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 px-2 pb-2 gap-0.5">
        {days.map((iso) => {
          const d = parseIsoDate(iso);
          const inMonth = d && d.getMonth() === viewMonth && d.getFullYear() === viewYear;
          const isToday = iso === todayIso;
          const eventColor = datesWithEvents.get(iso);
          const hasEvent = Boolean(eventColor);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onOpenCalendar?.()}
              className={`edu-control flex flex-col items-center justify-center rounded-lg min-h-0 ${
                !inMonth
                  ? isDarkMode
                    ? 'opacity-30'
                    : 'opacity-40'
                  : ''
              } ${
                isDarkMode
                  ? 'hover:bg-slate-800'
                  : 'hover:bg-slate-50'
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold leading-none ${
                  isToday
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                    : inMonth
                      ? theme.colorOnSurface
                      : theme.colorOnSurfaceVariant
                }`}
              >
                {d?.getDate()}
              </span>
              <span className="mt-0.5 flex h-1.5 items-center justify-center">
                {hasEvent ? (
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: eventColor || undefined }}
                    aria-hidden
                  />
                ) : (
                  <span className="block h-1.5 w-1.5" aria-hidden />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
