import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { APP_GRID_CARD, appFabClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { bestOnColor } from '../../../shared/colorContrast';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import {
  newScheduleId,
  normalizeSlot,
  normalizeTemplate,
  SCHEDULE_SWATCHES,
} from '../../../data/schedule/scheduleModel';

/** JS getDay(): 0 = Sun … 6 = Sat */
const WEEKDAYS = [
  { id: 1, short: 'Mon', label: 'Monday' },
  { id: 2, short: 'Tue', label: 'Tuesday' },
  { id: 3, short: 'Wed', label: 'Wednesday' },
  { id: 4, short: 'Thu', label: 'Thursday' },
  { id: 5, short: 'Fri', label: 'Friday' },
  { id: 6, short: 'Sat', label: 'Saturday' },
  { id: 0, short: 'Sun', label: 'Sunday' },
];

function daysForTemplate(schedule, templateId) {
  const out = [];
  const map = schedule.weekdayTemplateIds || {};
  for (const [day, id] of Object.entries(map)) {
    if (id === templateId) out.push(Number(day));
  }
  return out.sort((a, b) => {
    const rank = (d) => (d === 0 ? 7 : d);
    return rank(a) - rank(b);
  });
}

function dayChipsLabel(dayIds) {
  if (!dayIds.length) return 'No days assigned';
  const set = new Set(dayIds);
  const ordered = WEEKDAYS.filter((d) => set.has(d.id));
  if (
    ordered.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => set.has(d))
  ) {
    return 'Weekdays';
  }
  if (ordered.length === 2 && set.has(0) && set.has(6)) return 'Weekend';
  return ordered.map((d) => d.short).join(', ');
}

function SlotColorControl({
  color,
  onChange,
  theme,
  isDarkMode,
  label = 'Slot color',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const hex = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : SCHEDULE_SWATCHES[0];
  const on = bestOnColor(hex);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="edu-control h-9 w-9 rounded-lg border-[1.5px] border-black/10 shadow-sm"
        style={{ backgroundColor: hex, color: on.hex }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        title="Color"
      />
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute left-0 top-full z-30 mt-2 w-52 rounded-xl border-[1.5px] p-3 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.labelMd} mb-2 ${theme.colorOnSurface}`}>
            Color
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SCHEDULE_SWATCHES.map((swatch) => {
              const selected = swatch.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={swatch}
                  type="button"
                  className={`edu-control h-8 w-8 rounded-lg border-[1.5px] ${
                    selected
                      ? isDarkMode
                        ? 'border-white ring-2 ring-white/40'
                        : 'border-slate-900 ring-2 ring-slate-900/20'
                      : 'border-black/10'
                  }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Use ${swatch}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(swatch);
                    setOpen(false);
                  }}
                />
              );
            })}
          </div>
          <label className="mt-3 flex items-center justify-between gap-2">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Custom
            </span>
            <input
              type="color"
              value={hex}
              onChange={(e) => onChange(e.target.value)}
              className="edu-control h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              aria-label="Custom color"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Edit day templates / presets with weekday assignment. FAB creates a new preset.
 */
export function TemplatesView({
  theme,
  isDarkMode,
  schedule,
  saveSchedule,
  isLeft = true,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [activeTemplateId, setActiveTemplateId] = useState(
    () => schedule.templates[0]?.id || '',
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDays, setDraftDays] = useState([1, 2, 3, 4, 5]);
  const [draftMode, setDraftMode] = useState('periods');

  useEffect(() => {
    if (!schedule.templates.some((t) => t.id === activeTemplateId)) {
      setActiveTemplateId(schedule.templates[0]?.id || '');
    }
  }, [schedule.templates, activeTemplateId]);

  const template =
    schedule.templates.find((t) => t.id === activeTemplateId) ||
    schedule.templates[0];
  const isPeriods = schedule.mode === 'periods';
  const assignedDays = template ? daysForTemplate(schedule, template.id) : [];

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const saveWeekdayMap = (weekdayTemplateIds, templates = schedule.templates) => {
    saveSchedule({
      ...schedule,
      templates,
      weekdayTemplateIds,
      source: 'teacher',
    });
  };

  const patchTemplate = (partial) => {
    if (!template) return;
    const templates = schedule.templates.map((t) =>
      t.id === template.id ? { ...t, ...partial } : t,
    );
    saveSchedule({ ...schedule, templates, source: 'teacher' });
  };

  /** Assign / clear weekdays for the active preset (one preset per day). */
  const toggleDay = (dayId) => {
    if (!template) return;
    const map = { ...(schedule.weekdayTemplateIds || {}) };
    const key = String(dayId);
    if (map[key] === template.id) {
      delete map[key];
    } else {
      map[key] = template.id;
    }
    saveWeekdayMap(map);
  };

  const updateSlot = (slotId, partial) => {
    const slots = template.slots.map((s) =>
      s.id === slotId ? normalizeSlot({ ...s, ...partial }, s.order) : s,
    );
    patchTemplate({ slots });
  };

  const addSlot = () => {
    const order = template.slots.length;
    const slot = normalizeSlot(
      {
        id: newScheduleId('slot'),
        label: isPeriods ? `Period ${order + 1}` : `Slot ${order + 1}`,
        order,
        color: SCHEDULE_SWATCHES[order % SCHEDULE_SWATCHES.length],
      },
      order,
    );
    patchTemplate({ slots: [...template.slots, slot] });
  };

  const removeSlot = (slotId) => {
    const slots = template.slots
      .filter((s) => s.id !== slotId)
      .map((s, i) => ({ ...s, order: i }));
    patchTemplate({ slots });
  };

  const moveSlot = (slotId, dir) => {
    const idx = template.slots.findIndex((s) => s.id === slotId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= template.slots.length) return;
    const slots = [...template.slots];
    const [item] = slots.splice(idx, 1);
    slots.splice(next, 0, item);
    patchTemplate({ slots: slots.map((s, i) => ({ ...s, order: i })) });
  };

  const openCreate = () => {
    setDraftName('');
    setDraftDays([1, 2, 3, 4, 5]);
    setDraftMode(schedule.mode === 'daySlots' ? 'daySlots' : 'periods');
    setCreateOpen(true);
  };

  const createPreset = () => {
    const name = draftName.trim() || dayChipsLabel(draftDays) || 'Day preset';
    const tmpl = normalizeTemplate({
      id: newScheduleId('tmpl'),
      name,
      slots:
        draftMode === 'periods'
          ? [
              {
                label: 'Period 1',
                order: 0,
                startTime: '09:00',
                endTime: '09:45',
              },
            ]
          : [{ label: 'Morning', order: 0 }],
    });
    const templates = [...schedule.templates, tmpl];
    const map = { ...(schedule.weekdayTemplateIds || {}) };
    for (const day of draftDays) {
      map[String(day)] = tmpl.id;
    }
    saveSchedule({
      ...schedule,
      mode: draftMode,
      templates,
      weekdayTemplateIds: map,
      source: 'teacher',
    });
    setActiveTemplateId(tmpl.id);
    setCreateOpen(false);
  };

  const deletePreset = () => {
    if (!template || schedule.templates.length <= 1) return;
    const templates = schedule.templates.filter((t) => t.id !== template.id);
    const map = { ...(schedule.weekdayTemplateIds || {}) };
    for (const [day, id] of Object.entries(map)) {
      if (id === template.id) delete map[day];
    }
    saveSchedule({
      ...schedule,
      templates,
      weekdayTemplateIds: map,
      source: 'teacher',
    });
    setActiveTemplateId(templates[0]?.id || '');
  };

  const toggleDraftDay = (dayId) => {
    setDraftDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId].sort((a, b) => {
            const rank = (d) => (d === 0 ? 7 : d);
            return rank(a) - rank(b);
          }),
    );
  };

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-4`}
      >
        <div>
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            Day presets
          </p>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Each preset is a day shape. Choose which weekdays use it — schools
            differ (M–Th / Fri, A/B days, early release, and more).
          </p>
        </div>

        {schedule.templates.length ? (
          <div className="flex flex-wrap gap-2">
            {schedule.templates.map((t) => {
              const days = daysForTemplate(schedule, t.id);
              const active = t.id === template?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`edu-control ${toolBtn} inline-flex flex-col items-start gap-0.5 !h-auto py-2 ${
                    active ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                  }`}
                  onClick={() => setActiveTemplateId(t.id)}
                >
                  <span className={TYPE.labelLg}>{t.name}</span>
                  <span
                    className={`${TYPE.labelMicro} ${
                      active ? 'opacity-80' : 'opacity-70'
                    }`}
                  >
                    {dayChipsLabel(days)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No presets yet. Use + to create one.
          </p>
        )}

        {template ? (
          <>
            <label className="block space-y-1">
              <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                Preset name
              </span>
              <input
                className={fieldClass}
                value={template.name || ''}
                onChange={(e) => patchTemplate({ name: e.target.value })}
              />
            </label>

            <div className="space-y-2">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                Days that use this preset
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Weekdays for this preset"
              >
                {WEEKDAYS.map((day) => {
                  const on = assignedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`edu-control min-w-[3rem] rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                        on
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                          : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                      }`}
                      aria-pressed={on}
                      title={day.label}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                A day can only belong to one preset. Selecting it here moves it
                off any other preset.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`edu-control ${toolBtn} ${
                  !isPeriods ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={() =>
                  saveSchedule({
                    ...schedule,
                    mode: 'daySlots',
                    source: 'teacher',
                  })
                }
              >
                Day slots
              </button>
              <button
                type="button"
                className={`edu-control ${toolBtn} ${
                  isPeriods ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={() =>
                  saveSchedule({
                    ...schedule,
                    mode: 'periods',
                    source: 'teacher',
                  })
                }
              >
                Timed periods
              </button>
              {schedule.templates.length > 1 ? (
                <button
                  type="button"
                  className={`edu-control ${toolBtn} ml-auto`}
                  onClick={deletePreset}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                  Delete preset
                </button>
              ) : null}
            </div>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {isPeriods
                ? 'Timed periods: set start/end on each block.'
                : 'Day slots: ordered lesson blocks without a clock.'}
            </p>
          </>
        ) : null}
      </div>

      {template ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              {isPeriods ? 'Periods' : 'Slots'}
              {template ? ` · ${template.name}` : ''}
            </p>
            <button
              type="button"
              className={`edu-control ${toolBtn}`}
              onClick={addSlot}
            >
              <Plus className="w-4 h-4" aria-hidden />
              Add
            </button>
          </div>

          <ul className="space-y-2 pb-20">
            {(template.slots || []).map((slot) => (
              <li
                key={slot.id}
                className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 space-y-2`}
              >
                <div className="flex items-center gap-2">
                  <SlotColorControl
                    color={slot.color}
                    theme={theme}
                    isDarkMode={isDarkMode}
                    label={`${slot.label || 'Slot'} color`}
                    onChange={(next) => updateSlot(slot.id, { color: next })}
                  />
                  <input
                    className={fieldClass}
                    value={slot.label}
                    onChange={(e) =>
                      updateSlot(slot.id, { label: e.target.value })
                    }
                    aria-label="Slot label"
                  />
                  <button
                    type="button"
                    className={`edu-control ${toolBtn}`}
                    aria-label="Move up"
                    onClick={() => moveSlot(slot.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={`edu-control ${toolBtn}`}
                    aria-label="Move down"
                    onClick={() => moveSlot(slot.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`edu-control ${toolBtn}`}
                    aria-label="Remove slot"
                    onClick={() => removeSlot(slot.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {isPeriods ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span
                        className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                      >
                        Start
                      </span>
                      <input
                        type="time"
                        className={fieldClass}
                        value={slot.startTime || ''}
                        onChange={(e) =>
                          updateSlot(slot.id, { startTime: e.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-1">
                      <span
                        className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                      >
                        End
                      </span>
                      <input
                        type="time"
                        className={fieldClass}
                        value={slot.endTime || ''}
                        onChange={(e) =>
                          updateSlot(slot.id, { endTime: e.target.value })
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <button
        type="button"
        onClick={openCreate}
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        title="New day preset"
        aria-label="New day preset"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <Modal
        isOpen={createOpen}
        title="New day preset"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              disabled={!draftDays.length}
              onClick={createPreset}
            >
              Create
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <label className="block space-y-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
              Name
            </span>
            <input
              className={fieldClass}
              placeholder="e.g. Early release, A day, Friday"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
              Days that use this preset
            </p>
            <div className="flex flex-wrap gap-2" role="group">
              {WEEKDAYS.map((day) => {
                const on = draftDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    className={`edu-control min-w-[3rem] rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                      on
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                    }`}
                    aria-pressed={on}
                    onClick={() => toggleDraftDay(day.id)}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control ${toolBtn} ${
                draftMode === 'daySlots'
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : ''
              }`}
              onClick={() => setDraftMode('daySlots')}
            >
              Day slots
            </button>
            <button
              type="button"
              className={`edu-control ${toolBtn} ${
                draftMode === 'periods'
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : ''
              }`}
              onClick={() => setDraftMode('periods')}
            >
              Timed periods
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
