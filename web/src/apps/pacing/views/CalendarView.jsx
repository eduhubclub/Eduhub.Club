import { useMemo, useState } from 'react';
import {
  findSlot,
  placementsForDate,
  toIsoDate,
} from '../../../data/pacing/pacingModel';
import {
  addBlockOut,
  removeBlockOut,
} from '../../../data/pacing/pacingStorage';
import { APP_GRID_CARD, APP_STATIC_BOARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';

function monthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(toIsoDate(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Month calendar: district + teacher placements, block-out days.
 */
export function CalendarView({ theme, isDarkMode, store }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(toIsoDate(now));

  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const blockOut = new Set(store.blockOutDates || []);
  const selectedItems = placementsForDate(store, selected);
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Pacing calendar
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              District placements with teacher overrides. Block-outs shift the
              shared path forward.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={toolBtn} onClick={() => shiftMonth(-1)}>
              Prev
            </button>
            <span className={`${TYPE.bodyMd} ${theme.colorOnSurface} px-2 py-1`}>
              {monthLabel}
            </span>
            <button type="button" className={toolBtn} onClick={() => shiftMonth(1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-3 sm:p-4`}
      >
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className={`text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, idx) => {
            if (!iso) {
              return <div key={`e-${idx}`} className="min-h-[64px]" />;
            }
            const items = placementsForDate(store, iso);
            const blocked = blockOut.has(iso);
            const isSelected = iso === selected;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`edu-control min-h-[64px] rounded-xl border-[1.5px] p-1.5 text-left ${
                  isSelected
                    ? `${theme.colorPrimaryContainer || theme.colorPrimary} ${theme.colorOnPrimaryContainer || theme.colorOnPrimary}`
                    : `${theme.colorOutline} ${theme.colorSurface}`
                }`}
              >
                <span className={`${TYPE.bodySm} font-medium`}>
                  {iso.slice(8)}
                </span>
                {blocked ? (
                  <span className={`block ${TYPE.bodySm} opacity-80`}>Block</span>
                ) : items.length ? (
                  <span className={`block ${TYPE.bodySm} opacity-80`}>
                    {items.length} lesson{items.length === 1 ? '' : 's'}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            {selected}
          </p>
          {blockOut.has(selected) ? (
            <button
              type="button"
              className={toolBtn}
              onClick={() => removeBlockOut(selected)}
            >
              Remove block-out
            </button>
          ) : (
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.bodySm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={() => addBlockOut(selected)}
            >
              Block out day
            </button>
          )}
        </div>
        {selectedItems.length === 0 ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No lessons on this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedItems.map((pl) => {
              const found = findSlot(store, pl.pacingId, pl.slotId);
              return (
                <li
                  key={pl.id}
                  className={`rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutline}`}
                >
                  <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                    {found?.lesson?.title || 'Lesson'}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {found?.pacing?.title} · {pl.source} · {pl.status} ·{' '}
                    {pl.minutesPlanned}m
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
