import { useMemo, useState } from 'react';
import {
  findSlot,
  placementsForDate,
  toIsoDate,
  weekDates,
  weekMonday,
} from '../../../data/pacing/pacingModel';
import {
  disruptPlacement,
  movePlacement,
  setTeacherPlacementStatus,
} from '../../../data/pacing/pacingStorage';
import { APP_GRID_CARD, APP_STATIC_BOARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Teacher week-at-a-glance: status, stretch/move, disruption, reinstate.
 */
export function WeekView({ theme, isDarkMode, store }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [anchor, setAnchor] = useState(() => weekMonday(toIsoDate(new Date())));
  const [reinstateId, setReinstateId] = useState('');
  const [reinstateDate, setReinstateDate] = useState(toIsoDate(new Date()));
  const [disruptId, setDisruptId] = useState('');
  const [disruptMinutes, setDisruptMinutes] = useState('45');

  const days = useMemo(() => weekDates(anchor), [anchor]);
  const blockOut = new Set(store.blockOutDates || []);

  const rolledCandidates = useMemo(() => {
    return (store.teacherPlacements || []).filter((p) => p.status === 'open');
  }, [store.teacherPlacements]);

  const fieldClass = `edu-control rounded-xl border-[1.5px] px-2 py-1.5 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Week at a glance
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Your reality path — stretch, swap days, or shrink for a fire drill.
              District path stays fixed.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                const d = new Date(
                  Number(anchor.slice(0, 4)),
                  Number(anchor.slice(5, 7)) - 1,
                  Number(anchor.slice(8, 10)),
                );
                d.setDate(d.getDate() - 7);
                setAnchor(weekMonday(toIsoDate(d)));
              }}
            >
              Prev
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => setAnchor(weekMonday(toIsoDate(new Date())))}
            >
              This week
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                const d = new Date(
                  Number(anchor.slice(0, 4)),
                  Number(anchor.slice(5, 7)) - 1,
                  Number(anchor.slice(8, 10)),
                );
                d.setDate(d.getDate() + 7);
                setAnchor(weekMonday(toIsoDate(d)));
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {days.map((iso, i) => {
          const blocked = blockOut.has(iso);
          const items = blocked ? [] : placementsForDate(store, iso);
          return (
            <div
              key={iso}
              className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-3 space-y-2 min-h-[180px]`}
            >
              <div>
                <p className={`${TYPE.bodyMd} font-medium ${theme.colorOnSurface}`}>
                  {DAY_LABELS[i]}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {iso.slice(5)}
                  {blocked ? ' · blocked' : ''}
                </p>
              </div>
              {items.length === 0 ? (
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {blocked ? 'District block-out' : 'No lessons'}
                </p>
              ) : (
                items.map((pl) => {
                  const found = findSlot(store, pl.pacingId, pl.slotId);
                  const title = found?.lesson?.title || 'Lesson';
                  const pacingTitle = found?.pacing?.title || '';
                  return (
                    <div
                      key={pl.id}
                      className={`rounded-lg border-[1.5px] p-2 space-y-1 ${theme.colorOutline}`}
                    >
                      <p
                        className={`${TYPE.bodySm} font-medium ${theme.colorOnSurface}`}
                      >
                        {title}
                      </p>
                      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        {pacingTitle} · {pl.minutesPlanned}m · {pl.status}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={`edu-control text-xs px-2 py-1 rounded-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                          onClick={() =>
                            setTeacherPlacementStatus(pl.id, 'done')
                          }
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          className={`edu-control text-xs px-2 py-1 rounded-lg ${toolBtn}`}
                          onClick={() =>
                            setTeacherPlacementStatus(pl.id, 'partial')
                          }
                        >
                          Partial
                        </button>
                        <button
                          type="button"
                          className={`edu-control text-xs px-2 py-1 rounded-lg ${toolBtn}`}
                          onClick={() => {
                            const next = days[i + 1] || days[i];
                            movePlacement(pl.id, next);
                          }}
                          title="Stretch to next day"
                        >
                          Stretch
                        </button>
                        <button
                          type="button"
                          className={`edu-control text-xs px-2 py-1 rounded-lg ${toolBtn}`}
                          onClick={() => {
                            setDisruptId(pl.id);
                            setDisruptMinutes(String(Math.min(45, pl.minutesPlanned)));
                          }}
                        >
                          Fire drill
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Reinstate a lesson
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Bring back a lesson that rolled forward when done was not selected.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="space-y-1 flex-1 min-w-[160px]">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Open lesson
            </span>
            <select
              className={`${fieldClass} w-full`}
              value={reinstateId}
              onChange={(e) => setReinstateId(e.target.value)}
            >
              <option value="">Select…</option>
              {rolledCandidates.map((pl) => {
                const found = findSlot(store, pl.pacingId, pl.slotId);
                return (
                  <option key={pl.id} value={pl.id}>
                    {found?.lesson?.title || pl.slotId} · {pl.date}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Place on
            </span>
            <input
              type="date"
              className={fieldClass}
              value={reinstateDate}
              onChange={(e) => setReinstateDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`edu-control rounded-xl px-3 py-2 ${TYPE.bodySm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            disabled={!reinstateId}
            onClick={() => {
              movePlacement(reinstateId, reinstateDate);
              setReinstateId('');
            }}
          >
            Reinstate
          </button>
        </div>
      </div>

      {disruptId ? (
        <div
          className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
        >
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            Disruption — minutes taught today
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="space-y-1">
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Minutes used
              </span>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={disruptMinutes}
                onChange={(e) => setDisruptMinutes(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.bodySm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={() => {
                disruptPlacement(disruptId, Number(disruptMinutes));
                setDisruptId('');
              }}
            >
              Apply
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => setDisruptId('')}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
