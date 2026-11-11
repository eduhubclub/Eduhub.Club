import { useEffect, useMemo, useState } from 'react';
import {
  findSlot,
  placementsForDate,
  toIsoDate,
} from '../../../data/pacing/pacingModel';
import {
  getPendingCheckInDate,
  saveCheckIn,
} from '../../../data/pacing/pacingStorage';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';

/**
 * End-of-day / morning catch-up: "How did today go?"
 */
export function CheckInHost({ theme, isDarkMode, store, grade }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [date, setDate] = useState(null);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const pending = getPendingCheckInDate(store, grade);
    setDate(pending);
    if (pending) {
      const items = placementsForDate(store, pending);
      const init = {};
      for (const pl of items) init[pl.id] = 'open';
      setStatuses(init);
    }
  }, [store, grade]);

  const items = useMemo(
    () => (date ? placementsForDate(store, date) : []),
    [store, date],
  );

  if (!date) return null;

  const setStatus = (id, status) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const submit = () => {
    saveCheckIn(date, { statuses });
    setDate(null);
  };

  const isMorning = date < toIsoDate(new Date());

  return (
    <Modal
      isOpen
      onClose={() => setDate(null)}
      title="How did today go?"
      isDarkMode={isDarkMode}
      theme={theme}
      maxWidth="max-w-lg"
    >
      <div className="space-y-3 p-5 sm:p-6">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {isMorning
            ? `Morning catch-up for ${date}. Mark each lesson — unanswered lessons roll to the next day.`
            : `End of day ${date}. Mark each lesson — unanswered lessons roll to the next day.`}
        </p>
        {items.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
            No paced lessons on this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((pl) => {
              const found = findSlot(store, pl.pacingId, pl.slotId);
              const st = statuses[pl.id] || 'open';
              return (
                <li
                  key={pl.id}
                  className={`rounded-xl border-[1.5px] p-3 space-y-2 ${theme.colorOutline}`}
                >
                  <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                    {found?.lesson?.title || 'Lesson'}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {found?.pacing?.title} · {pl.minutesPlanned}m
                  </p>
                  <div className="flex flex-wrap gap-2" role="radiogroup">
                    {[
                      { id: 'done', label: 'Done' },
                      { id: 'partial', label: 'Partially done' },
                      { id: 'open', label: 'Not done' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={st === opt.id}
                        className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.bodySm} ${
                          st === opt.id
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : toolBtn
                        }`}
                        onClick={() => setStatus(pl.id, opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={toolBtn} onClick={() => setDate(null)}>
            Later
          </button>
          <button
            type="button"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.bodyMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={submit}
          >
            Save check-in
          </button>
        </div>
      </div>
    </Modal>
  );
}
