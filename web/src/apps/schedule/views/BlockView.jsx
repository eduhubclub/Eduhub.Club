import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  APP_BOARD_CHROME,
  APP_BOARD_BODY_SCROLL,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { bestOnColor } from '../../../shared/colorContrast';
import { addDaysIso, toIsoDate } from '../../../data/calendar/calendarModel';
import {
  buildWeekBlockLayout,
  minutesToTimeLabel,
  weekDayIsos,
} from '../../../data/schedule/blockViewLogic';
import {
  CLOCK_FORMAT_UPDATED_EVENT,
  readUseMilitaryTime,
} from '../../../data/settings/clockFormat';

const TIME_COL_W = 64;

/**
 * Week block grid — times on the left, Mon–Fri across the top.
 */
export function BlockView({ theme, isDarkMode, schedule }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [focusIso, setFocusIso] = useState(() => toIsoDate(new Date()));
  const [useMilitaryTime, setUseMilitaryTime] = useState(readUseMilitaryTime);
  const todayIso = toIsoDate(new Date());

  useEffect(() => {
    const onFmt = (e) => {
      setUseMilitaryTime(
        e?.detail?.useMilitaryTime != null
          ? Boolean(e.detail.useMilitaryTime)
          : readUseMilitaryTime(),
      );
    };
    window.addEventListener(CLOCK_FORMAT_UPDATED_EVENT, onFmt);
    return () => window.removeEventListener(CLOCK_FORMAT_UPDATED_EVENT, onFmt);
  }, []);

  const clockOpts = useMemo(() => ({ useMilitaryTime }), [useMilitaryTime]);

  const dayIsos = useMemo(() => weekDayIsos(focusIso, 5), [focusIso]);
  const layout = useMemo(
    () => buildWeekBlockLayout(schedule, dayIsos),
    [schedule, dayIsos],
  );

  const weekLabel = useMemo(() => {
    const start = dayIsos[0];
    const end = dayIsos[dayIsos.length - 1];
    const a = new Date(`${start}T12:00:00`);
    const b = new Date(`${end}T12:00:00`);
    const opts = { month: 'short', day: 'numeric' };
    return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, {
      ...opts,
      year: 'numeric',
    })}`;
  }, [dayIsos]);

  const hasBlocks = layout.days.some((d) => d.blocks.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`edu-control ${toolBtn}`}
          aria-label="Previous week"
          onClick={() => setFocusIso(addDaysIso(focusIso, -7))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`edu-control ${toolBtn}`}
          onClick={() => setFocusIso(toIsoDate(new Date()))}
        >
          This week
        </button>
        <button
          type="button"
          className={`edu-control ${toolBtn}`}
          aria-label="Next week"
          onClick={() => setFocusIso(addDaysIso(focusIso, 7))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface} ml-1`}>
          {weekLabel}
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant} ml-auto`}>
          {schedule.mode === 'periods'
            ? 'Timed periods by weekday template'
            : 'Day slots laid out by order'}
        </p>
      </div>

      {!hasBlocks ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Add slots in Day shape to see them on the week grid.
        </p>
      ) : (
        <div
          className={`${APP_BOARD_CHROME} ${APP_BOARD_BODY_SCROLL} ${theme.colorSurface} ${theme.colorOutline} max-h-[min(85dvh,1400px)] overflow-auto`}
        >
          {/* Sticky day headers */}
          <div
            className={`sticky top-0 z-10 grid border-b-[1.5px] ${theme.colorOutline} ${theme.colorSurface}`}
            style={{
              gridTemplateColumns: `${TIME_COL_W}px repeat(${layout.days.length}, minmax(0, 1fr))`,
            }}
          >
            <div className={`border-r-[1.5px] ${theme.colorOutline}`} />
            {layout.days.map((day) => {
              const isToday = day.iso === todayIso;
              return (
                <div
                  key={day.iso}
                  className={`px-2 py-2 text-center border-r-[1.5px] last:border-r-0 ${theme.colorOutline}`}
                >
                  <p
                    className={`${TYPE.labelMd} ${
                      isToday ? theme.colorPrimary : theme.colorOnSurface
                    }`}
                  >
                    {day.label}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {day.dateLabel}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `${TIME_COL_W}px repeat(${layout.days.length}, minmax(0, 1fr))`,
              height: layout.heightPx,
            }}
          >
            {/* Time gutter */}
            <div
              className={`relative border-r-[1.5px] ${theme.colorOutline}`}
              style={{ height: layout.heightPx }}
            >
              {layout.hourMarks.map((mark) => {
                const top =
                  ((mark - layout.rangeStart) / layout.totalMin) *
                  layout.heightPx;
                return (
                  <div
                    key={mark}
                    className="absolute right-1 -translate-y-1/2"
                    style={{ top }}
                  >
                    <span
                      className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant} tabular-nums`}
                    >
                      {minutesToTimeLabel(mark, clockOpts)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {layout.days.map((day) => {
              const isToday = day.iso === todayIso;
              return (
                <div
                  key={day.iso}
                  className={`relative border-r-[1.5px] last:border-r-0 ${theme.colorOutline} ${
                    isToday
                      ? isDarkMode
                        ? 'bg-indigo-950/20'
                        : 'bg-indigo-50/40'
                      : ''
                  }`}
                  style={{ height: layout.heightPx }}
                >
                  {layout.hourMarks.map((mark) => {
                    const top =
                      ((mark - layout.rangeStart) / layout.totalMin) *
                      layout.heightPx;
                    return (
                      <div
                        key={mark}
                        className={`absolute left-0 right-0 border-t ${
                          isDarkMode ? 'border-slate-700/80' : 'border-slate-200'
                        }`}
                        style={{ top }}
                        aria-hidden
                      />
                    );
                  })}

                  {day.blocks.map((block) => {
                    // Exact time geometry — no min-height floor (that caused overlap).
                    // Scale comes from layout.pxPerMin so short blocks stay readable.
                    const slotTop =
                      ((block.startMin - layout.rangeStart) / layout.totalMin) *
                      layout.heightPx;
                    const slotHeight =
                      ((block.endMin - block.startMin) / layout.totalMin) *
                      layout.heightPx;
                    const gap = 2;
                    const top = slotTop + gap / 2;
                    const height = Math.max(2, slotHeight - gap);
                    const on = bestOnColor(block.color || '#6366f1');
                    const timeRange = [
                      minutesToTimeLabel(block.startMin, clockOpts),
                      minutesToTimeLabel(block.endMin, clockOpts),
                    ]
                      .filter(Boolean)
                      .join(' – ');
                    const showStackedTime = height >= 40;
                    return (
                      <div
                        key={block.id}
                        className="absolute left-1 right-1 overflow-hidden rounded-md px-2 py-0.5 shadow-sm flex flex-col justify-center"
                        style={{
                          top,
                          height,
                          zIndex: 1,
                          backgroundColor: block.color || '#6366f1',
                          color: on.hex,
                        }}
                        title={`${block.label} · ${timeRange}`}
                      >
                        {showStackedTime ? (
                          <>
                            <p className="truncate text-xs font-semibold leading-tight">
                              {block.label}
                            </p>
                            <p className="truncate text-[11px] leading-tight opacity-90">
                              {timeRange}
                            </p>
                          </>
                        ) : (
                          <p className="truncate text-[11px] font-semibold leading-tight">
                            {block.label}
                            {timeRange ? (
                              <span className="font-normal opacity-90">
                                {' '}
                                · {timeRange}
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
