import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_BOARD_PAD } from '../../../shared/layout';
import { bestOnColor } from '../../../shared/colorContrast';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { FitPopout } from '../../../shared/usePopoutFit';
import {
  CALENDAR_SWATCHES,
  newCalendarId,
} from '../../../data/calendar/calendarModel';
import { useCalendar } from '../CalendarContext';

function LayerCard({
  layer,
  theme,
  isDarkMode,
  onToggleVisible,
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const on = bestOnColor(layer.color || '#0ea5e9');

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const menuItemClass = (danger = false) =>
    `edu-control w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${TYPE.labelLg} transition-colors ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
        : isDarkMode
          ? 'text-slate-200 hover:bg-slate-800'
          : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <li
      className={`relative ${APP_GRID_CARD} flex flex-wrap items-center gap-3 p-4 pr-12 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div ref={menuRef} className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="More actions"
          title="More actions"
          className={`edu-control rounded-full p-1.5 transition-colors ${theme.colorOnSurfaceVariant} hover:bg-slate-100 dark:hover:bg-slate-800`}
        >
          <MoreVertical size={16} strokeWidth={2.5} />
        </button>
        {menuOpen ? (
          <FitPopout
            open={menuOpen}
            className={`absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border-[1.5px] p-1 shadow-lg ${
              isDarkMode
                ? 'border-slate-600 bg-slate-900'
                : 'border-slate-300 bg-white'
            }`}
            role="menu"
            aria-label="Calendar actions"
          >
            <button
              type="button"
              role="menuitem"
              className={menuItemClass()}
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              <Pencil size={14} strokeWidth={2.5} className="shrink-0" />
              Edit
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass(true)}
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
              Delete
            </button>
          </FitPopout>
        ) : null}
      </div>

      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
        style={{ backgroundColor: layer.color, color: on.hex }}
      >
        {layer.type === 'rotation' ? 'R' : 'C'}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{layer.name}</p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          {layer.type === 'rotation'
            ? `${layer.slots?.length || 0} slots · anchor ${layer.anchorDate}`
            : 'Standard events'}
        </p>
        {layer.type === 'rotation' && layer.slots?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {layer.slots.map((slot) => {
              const slotOn = bestOnColor(slot.color || layer.color);
              return (
                <span
                  key={slot.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: slot.color,
                    color: slotOn.hex,
                  }}
                >
                  {slot.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className={`edu-control inline-flex items-center gap-1 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
        onClick={onToggleVisible}
      >
        {layer.visible === false ? (
          <>
            <EyeOff size={14} /> Hidden
          </>
        ) : (
          <>
            <Eye size={14} /> Visible
          </>
        )}
      </button>
    </li>
  );
}

/**
 * Manage saved calendar layers for the focused class.
 */
export function SavedCalendarView({ isDarkMode, theme }) {
  const { layers, saveLayer, deleteLayer, seedSpecialists, classes, classId } =
    useCalendar();
  const classLabel =
    classes.find((c) => String(c.id) === String(classId))?.name || 'Class';

  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(CALENDAR_SWATCHES[0]);
  const [draftAnchor, setDraftAnchor] = useState('');
  const [draftSlots, setDraftSlots] = useState([]);

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const canSaveEdit = useMemo(() => {
    if (!draftName.trim()) return false;
    if (editing?.type === 'rotation') {
      return draftSlots.some((s) => s.label.trim());
    }
    return true;
  }, [draftName, draftSlots, editing]);

  const openEdit = (layer) => {
    setEditing(layer);
    setDraftName(layer.name || '');
    setDraftColor(layer.color || CALENDAR_SWATCHES[0]);
    setDraftAnchor(layer.anchorDate || '');
    setDraftSlots(
      (layer.slots || []).map((s) => ({
        id: s.id || newCalendarId('slot'),
        label: s.label || '',
        color: s.color || CALENDAR_SWATCHES[0],
      })),
    );
  };

  const saveEdit = () => {
    if (!editing || !canSaveEdit) return;
    saveLayer({
      ...editing,
      name: draftName.trim(),
      color: draftColor,
      anchorDate: draftAnchor || editing.anchorDate,
      slots:
        editing.type === 'rotation'
          ? draftSlots
              .filter((s) => s.label.trim())
              .map((s, i) => ({
                id: s.id || newCalendarId('slot'),
                label: s.label.trim(),
                color:
                  s.color || CALENDAR_SWATCHES[i % CALENDAR_SWATCHES.length],
              }))
          : editing.slots || [],
    });
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Saved Calendar"
        description={`${classLabel} · Toggle visibility or remove layers.`}
        isDarkMode={isDarkMode}
      />

      {!layers.length ? (
        <div
          className={`${APP_GRID_CARD} ${APP_BOARD_PAD} space-y-3 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No calendars yet for this class.
          </p>
          <button
            type="button"
            className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => seedSpecialists()}
          >
            Seed specialist rotation
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {layers.map((layer) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              theme={theme}
              isDarkMode={isDarkMode}
              onToggleVisible={() =>
                saveLayer({ ...layer, visible: layer.visible === false })
              }
              onEdit={() => openEdit(layer)}
              onDelete={() => deleteLayer(layer.id)}
            />
          ))}
        </ul>
      )}

      <Modal
        isOpen={Boolean(editing)}
        title="Edit calendar"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              onClick={saveEdit}
              disabled={!canSaveEdit}
            >
              Save
            </ModalPrimaryButton>
          </div>
        }
      >
        {editing ? (
          <div className="space-y-4 p-6">
            <label className="block space-y-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Name
              </span>
              <input
                className={inputClass}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
            </label>

            <div className="space-y-2">
              <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Layer color
              </p>
              <div className="flex flex-wrap gap-2">
                {CALENDAR_SWATCHES.map((swatch) => {
                  const swatchOn = bestOnColor(swatch);
                  return (
                    <button
                      key={swatch}
                      type="button"
                      className={`edu-control h-8 w-8 rounded-full border-2 ${
                        draftColor === swatch
                          ? 'border-slate-900 dark:border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: swatch, color: swatchOn.hex }}
                      onClick={() => setDraftColor(swatch)}
                      aria-label={`Color ${swatch}`}
                    />
                  );
                })}
              </div>
            </div>

            {editing.type === 'rotation' ? (
              <>
                <label className="block space-y-1">
                  <span
                    className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    Anchor date (rotation day 1)
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    value={draftAnchor}
                    onChange={(e) => setDraftAnchor(e.target.value)}
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    >
                      Slots (order = sequence)
                    </p>
                    <button
                      type="button"
                      className={`edu-control inline-flex items-center gap-1 rounded-lg px-2 py-1 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                      onClick={() =>
                        setDraftSlots((prev) => [
                          ...prev,
                          {
                            id: newCalendarId('slot'),
                            label: '',
                            color:
                              CALENDAR_SWATCHES[
                                prev.length % CALENDAR_SWATCHES.length
                              ],
                          },
                        ])
                      }
                    >
                      <Plus size={14} />
                      Slot
                    </button>
                  </div>
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {draftSlots.map((slot, index) => (
                      <li
                        key={slot.id}
                        className={`flex items-center gap-2 rounded-xl border-[1.5px] p-2 ${theme.colorOutlineVariant}`}
                      >
                        <span
                          className={`w-6 shrink-0 text-center ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                        >
                          {index + 1}
                        </span>
                        <input
                          type="color"
                          value={slot.color}
                          onChange={(e) =>
                            setDraftSlots((prev) =>
                              prev.map((s) =>
                                s.id === slot.id
                                  ? { ...s, color: e.target.value }
                                  : s,
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
                            setDraftSlots((prev) =>
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
                            setDraftSlots((prev) =>
                              prev.filter((s) => s.id !== slot.id),
                            )
                          }
                          aria-label="Remove slot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
