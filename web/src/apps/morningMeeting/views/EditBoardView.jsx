import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { AppPageShell } from '../../../shared/AppPageShell';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD, APP_BOARD_PAD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';
import { ImageField } from '../ImageField';
import { LayoutArrange } from '../LayoutArrange';
import {
  MORNING_MEETING_UPDATED_EVENT,
  addPin,
  ensureBoard,
  movePin,
  readBoard,
  removePin,
  setBoardBackground,
  setPinFont,
  setPinOrientation,
  setPinSize,
  setPinTextSize,
  updatePin,
} from '../morningMeetingStorage';
import { PIN_FONTS, PIN_TEXT_SIZES } from '../pinTextStyle';
import { WIDGET_CATALOG, getWidgetMeta } from '../widgets/registry';
import { geocodePlace } from '../widgets/WeatherWidget';

const SIZES = [
  { id: 's', label: 'S', title: 'Small — fits text; image makes a square' },
  { id: 'm', label: 'M', title: 'Medium (4×2)' },
  { id: 'l', label: 'L', title: 'Large (6×3)' },
  { id: 'banner', label: 'Banner', title: 'Full width banner (12×1)' },
];

const ORIENTATIONS = [
  { id: 'horizontal', label: 'Horizontal', title: 'Wider tile' },
  { id: 'vertical', label: 'Vertical', title: 'Taller tile' },
];

const MESSAGE_FORMATS = [
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'list', label: 'List' },
];

/**
 * Add, remove, and resize Morning Meeting pins.
 */
export function EditBoardView({ isDarkMode, theme }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const classId = selectedClass?.id != null ? String(selectedClass.id) : null;
  const roster = selectedClass?.studentList || [];
  const activeClasses = (classes || []).filter((c) => !c.isArchived);

  const [pins, setPins] = useState([]);
  const [backgroundSrc, setBackgroundSrc] = useState('');

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  const reload = () => {
    if (!classId) {
      setPins([]);
      setBackgroundSrc('');
      return;
    }
    const board = ensureBoard(classId);
    setPins(board.pins);
    setBackgroundSrc(board.backgroundSrc || '');
  };

  useEffect(() => {
    reload();
    const onChange = () => {
      const board = readBoard(classId);
      setPins(board.pins);
      setBackgroundSrc(board.backgroundSrc || '');
    };
    window.addEventListener(MORNING_MEETING_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(MORNING_MEETING_UPDATED_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Edit board"
          description="Choose which widgets appear on the morning board."
          isDarkMode={isDarkMode}
          leading={
            <div
              className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
            >
              <Pencil size={20} />
            </div>
          }
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Edit board"
        description={`Customize widgets for ${selectedClass?.name || 'this class'}.`}
        isDarkMode={isDarkMode}
        leading={
          <div
            className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Pencil size={20} />
          </div>
        }
      />

      <section className="mb-8 max-w-3xl">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Board background</h2>
        <p className={`${TYPE.bodySm} mt-1 mb-3 ${theme.colorOnSurfaceVariant}`}>
          Optional image behind all cards on the Board.
        </p>
        <div className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <ImageField
            label="Background image"
            value={backgroundSrc}
            onChange={(next) => classId && setBoardBackground(classId, next)}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </section>

      <section className="mb-8 max-w-3xl">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Add a widget</h2>
        <p className={`${TYPE.bodySm} mt-1 mb-3 ${theme.colorOnSurfaceVariant}`}>
          Built-in widgets once each. Add as many Custom cards as you need. Set a board
          background above; Instructions can include an optional image when pinned.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WIDGET_CATALOG.map((item) => {
            const Icon = item.Icon;
            const alreadyPinned =
              !item.allowMultiple && pins.some((p) => p.type === item.type);
            return (
              <button
                key={item.type}
                type="button"
                disabled={!classId || alreadyPinned}
                onClick={() => {
                  if (!classId || alreadyPinned) return;
                  addPin(classId, { type: item.type, size: item.defaultSize });
                }}
                className={`edu-control flex items-start gap-3 text-left rounded-xl border-[1.5px] p-3 ${
                  alreadyPinned
                    ? `opacity-50 cursor-not-allowed ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
              >
                <span
                  className={`p-2 rounded-lg shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className={`block ${TYPE.labelLg}`}>
                    {alreadyPinned ? null : <Plus size={14} className="inline mr-1" />}
                    {item.label}
                    {alreadyPinned ? (
                      <span className={`${TYPE.labelSm} ml-1.5 opacity-80`}>Pinned</span>
                    ) : null}
                  </span>
                  <span className={`block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8 max-w-5xl">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Arrange layout</h2>
        <p className={`${TYPE.bodySm} mt-1 mb-3 ${theme.colorOnSurfaceVariant}`}>
          Drag to move and resize on the grid. Cards grow to fit their content (size is a
          preference under that minimum). Overlapping drops snap back. The live board matches
          this layout, shows all content without card scroll, and centers leftover space.
        </p>
        {pins.length ? (
          <LayoutArrange
            classId={classId}
            pins={pins}
            theme={theme}
            isDarkMode={isDarkMode}
            rosterCount={roster.length}
          />
        ) : (
          <EmptyState isDarkMode={isDarkMode} message="Add a widget below to start arranging." />
        )}
      </section>

      <section className="max-w-3xl space-y-3">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Pinned widgets</h2>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Use size chips to seed a footprint (before you customize in the playground). Arrows change
          list order only.
        </p>
        {!pins.length ? (
          <EmptyState isDarkMode={isDarkMode} message="No widgets yet — add one above." />
        ) : (
          pins.map((pin, index) => {
            const meta = getWidgetMeta(pin.type);
            const Icon = meta?.Icon;
            const displayTitle =
              pin.type === 'custom'
                ? String(pin.props?.title || meta?.label || 'Custom')
                : meta?.label || pin.type;
            return (
              <div
                key={pin.id}
                className={`${APP_GRID_CARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Move ${displayTitle} up`}
                      disabled={index === 0}
                      onClick={() => classId && movePin(classId, pin.id, -1)}
                      className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant} disabled:opacity-30`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${displayTitle} down`}
                      disabled={index === pins.length - 1}
                      onClick={() => classId && movePin(classId, pin.id, 1)}
                      className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant} disabled:opacity-30`}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  {Icon ? (
                    <span
                      className={`p-2 rounded-lg shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                    >
                      <Icon size={18} />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{displayTitle}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Size</span>
                      {SIZES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          title={s.title}
                          onClick={() => classId && setPinSize(classId, pin.id, s.id)}
                          className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                            pin.size === s.id
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                              : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                        Layout
                      </span>
                      {ORIENTATIONS.map((o) => {
                        const active = (pin.orientation || 'horizontal') === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            title={o.title}
                            onClick={() =>
                              classId && setPinOrientation(classId, pin.id, o.id)
                            }
                            className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                              active
                                ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                            }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                        Text
                      </span>
                      {PIN_TEXT_SIZES.map((s) => {
                        const active = (pin.textSize || 'md') === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            title={s.title}
                            onClick={() =>
                              classId && setPinTextSize(classId, pin.id, s.id)
                            }
                            className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                              active
                                ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                        Font
                      </span>
                      {PIN_FONTS.map((f) => {
                        const active = (pin.font || 'default') === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            title={f.label}
                            onClick={() => classId && setPinFont(classId, pin.id, f.id)}
                            className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                              active
                                ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                            }`}
                            style={f.cssFamily ? { fontFamily: f.cssFamily } : undefined}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                    {pin.type === 'message' ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                            Format
                          </span>
                          {MESSAGE_FORMATS.map((fmt) => {
                            const active =
                              (pin.props?.format === 'list' ? 'list' : 'paragraph') === fmt.id;
                            return (
                              <button
                                key={fmt.id}
                                type="button"
                                onClick={() =>
                                  classId &&
                                  updatePin(classId, pin.id, {
                                    props: { format: fmt.id },
                                  })
                                }
                                className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                                  active
                                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                                }`}
                              >
                                {fmt.label}
                              </button>
                            );
                          })}
                        </div>
                        <div>
                          <label
                            className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            htmlFor={`mm-msg-${pin.id}`}
                          >
                            Morning message
                          </label>
                          <textarea
                            id={`mm-msg-${pin.id}`}
                            className={`${inputClass} mt-1.5 min-h-[5rem] resize-y`}
                            value={String(pin.props?.text || '')}
                            onChange={(e) => {
                              if (!classId) return;
                              updatePin(classId, pin.id, {
                                props: { text: e.target.value },
                              });
                            }}
                            placeholder={
                              pin.props?.format === 'list'
                                ? 'One step per line…\nHang up backpack\nStart morning work'
                                : 'What should students do when they walk in?'
                            }
                            rows={3}
                          />
                          {pin.props?.format === 'list' ? (
                            <p className={`${TYPE.bodySm} mt-1.5 ${theme.colorOnSurfaceVariant}`}>
                              Each line becomes a bullet on the board.
                            </p>
                          ) : null}
                        </div>
                        <ImageField
                          label="Optional image"
                          value={String(pin.props?.imageSrc || '')}
                          onChange={(next) =>
                            classId &&
                            updatePin(classId, pin.id, { props: { imageSrc: next } })
                          }
                          theme={theme}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    ) : null}
                    {pin.type === 'weather' ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label
                            className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            htmlFor={`mm-weather-place-${pin.id}`}
                          >
                            Place
                          </label>
                          <input
                            id={`mm-weather-place-${pin.id}`}
                            type="text"
                            className={`${inputClass} mt-1.5`}
                            defaultValue={String(pin.props?.place || '')}
                            key={`weather-place-${pin.id}-${String(pin.props?.place || '')}`}
                            placeholder="City or town (e.g. Austin, TX)"
                            onBlur={async (e) => {
                              if (!classId) return;
                              const query = e.target.value.trim();
                              if (!query) {
                                updatePin(classId, pin.id, {
                                  props: { place: '', lat: '', lon: '' },
                                });
                                return;
                              }
                              try {
                                const geo = await geocodePlace(query);
                                if (geo) {
                                  updatePin(classId, pin.id, {
                                    props: {
                                      place: geo.place,
                                      lat: geo.lat,
                                      lon: geo.lon,
                                    },
                                  });
                                } else {
                                  updatePin(classId, pin.id, {
                                    props: { place: query },
                                  });
                                }
                              } catch {
                                updatePin(classId, pin.id, {
                                  props: { place: query },
                                });
                              }
                            }}
                          />
                          <p className={`${TYPE.bodySm} mt-1.5 ${theme.colorOnSurfaceVariant}`}>
                            Required — enter a city so the board can load weather (device location is
                            not used).
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                            Units
                          </span>
                          {[
                            { id: 'f', label: '°F' },
                            { id: 'c', label: '°C' },
                          ].map((u) => {
                            const active = (pin.props?.unit === 'c' ? 'c' : 'f') === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() =>
                                  classId &&
                                  updatePin(classId, pin.id, { props: { unit: u.id } })
                                }
                                className={`edu-control rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                                  active
                                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                                }`}
                              >
                                {u.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    {pin.type === 'custom' ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label
                            className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            htmlFor={`mm-custom-title-${pin.id}`}
                          >
                            Title
                          </label>
                          <input
                            id={`mm-custom-title-${pin.id}`}
                            type="text"
                            className={`${inputClass} mt-1.5`}
                            value={String(pin.props?.title || '')}
                            onChange={(e) => {
                              if (!classId) return;
                              updatePin(classId, pin.id, {
                                props: { title: e.target.value },
                              });
                            }}
                            placeholder="Card title"
                          />
                        </div>
                        <div>
                          <label
                            className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            htmlFor={`mm-custom-student-${pin.id}`}
                          >
                            Student
                          </label>
                          <select
                            id={`mm-custom-student-${pin.id}`}
                            className={`${inputClass} mt-1.5`}
                            value={String(pin.props?.studentId || '')}
                            onChange={(e) => {
                              if (!classId) return;
                              updatePin(classId, pin.id, {
                                props: { studentId: e.target.value },
                              });
                            }}
                          >
                            <option value="">None — no one assigned</option>
                            {roster.map((student) => (
                              <option key={String(student.id)} value={String(student.id)}>
                                {studentDisplayName(student)}
                              </option>
                            ))}
                          </select>
                          {!roster.length ? (
                            <p className={`${TYPE.bodySm} mt-1.5 ${theme.colorOnSurfaceVariant}`}>
                              Add students in Edu.Classes to assign someone.
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label
                            className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                            htmlFor={`mm-custom-text-${pin.id}`}
                          >
                            Text
                          </label>
                          <textarea
                            id={`mm-custom-text-${pin.id}`}
                            className={`${inputClass} mt-1.5 min-h-[4rem] resize-y`}
                            value={String(pin.props?.text || '')}
                            onChange={(e) => {
                              if (!classId) return;
                              updatePin(classId, pin.id, {
                                props: { text: e.target.value },
                              });
                            }}
                            placeholder="Optional caption or note"
                            rows={2}
                          />
                        </div>
                        <ImageField
                          label="Image"
                          value={String(pin.props?.imageSrc || '')}
                          onChange={(next) =>
                            classId &&
                            updatePin(classId, pin.id, { props: { imageSrc: next } })
                          }
                          theme={theme}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${displayTitle}`}
                    className={`edu-control shrink-0 rounded-lg p-2 ${theme.colorOnSurfaceVariant}`}
                    onClick={() => classId && removePin(classId, pin.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </AppPageShell>
  );
}
