import { useMemo, useState } from 'react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { newPlanId } from '../../../data/plan/planModel';
import {
  removePlanItem,
  upsertPlanItem,
  updatePlanItemStatus,
  advancePlanDay,
} from '../../../data/plan/planStorage';
import { formatDayLabel, templateForDate } from '../../../data/schedule/scheduleModel';
import { toIsoDate } from '../../../data/calendar/calendarModel';

/**
 * Assign library resources to Day #N / slots.
 */
export function PlanView({
  theme,
  isDarkMode,
  classId,
  schedule,
  resources,
  plan,
  refresh,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const [dayNumber, setDayNumber] = useState(23);
  const [slotId, setSlotId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [title, setTitle] = useState('');

  const template = useMemo(
    () => templateForDate(schedule, toIsoDate(new Date())),
    [schedule],
  );
  const slots = template?.slots || [];

  const onAssign = () => {
    const n = Math.round(Number(dayNumber));
    if (!Number.isFinite(n) || n < 1) return;
    if (!resourceId) return;
    const res = resources.find((r) => r.id === resourceId);
    upsertPlanItem(classId, {
      id: newPlanId(),
      dayNumber: n,
      slotId: slotId || '',
      periodId: schedule.mode === 'periods' ? slotId || '' : '',
      resourceIds: [resourceId],
      title: title.trim() || res?.title || '',
      status: 'planned',
      source: 'teacher',
    });
    setTitle('');
    refresh();
  };

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of plan.items) {
      if (!map.has(item.dayNumber)) map.set(item.dayNumber, []);
      map.get(item.dayNumber).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [plan.items]);

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Assign to a day
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          You can also add links on a period from Schedule → Today.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Day #
            </span>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Slot (optional)
            </span>
            <select
              className={fieldClass}
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
            >
              <option value="">Whole day</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Resource
            </span>
            <select
              className={fieldClass}
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            >
              <option value="">Select…</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Title override
            </span>
            <input
              className={fieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>
        <button
          type="button"
          className={`edu-control ${toolBtn}`}
          disabled={!resourceId}
          onClick={onAssign}
        >
          Add to plan
        </button>
        {!resources.length ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Add links under Resources or Cloud pick first.
          </p>
        ) : null}
      </div>

      <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
        Curriculum queue
      </p>
      {!grouped.length ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Nothing planned yet. Assign a resource to Day #23 (or any day).
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {formatDayLabel(day, schedule.dayNumbering.labelPrefix)}
                </p>
                <button
                  type="button"
                  className={`edu-control ${toolBtn}`}
                  onClick={() => {
                    advancePlanDay(classId, day);
                    refresh();
                  }}
                >
                  Shift day +1
                </button>
              </div>
              <ul className="space-y-2">
                {items.map((item) => {
                  const slot = slots.find(
                    (s) => s.id === item.slotId || s.id === item.periodId,
                  );
                  return (
                    <li
                      key={item.id}
                      className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 flex flex-wrap items-center justify-between gap-2`}
                    >
                      <div className="min-w-0">
                        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                          {item.title || 'Lesson'}
                        </p>
                        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                          {item.status}
                          {slot ? ` · ${slot.label}` : ''}
                          {item.source === 'district' ? ' · district' : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'planned' ? (
                          <button
                            type="button"
                            className={`edu-control ${toolBtn}`}
                            onClick={() => {
                              updatePlanItemStatus(classId, item.id, 'done');
                              refresh();
                            }}
                          >
                            Done
                          </button>
                        ) : null}
                        {item.status === 'planned' ? (
                          <button
                            type="button"
                            className={`edu-control ${toolBtn}`}
                            onClick={() => {
                              updatePlanItemStatus(classId, item.id, 'skipped', {
                                shiftRemaining: true,
                              });
                              refresh();
                            }}
                          >
                            Not done → shift
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`edu-control ${toolBtn}`}
                          onClick={() => {
                            removePlanItem(classId, item.id);
                            refresh();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
