import { useEffect, useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { bestOnColor } from '../../../shared/colorContrast';
import {
  formatDayLabel,
  templateForDate,
} from '../../../data/schedule/scheduleModel';
import { todaySessionDayNumber } from '../../../data/schedule/dayNumber';
import { toIsoDate } from '../../../data/calendar/calendarModel';
import { isSessionDay } from '../../../data/calendar/sessionDays';
import { itemsForDay, newPlanId } from '../../../data/plan/planModel';
import {
  advancePlanDay,
  removePlanItem,
  updatePlanItemStatus,
  upsertPlanItem,
} from '../../../data/plan/planStorage';
import {
  addResourceFromUrl,
  getResource,
} from '../../../data/resources/resourceStorage';
import {
  CLOCK_FORMAT_UPDATED_EVENT,
  formatClockRange,
  readUseMilitaryTime,
} from '../../../data/settings/clockFormat';

/**
 * Today’s Day #N, slots, and planned resources — assign from here or Plan.
 */
export function TodayView({
  theme,
  isDarkMode,
  classId,
  schedule,
  academic,
  closures,
  plan,
  resources = [],
  refresh,
}) {
  const todayIso = toIsoDate(new Date());
  const isSession = isSessionDay(todayIso, academic, closures);
  const dayNum = todaySessionDayNumber(
    academic,
    closures,
    schedule.dayNumbering,
  );
  const template = templateForDate(schedule, todayIso);
  const dayItems = dayNum != null ? itemsForDay(plan, dayNum) : [];
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const label =
    dayNum != null
      ? formatDayLabel(dayNum, schedule.dayNumbering.labelPrefix)
      : null;

  const [addingSlotId, setAddingSlotId] = useState(null);
  const [pickResourceId, setPickResourceId] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [useMilitaryTime, setUseMilitaryTime] = useState(readUseMilitaryTime);

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

  const assignToSlot = (slot, resourceId, titleOverride = '') => {
    if (dayNum == null || !resourceId) return false;
    const res = resources.find((r) => r.id === resourceId) || getResource(classId, resourceId);
    upsertPlanItem(classId, {
      id: newPlanId(),
      dayNumber: dayNum,
      slotId: slot.id,
      periodId: schedule.mode === 'periods' ? slot.id : '',
      resourceIds: [resourceId],
      title: titleOverride.trim() || res?.title || slot.label,
      status: 'planned',
      source: 'teacher',
    });
    refresh();
    return true;
  };

  const onAddFromLibrary = (slot) => {
    setAddError('');
    if (dayNum == null) {
      setAddError('Set the academic year in Calendar so today has a Day #.');
      return;
    }
    if (!pickResourceId) {
      setAddError('Choose a resource from the library.');
      return;
    }
    assignToSlot(slot, pickResourceId);
    setPickResourceId('');
    setAddingSlotId(null);
  };

  const onAddFromUrl = (slot) => {
    setAddError('');
    if (dayNum == null) {
      setAddError('Set the academic year in Calendar so today has a Day #.');
      return;
    }
    if (!pasteUrl.trim()) {
      setAddError('Paste a link first.');
      return;
    }
    const before = new Set(resources.map((r) => r.id));
    const list = addResourceFromUrl(classId, pasteUrl.trim());
    const added = list.find((r) => !before.has(r.id)) || list[list.length - 1];
    if (!added) {
      setAddError('Could not parse that link.');
      return;
    }
    assignToSlot(slot, added.id, added.title);
    setPasteUrl('');
    setAddingSlotId(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          {label
            ? `Today is ${label}`
            : isSession
              ? 'Session day — set an academic year in Calendar to number days.'
              : 'Today is not a teaching day (weekend, break, or closure).'}
        </p>
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
          {todayIso}
          {schedule.mode === 'periods' ? ' · Periods mode' : ' · Day slots mode'}
          {template ? ` · ${template.name}` : ''}
        </p>
        <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
          Add links on a period below, or manage the full queue in Plan.
        </p>
        {!academic?.startDate ? (
          <p className={`${TYPE.bodySm} mt-3 ${theme.colorOnSurfaceVariant}`}>
            Open Calendar settings to set the academic year so Day #N can be
            calculated.
          </p>
        ) : null}
      </div>

      {template?.slots?.length ? (
        <div className="space-y-2">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            {schedule.mode === 'periods' ? 'Periods' : 'Lesson slots'}
          </p>
          <ul className="space-y-2">
            {template.slots.map((slot) => {
              const on = bestOnColor(slot.color);
              const slotItems = dayItems.filter(
                (i) => i.slotId === slot.id || i.periodId === slot.id,
              );
              const isAdding = addingSlotId === slot.id;
              return (
                <li
                  key={slot.id}
                  className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 space-y-3`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="edu-control shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: slot.color, color: on.hex }}
                      >
                        {slot.order + 1}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}
                        >
                          {slot.label}
                        </p>
                        {schedule.mode === 'periods' &&
                        (slot.startTime || slot.endTime) ? (
                          <p
                            className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                          >
                            {formatClockRange(slot.startTime, slot.endTime, {
                              useMilitaryTime,
                            })}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`edu-control ${toolBtn} shrink-0 self-start`}
                      disabled={dayNum == null}
                      onClick={() => {
                        setAddError('');
                        setPickResourceId('');
                        setPasteUrl('');
                        setAddingSlotId(isAdding ? null : slot.id);
                      }}
                    >
                      <Plus className="w-4 h-4" aria-hidden />
                      {isAdding ? 'Cancel' : 'Add'}
                    </button>
                  </div>

                  {slotItems.length ? (
                    <ul className="space-y-2 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
                      {slotItems.map((item) => {
                        const linked = item.resourceIds
                          .map((id) => getResource(classId, id))
                          .filter(Boolean);
                        return (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              {linked.length ? (
                                linked.map((r) => (
                                  <a
                                    key={r.id}
                                    href={r.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`edu-control inline-flex items-center gap-1.5 ${TYPE.bodySm} ${theme.colorPrimary}`}
                                  >
                                    <ExternalLink
                                      className="w-3.5 h-3.5"
                                      aria-hidden
                                    />
                                    {item.title || r.title}
                                  </a>
                                ))
                              ) : (
                                <span
                                  className={`${TYPE.bodySm} ${theme.colorOnSurface}`}
                                >
                                  {item.title || 'Lesson'}
                                </span>
                              )}
                              <span
                                className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                              >
                                ({item.status})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.status === 'planned' ? (
                                <button
                                  type="button"
                                  className={`edu-control ${toolBtn}`}
                                  onClick={() => {
                                    updatePlanItemStatus(
                                      classId,
                                      item.id,
                                      'done',
                                    );
                                    refresh();
                                  }}
                                >
                                  Done
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className={`edu-control ${toolBtn}`}
                                aria-label="Remove from period"
                                onClick={() => {
                                  removePlanItem(classId, item.id);
                                  refresh();
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      No resources assigned
                    </p>
                  )}

                  {isAdding ? (
                    <div
                      className={`rounded-xl border-[1.5px] p-3 space-y-3 ${theme.colorOutline} ${
                        isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50'
                      }`}
                    >
                      <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                        Add to {slot.label}
                        {label ? ` · ${label}` : ''}
                      </p>
                      <label className="block space-y-1">
                        <span
                          className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          From library
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            className={fieldClass}
                            value={pickResourceId}
                            onChange={(e) => setPickResourceId(e.target.value)}
                          >
                            <option value="">Select…</option>
                            {resources.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className={`edu-control ${toolBtn} shrink-0`}
                            disabled={!pickResourceId}
                            onClick={() => onAddFromLibrary(slot)}
                          >
                            Assign
                          </button>
                        </div>
                      </label>
                      <label className="block space-y-1">
                        <span
                          className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          Or paste a link
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            className={fieldClass}
                            placeholder="https://…"
                            value={pasteUrl}
                            onChange={(e) => setPasteUrl(e.target.value)}
                          />
                          <button
                            type="button"
                            className={`edu-control ${toolBtn} shrink-0`}
                            onClick={() => onAddFromUrl(slot)}
                          >
                            Add link
                          </button>
                        </div>
                      </label>
                      {!resources.length ? (
                        <p
                          className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          Library is empty — paste a URL above, or add links in
                          Planner.
                        </p>
                      ) : null}
                      {addError ? (
                        <p className={`${TYPE.bodySm} text-red-600`}>{addError}</p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {dayItems.some((i) => !i.slotId && !i.periodId) ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Whole-day items · {label || 'today'}
            </p>
            {dayNum != null ? (
              <button
                type="button"
                className={`edu-control ${toolBtn}`}
                onClick={() => {
                  advancePlanDay(classId, dayNum);
                  refresh();
                }}
              >
                Shift remaining +1 day
              </button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {dayItems
              .filter((i) => !i.slotId && !i.periodId)
              .map((item) => {
                const linked = item.resourceIds
                  .map((id) => getResource(classId, id))
                  .filter(Boolean);
                return (
                  <li
                    key={item.id}
                    className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 space-y-2`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                        {item.title || linked[0]?.title || 'Lesson'}
                        <span
                          className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          ({item.status})
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.status !== 'done' ? (
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
                            Skip & shift
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {linked.length ? (
                      <ul className="space-y-1">
                        {linked.map((r) => (
                          <li key={r.id}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`edu-control inline-flex items-center gap-1.5 ${TYPE.bodySm} ${theme.colorPrimary}`}
                            >
                              <ExternalLink
                                className="w-3.5 h-3.5"
                                aria-hidden
                              />
                              {r.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
