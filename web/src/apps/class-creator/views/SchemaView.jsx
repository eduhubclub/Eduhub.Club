import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { SegmentControl } from '../../../shared/SegmentControl';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { bestOnColor } from '../../../shared/colorContrast';
import { SpectrumColorPicker } from '../../../shared/SpectrumColorPicker';
import {
  DEFAULT_GENDER_COLORS,
  DEFAULT_PRIORITY,
  DEFAULT_SCALE,
  PRIORITY_LABELS,
  SCALE_THEME_COLORS,
  normalizeScale,
  normalizeScaleValue,
  scaleForColumn,
  scaleValueSortKey,
} from '../../../data/class-creator/classCreatorModel';

const GENDER_COLOR_ROWS = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'other', label: 'Other / unset' },
];

const RATING_SCALE_HELP =
  'Each survey category has its own scale page — values, colors, and descriptors. Numbers (4) or percentages (90%). Start from muted presets, then fine-tune with the spectrum and hex.';

const GENDER_COLORS_HELP =
  'Tint student rows by gender on Dashboard rosters, Survey Preview, and Place. Leave off to alternate white and gray.';

const TEACHER_COLUMNS_HELP =
  'Subjects and traits on the teacher survey. Uncheck to hide a column from Survey Preview without deleting it. Scale categories also appear as tabs under Rating Scale & Colors.';

const SERVICES_TAGS_HELP =
  'Service labels teachers can tag on students (IEP, 504, ML, and more). Shown on Survey Preview and placement.';

const SORT_PRIORITY_HELP =
  'Highest priority first. Separations, pairings, and locks always win.';

/** Full-bleed card title row with bottom stroke (AppBoard pad="board"). */
export function cardHeaderClass(theme, extra = '') {
  return `flex flex-wrap items-center justify-between gap-3 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 px-5 sm:px-6 py-3 border-b ${theme.colorOutline} ${extra}`.trim();
}

export function SectionInfoTip({ text, label, isDarkMode, theme }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className={`edu-control p-1.5 rounded-lg transition-colors ${
          isDarkMode
            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={16} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border-[1.5px] p-3 shadow-lg ${
            theme.colorOutline
          } ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600'} ${TYPE.bodySm}`}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Admin-customizable rating scale, columns, service tags, and sort priority.
 */
export function SchemaView({ theme, isDarkMode, run, upsertActiveRun, aboveGender = null }) {
  const [dragLevelIndex, setDragLevelIndex] = useState(null);
  const [editingScale, setEditingScale] = useState(false);
  const [editingColumns, setEditingColumns] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [scaleCategoryId, setScaleCategoryId] = useState('');

  const schema = run?.schema;
  const priorityOrder = run?.priorityOrder || [];

  const scaleColumns = useMemo(
    () => (schema?.columns || []).filter((col) => col.type === 'scale'),
    [schema?.columns],
  );
  const scaleTabs = useMemo(
    () => scaleColumns.map((col) => ({ id: col.id, label: col.label })),
    [scaleColumns],
  );
  const activeScaleId =
    scaleTabs.find((tab) => tab.id === scaleCategoryId)?.id || scaleTabs[0]?.id || '';
  const activeScale = normalizeScale(
    scaleForColumn(schema, activeScaleId),
    schema?.scale || DEFAULT_SCALE,
  );
  const activeLevels = activeScale.levels || [];

  if (!run || !schema) {
    return (
      <EmptyState
        message="Start a placement run first — Schema is saved on the active run so each year can differ."
        isDarkMode={isDarkMode}
      />
    );
  }

  const updateSchema = (patch) => {
    upsertActiveRun({ schema: { ...schema, ...patch } });
  };

  const updateColumnScale = (columnId, scalePatch) => {
    if (!columnId) return;
    const currentCol = schema.columns.find((col) => col.id === columnId);
    const current = normalizeScale(currentCol?.scale || schema.scale, schema.scale);
    const nextScale =
      typeof scalePatch === 'function' ? scalePatch(current) : { ...current, ...scalePatch };
    updateSchema({
      columns: schema.columns.map((col) =>
        col.id === columnId && col.type === 'scale' ? { ...col, scale: nextScale } : col,
      ),
      // Keep shared fallback in sync when editing Overall Academics (legacy readers).
      ...(columnId === 'overall_academics' ? { scale: nextScale } : {}),
    });
  };

  const updateLevel = (index, patch) => {
    updateColumnScale(activeScaleId, (current) => ({
      ...current,
      levels: current.levels.map((level, i) =>
        i === index ? { ...level, ...patch } : level,
      ),
    }));
  };

  const addLevel = () => {
    updateColumnScale(activeScaleId, (current) => {
      const levels = current.levels;
      const values = levels
        .map((level) => scaleValueSortKey(level.value))
        .filter(Number.isFinite);
      const nextNum = values.length ? Math.max(...values) + 1 : 1;
      const usePct = levels.some((level) => String(level.value).includes('%'));
      return {
        ...current,
        levels: [
          {
            value: usePct ? `${nextNum}%` : nextNum,
            label: 'New level',
            color: SCALE_THEME_COLORS[levels.length % SCALE_THEME_COLORS.length],
          },
          ...levels,
        ],
      };
    });
  };

  const removeLevel = (index) => {
    if (activeLevels.length <= 2) return;
    updateColumnScale(activeScaleId, (current) => ({
      ...current,
      levels: current.levels.filter((_, i) => i !== index),
    }));
  };

  const reorderLevels = (fromIndex, toIndex) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= activeLevels.length ||
      toIndex >= activeLevels.length
    ) {
      return;
    }
    updateColumnScale(activeScaleId, (current) => {
      const next = [...current.levels];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return { ...current, levels: next };
    });
  };

  const toggleColumn = (id) => {
    updateSchema({
      columns: schema.columns.map((col) =>
        col.id === id ? { ...col, enabled: !col.enabled } : col,
      ),
    });
  };

  const renameColumn = (id, label) => {
    updateSchema({
      columns: schema.columns.map((col) =>
        col.id === id ? { ...col, label } : col,
      ),
    });
  };

  const addColumn = () => {
    const id = `custom_${Date.now().toString(36)}`;
    updateSchema({
      columns: [
        ...schema.columns,
        {
          id,
          label: 'Custom rating',
          type: 'scale',
          enabled: true,
          scale: structuredClone(DEFAULT_SCALE),
        },
      ],
    });
    setScaleCategoryId(id);
  };

  const addTag = () => {
    const id = `tag_${Date.now().toString(36)}`;
    updateSchema({
      serviceTags: [...schema.serviceTags, { id, label: 'New service' }],
    });
  };

  const updateTag = (id, label) => {
    updateSchema({
      serviceTags: schema.serviceTags.map((tag) =>
        tag.id === id ? { ...tag, label } : tag,
      ),
    });
  };

  const removeTag = (id) => {
    updateSchema({
      serviceTags: schema.serviceTags.filter((tag) => tag.id !== id),
    });
  };

  const movePriority = (index, dir) => {
    const next = [...priorityOrder];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    upsertActiveRun({ priorityOrder: next });
  };

  const resetPriority = () => upsertActiveRun({ priorityOrder: [...DEFAULT_PRIORITY] });

  const genderColors = schema.genderColors || DEFAULT_GENDER_COLORS;

  const updateGenderColors = (patch) => {
    updateSchema({
      genderColors: {
        ...DEFAULT_GENDER_COLORS,
        ...genderColors,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className={cardHeaderClass(theme, scaleTabs.length ? '!mb-0' : '')}>
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Rating Scale & Colors
            </h2>
            <SectionInfoTip
              text={RATING_SCALE_HELP}
              label="About Rating Scale & Colors"
              isDarkMode={isDarkMode}
              theme={theme}
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control ${
                editingScale ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
              }`}
              onClick={() => setEditingScale((v) => !v)}
              aria-label={editingScale ? 'Done editing scale' : 'Edit scale'}
              title={editingScale ? 'Done' : 'Edit'}
              aria-pressed={editingScale}
              disabled={!activeScaleId}
            >
              {editingScale ? (
                <Check className="w-4 h-4" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
            </button>
            {editingScale ? (
              <button
                type="button"
                className={`${toolBtnClass(isDarkMode)} edu-control`}
                onClick={addLevel}
                aria-label="Add level"
                title="Add level"
                disabled={!activeScaleId}
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
        {scaleTabs.length ? (
          <div
            className={`-mx-5 sm:-mx-6 mb-4 overflow-x-auto ${
              isDarkMode ? 'bg-slate-800/60' : 'bg-slate-50'
            }`}
          >
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              variant="tabs"
              fullWidth
              value={activeScaleId}
              onChange={(id) => {
                setScaleCategoryId(id);
                setEditingScale(false);
              }}
              options={scaleTabs}
            />
          </div>
        ) : (
          <p className={`mb-3 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Add a scale category under Survey Categories to edit levels here.
          </p>
        )}
        <ul className="space-y-2">
          {activeLevels.map((level, index) => {
            const on = bestOnColor(level.color);
            const hex = String(level.color || '#64748b');
            if (!editingScale) {
              return (
                <li
                  key={`${activeScaleId}-${level.value}-${index}`}
                  className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.colorOutline}`}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 tabular-nums text-sm font-bold"
                    style={{ backgroundColor: hex, color: on.hex }}
                    aria-hidden
                  >
                    {level.value}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {level.label}
                  </span>
                </li>
              );
            }
            return (
              <li
                key={`${activeScaleId}-${level.value}-${index}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(
                    e.dataTransfer.getData('text/level-index') || dragLevelIndex,
                  );
                  setDragLevelIndex(null);
                  if (!Number.isFinite(from)) return;
                  reorderLevels(from, index);
                }}
                className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.colorOutline} ${
                  dragLevelIndex === index ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDragLevelIndex(index);
                    e.dataTransfer.setData('text/level-index', String(index));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragLevelIndex(null)}
                  className={`edu-control shrink-0 p-1 rounded-lg cursor-grab active:cursor-grabbing ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" aria-hidden />
                </button>
                <SpectrumColorPicker
                  value={hex}
                  onChange={(color) => updateLevel(index, { color })}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  ariaLabel={`Level ${level.value} color`}
                  triggerClassName="edu-control w-10 h-10 rounded-full flex items-center justify-center shrink-0 tabular-nums text-sm font-bold border-0 shadow-none"
                  triggerStyle={{ color: on.hex }}
                >
                  {level.value}
                </SpectrumColorPicker>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`edu-control w-20 shrink-0 px-2 py-2 rounded-xl border text-sm tabular-nums ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  value={level.value}
                  placeholder="4 or 90%"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw !== '' && !/^[\d.]*%?$/.test(raw.trim())) return;
                    updateLevel(index, { value: raw });
                  }}
                  onBlur={(e) => {
                    const next = normalizeScaleValue(e.target.value);
                    if (next === '') return;
                    if (String(next) !== String(level.value)) {
                      updateLevel(index, { value: next });
                    }
                  }}
                  aria-label={`Value for ${level.label || 'level'} (number or percentage)`}
                />
                <input
                  className={`edu-control flex-1 min-w-[10rem] px-3 py-2 rounded-xl border text-sm ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  value={level.label}
                  onChange={(e) => updateLevel(index, { label: e.target.value })}
                  placeholder="Level label"
                  aria-label={`Label for level ${level.value}`}
                />
                <button
                  type="button"
                  className="edu-control p-2 rounded-lg text-slate-500 hover:text-rose-600 disabled:opacity-40 shrink-0"
                  onClick={() => removeLevel(index)}
                  aria-label={`Delete level ${level.value}`}
                  disabled={activeLevels.length <= 2}
                  title={
                    activeLevels.length <= 2
                      ? 'Keep at least two levels'
                      : 'Delete level'
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
        </AppBoard>

        <AppBoard mode="scroll" pad="board" theme={theme}>
          <div className={cardHeaderClass(theme)}>
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Survey Categories
              </h2>
              <SectionInfoTip
                text={TEACHER_COLUMNS_HELP}
                label="About survey categories"
                isDarkMode={isDarkMode}
                theme={theme}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className={`${toolBtnClass(isDarkMode)} edu-control ${
                  editingColumns ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={() => setEditingColumns((v) => !v)}
                aria-label={editingColumns ? 'Done editing columns' : 'Edit columns'}
                title={editingColumns ? 'Done' : 'Edit'}
                aria-pressed={editingColumns}
              >
                {editingColumns ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              {editingColumns ? (
                <button
                  type="button"
                  className={`${toolBtnClass(isDarkMode)} edu-control`}
                  onClick={addColumn}
                  aria-label="Add column"
                  title="Add column"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
          <ul className="space-y-2">
            {schema.columns.map((col) => (
              <li key={col.id} className="flex items-center gap-2">
                {editingColumns ? (
                  <input
                    className={`edu-control min-w-0 flex-1 px-3 py-2 rounded-xl border text-sm ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    value={col.label}
                    onChange={(e) => renameColumn(col.id, e.target.value)}
                    aria-label="Column label"
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 px-3 py-2 rounded-xl border text-sm font-medium ${theme.colorOutline} ${
                      isDarkMode
                        ? 'bg-slate-800/50 text-white'
                        : 'bg-slate-50 text-slate-900'
                    } ${col.enabled ? '' : 'opacity-50'}`}
                  >
                    {col.label}
                  </span>
                )}
                <button
                  type="button"
                  className={`edu-control shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full border-[1.5px] transition-colors ${
                    col.enabled
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                      : `bg-transparent ${theme.text} border-current`
                  }`}
                  aria-label={`Enable ${col.label || 'column'}`}
                  aria-pressed={col.enabled}
                  onClick={() => toggleColumn(col.id)}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </AppBoard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <div className="space-y-3">
          {aboveGender}
          <AppBoard mode="scroll" pad="board" theme={theme}>
            <div className={cardHeaderClass(theme)}>
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Gender Colors
                </h2>
                <SectionInfoTip
                  text={GENDER_COLORS_HELP}
                  label="About Gender Colors"
                  isDarkMode={isDarkMode}
                  theme={theme}
                />
              </div>
              <button
                type="button"
                className={`edu-control inline-flex items-center justify-center h-7 w-7 rounded-full border-[1.5px] transition-colors ${
                  genderColors.enabled
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `bg-transparent ${theme.text} border-current`
                }`}
                title="Use gender colors"
                aria-label="Use gender colors"
                aria-pressed={Boolean(genderColors.enabled)}
                onClick={() =>
                  updateGenderColors({ enabled: !genderColors.enabled })
                }
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            {!genderColors.enabled ? (
              <div
                className={`flex overflow-hidden rounded-xl border ${theme.colorOutline} ${TYPE.bodySm}`}
              >
                <div
                  className={`flex-1 px-3 py-3 ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600'}`}
                >
                  White
                </div>
                <div
                  className={`flex-1 px-3 py-3 ${
                    isDarkMode ? 'bg-slate-800/45 text-slate-300' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  Gray
                </div>
              </div>
            ) : (
              <ul className="flex flex-wrap items-center gap-2">
                {GENDER_COLOR_ROWS.map((row) => {
                  const hex = String(genderColors[row.key] || '#64748b');
                  const on = bestOnColor(hex);
                  return (
                    <li key={row.key} className="shrink-0">
                      <SpectrumColorPicker
                        value={hex}
                        onChange={(color) => updateGenderColors({ [row.key]: color })}
                        isDarkMode={isDarkMode}
                        theme={theme}
                        ariaLabel={`${row.label} color`}
                        triggerClassName="edu-control h-10 min-w-[6rem] px-3 rounded-xl flex items-center justify-center text-xs font-semibold border-0 shadow-none"
                        triggerStyle={{ color: on.hex }}
                      >
                        {row.label}
                      </SpectrumColorPicker>
                    </li>
                  );
                })}
              </ul>
            )}
          </AppBoard>

          <AppBoard mode="scroll" pad="board" theme={theme}>
            <div className={cardHeaderClass(theme)}>
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sort Priority
                </h2>
                <SectionInfoTip
                  text={SORT_PRIORITY_HELP}
                  label="About Sort Priority"
                  isDarkMode={isDarkMode}
                  theme={theme}
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  className={`${toolBtnClass(isDarkMode)} edu-control ${
                    editingPriority ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                  }`}
                  onClick={() => setEditingPriority((v) => !v)}
                  aria-label={editingPriority ? 'Done editing priority' : 'Edit priority'}
                  title={editingPriority ? 'Done' : 'Edit'}
                  aria-pressed={editingPriority}
                >
                  {editingPriority ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
                {editingPriority ? (
                  <button
                    type="button"
                    className={`${toolBtnClass(isDarkMode)} edu-control`}
                    onClick={resetPriority}
                    aria-label="Reset default priority"
                    title="Reset default"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
            <ol className="space-y-2">
              {priorityOrder.map((key, index) => (
                <li key={key} className="flex items-center gap-2.5">
                  <span
                    className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div
                    className={`min-w-0 flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-xl border ${theme.colorOutline}`}
                  >
                    <span
                      className={`min-w-0 font-medium ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {PRIORITY_LABELS[key] || key}
                    </span>
                    {editingPriority ? (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="edu-control p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => movePriority(index, -1)}
                          aria-label="Move up"
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="edu-control p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => movePriority(index, 1)}
                          aria-label="Move down"
                          disabled={index === priorityOrder.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </AppBoard>
        </div>

        <AppBoard mode="scroll" pad="board" theme={theme}>
          <div className={cardHeaderClass(theme)}>
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Service Tags
              </h2>
              <SectionInfoTip
                text={SERVICES_TAGS_HELP}
                label="About Service Tags"
                isDarkMode={isDarkMode}
                theme={theme}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className={`${toolBtnClass(isDarkMode)} edu-control ${
                  editingTags ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={() => setEditingTags((v) => !v)}
                aria-label={editingTags ? 'Done editing tags' : 'Edit tags'}
                title={editingTags ? 'Done' : 'Edit'}
                aria-pressed={editingTags}
              >
                {editingTags ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              {editingTags ? (
                <button
                  type="button"
                  className={`${toolBtnClass(isDarkMode)} edu-control`}
                  onClick={addTag}
                  aria-label="Add tag"
                  title="Add tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
          <ul className="space-y-2">
            {schema.serviceTags.map((tag) => (
              <li key={tag.id} className="flex items-center gap-2">
                {editingTags ? (
                  <>
                    <input
                      className={`edu-control flex-1 px-3 py-2 rounded-xl border text-sm ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                      value={tag.label}
                      onChange={(e) => updateTag(tag.id, e.target.value)}
                      aria-label="Service tag label"
                    />
                    <button
                      type="button"
                      className="edu-control p-2 text-slate-500 hover:text-rose-600"
                      onClick={() => removeTag(tag.id)}
                      aria-label={`Delete ${tag.label || 'tag'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span
                    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium ${theme.colorOutline} ${
                      isDarkMode
                        ? 'bg-slate-800/50 text-white'
                        : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    {tag.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </AppBoard>
      </div>
    </div>
  );
}
