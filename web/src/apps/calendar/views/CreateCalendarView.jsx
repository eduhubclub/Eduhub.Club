import { useMemo, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_BOARD_PAD } from '../../../shared/layout';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { bestOnColor } from '../../../shared/colorContrast';
import { useCalendar } from '../CalendarContext';
import {
  CALENDAR_SWATCHES,
  newCalendarId,
  specialistRotationSeed,
  toIsoDate,
} from '../../../data/calendar/calendarModel';

/**
 * Build a named calendar layer (standard or rotation).
 */
export function CreateCalendarView({ isDarkMode, theme }) {
  const { saveLayer, seedSpecialists, layers, classes, classId } = useCalendar();
  const classLabel =
    classes.find((c) => String(c.id) === String(classId))?.name || 'Class';

  const [name, setName] = useState('');
  const [type, setType] = useState('rotation');
  const [color, setColor] = useState(CALENDAR_SWATCHES[0]);
  const [anchorDate, setAnchorDate] = useState(toIsoDate(new Date()));
  const [slots, setSlots] = useState([
    { id: newCalendarId('slot'), label: 'P.E.', color: CALENDAR_SWATCHES[0] },
    { id: newCalendarId('slot'), label: 'STEM', color: CALENDAR_SWATCHES[1] },
  ]);
  const [savedMsg, setSavedMsg] = useState('');

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (type === 'rotation') {
      return slots.some((s) => s.label.trim());
    }
    return true;
  }, [name, type, slots]);

  const save = () => {
    if (!canSave) return;
    const layer = {
      id: newCalendarId('layer'),
      name: name.trim(),
      type,
      color,
      anchorDate,
      visible: true,
      slots:
        type === 'rotation'
          ? slots
              .filter((s) => s.label.trim())
              .map((s, i) => ({
                id: s.id || newCalendarId('slot'),
                label: s.label.trim(),
                color: s.color || CALENDAR_SWATCHES[i % CALENDAR_SWATCHES.length],
              }))
          : [],
    };
    saveLayer(layer);
    setSavedMsg(`Saved “${layer.name}” for ${classLabel}.`);
    setName('');
  };

  const loadSpecialistDemo = () => {
    if (layers.some((l) => l.type === 'rotation')) {
      const seed = specialistRotationSeed();
      saveLayer(seed);
      setSavedMsg(`Added “${seed.name}” for ${classLabel}.`);
      return;
    }
    const seeded = seedSpecialists();
    if (seeded) setSavedMsg(`Added “${seeded.name}” for ${classLabel}.`);
    else {
      const seed = specialistRotationSeed();
      saveLayer(seed);
      setSavedMsg(`Added “${seed.name}” for ${classLabel}.`);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Calendar"
        description={`${classLabel} · Named layers for events or specialist rotations.`}
        isDarkMode={isDarkMode}
      />

      <div
        className={`${APP_GRID_CARD} ${APP_BOARD_PAD} space-y-4 ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <label className="block space-y-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Name
          </span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Specialist Rotation"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'rotation', label: 'Rotation' },
            { id: 'standard', label: 'Standard' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                type === opt.id
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
              }`}
              onClick={() => setType(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Layer color
          </p>
          <div className="flex flex-wrap gap-2">
            {CALENDAR_SWATCHES.map((swatch) => {
              const on = bestOnColor(swatch);
              return (
                <button
                  key={swatch}
                  type="button"
                  className={`edu-control h-8 w-8 rounded-full border-2 ${
                    color === swatch ? 'border-slate-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: swatch, color: on.hex }}
                  onClick={() => setColor(swatch)}
                  aria-label={`Color ${swatch}`}
                />
              );
            })}
          </div>
        </div>

        {type === 'rotation' ? (
          <>
            <label className="block space-y-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Anchor date (rotation day 1)
              </span>
              <input
                type="date"
                className={inputClass}
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                  Slots (order = sequence)
                </p>
                <button
                  type="button"
                  className={`edu-control inline-flex items-center gap-1 rounded-lg px-2 py-1 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                  onClick={() =>
                    setSlots((prev) => [
                      ...prev,
                      {
                        id: newCalendarId('slot'),
                        label: '',
                        color: CALENDAR_SWATCHES[prev.length % CALENDAR_SWATCHES.length],
                      },
                    ])
                  }
                >
                  <Plus size={14} />
                  Slot
                </button>
              </div>
              <ul className="space-y-2">
                {slots.map((slot, index) => (
                  <li
                    key={slot.id}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] p-2 ${theme.colorOutlineVariant}`}
                  >
                    <GripVertical
                      size={16}
                      className={`shrink-0 ${theme.colorOnSurfaceVariant}`}
                    />
                    <span
                      className={`w-6 shrink-0 text-center ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="color"
                      value={slot.color}
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s) =>
                            s.id === slot.id ? { ...s, color: e.target.value } : s,
                          ),
                        )
                      }
                      className="edu-control h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      aria-label="Slot color"
                    />
                    <input
                      className={`${inputClass} flex-1`}
                      value={slot.label}
                      placeholder="Specialist name"
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s) =>
                            s.id === slot.id
                              ? { ...s, label: e.target.value }
                              : s,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className={`edu-control rounded-lg p-2 ${theme.colorOnSurfaceVariant}`}
                      onClick={() =>
                        setSlots((prev) => prev.filter((s) => s.id !== slot.id))
                      }
                      aria-label="Remove slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Snow days and breaks pause this sequence — the next school day
                keeps the interrupted slot.
              </p>
            </div>
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <ModalPrimaryButton theme={theme} onClick={save} disabled={!canSave}>
            Save calendar
          </ModalPrimaryButton>
          <button
            type="button"
            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
            onClick={loadSpecialistDemo}
          >
            Seed 6-specialist demo
          </button>
        </div>
        {savedMsg ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{savedMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
