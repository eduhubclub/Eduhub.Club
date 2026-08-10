import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  SECONDARY_STRATEGIES,
} from './colorThemeFamilies';

/**
 * Compact strategy chips — centered, with a divider below.
 */
function StrategyRow({
  options,
  value,
  onChange,
  isDarkMode,
  /** Playground Primary / On Primary — stay in sync with seed + Adjust. */
  accentHex,
  onAccentHex,
}) {
  const idle = isDarkMode
    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';
  const divider = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`border-b pb-3 ${divider}`}>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.blurb}
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              className={`edu-control rounded-xl px-3.5 py-2 text-sm font-semibold transition-[background-color,color] duration-200 ${
                active ? '' : idle
              }`}
              style={
                active && accentHex
                  ? { backgroundColor: accentHex, color: onAccentHex }
                  : undefined
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Single role swatch — fill + label; ink via WCAG onHex.
 */
function RoleSwatch({ role, className = '', compact = false }) {
  if (!role) return null;
  return (
    <div
      className={`flex min-w-0 flex-col justify-between px-2.5 py-2 transition-[background-color,color] duration-200 ${
        compact
          ? 'min-h-[2.5rem]'
          : role.tall
            ? 'min-h-[4.5rem] flex-1'
            : 'min-h-[3rem]'
      } ${className}`}
      style={{ backgroundColor: role.hex, color: role.onHex }}
    >
      <span className="text-[10px] font-semibold leading-snug tracking-wide sm:text-[11px]">
        {role.label}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-tight opacity-80 sm:text-[10px]">
        {role.hex}
      </span>
    </div>
  );
}

/** Static class maps so Tailwind keeps the utilities. */
const SPLIT_COLS = {
  2: 'grid-cols-1 @[12rem]:grid-cols-2',
  3: 'grid-cols-1 @[14rem]:grid-cols-3',
  4: 'grid-cols-1 @[12rem]:grid-cols-2 @[18rem]:grid-cols-4',
  5: 'grid-cols-1 @[12rem]:grid-cols-2 @[20rem]:grid-cols-5',
};

/**
 * 1 swatch → full width. 2+ → stack until the @container is wide enough, then split.
 */
function SwatchRow({ roles, edge = '', compact = false, className = '' }) {
  const items = (roles || []).filter(Boolean);
  if (!items.length) return null;

  const topBorder = edge ? `border-t ${edge}` : '';

  if (items.length === 1) {
    return (
      <RoleSwatch
        role={items[0]}
        compact={compact}
        className={`${topBorder} ${className}`}
      />
    );
  }

  const cols =
    SPLIT_COLS[Math.min(items.length, 5)] || SPLIT_COLS[2];

  return (
    <div className={`grid ${cols} ${topBorder} ${className}`}>
      {items.map((role, i) => (
        <RoleSwatch
          key={role.id}
          role={role}
          compact={compact}
          className={
            i === 0
              ? ''
              : `border-t ${edge} @[12rem]:border-t-0 @[12rem]:border-l`
          }
        />
      ))}
    </div>
  );
}

/**
 * Primary / Secondary / Tertiary / Error column.
 * Primary also shows Accent Container (soft tint) under Primary Container.
 */
function AccentColumn({ column, isDarkMode }) {
  const edge = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  const hasAccent = Boolean(column.accentContainer);

  return (
    <div
      className={`@container flex min-w-0 flex-col overflow-hidden rounded-lg border ${edge}`}
    >
      <RoleSwatch role={column.main} />
      <RoleSwatch role={column.onMain} compact className={`border-t ${edge}`} />
      <RoleSwatch role={column.container} className={`border-t ${edge}`} />
      <RoleSwatch
        role={column.onContainer}
        compact
        className={`border-t ${edge}`}
      />
      {hasAccent ? (
        <>
          <RoleSwatch
            role={column.accentContainer}
            className={`border-t ${edge}`}
          />
          <RoleSwatch
            role={column.onAccentContainer}
            compact
            className={`border-t ${edge}`}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * Edu.Hub surfaces — Background / Surface / Surface Variant + ink & outline.
 */
function SurfacesBlock({ surfaces, isDarkMode }) {
  const edge = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  return (
    <div
      className={`@container overflow-hidden rounded-xl border ${edge}`}
    >
      <SwatchRow roles={surfaces.top} edge="" />
      {surfaces.containers?.length ? (
        <SwatchRow roles={surfaces.containers} edge={edge} compact />
      ) : null}
      <SwatchRow roles={surfaces.ink} edge={edge} compact />
    </div>
  );
}

/**
 * Inverse stack + Scrim / Shadow.
 */
function InverseBlock({ inverse, isDarkMode }) {
  const edge = isDarkMode ? 'border-slate-600' : 'border-slate-200';
  return (
    <div
      className={`@container overflow-hidden rounded-xl border ${edge}`}
    >
      {inverse.stack.map((role, i) => (
        <RoleSwatch
          key={role.id}
          role={role}
          className={i > 0 ? `border-t ${edge}` : ''}
        />
      ))}
      <SwatchRow roles={inverse.utility} edge={edge} compact />
    </div>
  );
}

/**
 * Edu.Hub color roles board — accents from M3, chrome adapted for white/dark boards.
 */
export function ColorThemeRolesCard({
  themeRoles,
  isDarkMode,
  theme,
  title = 'Color Theme',
  description = 'Primary Container is default board chrome (white / dark). Accent Container is the soft tint — use sparingly so color pops on clean surfaces.',
  defaultOpen = true,
  collapsible = true,
  secondaryStrategy,
  onSecondaryStrategyChange,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-600'
    : 'bg-white border-slate-300';
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const board = themeRoles?.board;
  const tokens = themeRoles?.tokens;
  const showStrategies = typeof onSecondaryStrategyChange === 'function';
  // Prefer playground Primary so Scheme chips track seed / Adjust / HSL.
  const accentHex =
    tokens?.colorPrimary?.hex ||
    (typeof theme?.colorPrimary === 'string' && theme.colorPrimary.startsWith('#')
      ? theme.colorPrimary
      : undefined);
  const onAccentHex =
    tokens?.colorOnPrimary?.hex || tokens?.colorOnPrimary?.onHex || '#ffffff';

  return (
    <article
      className={`${APP_GRID_CARD} relative min-w-0 overflow-hidden ${surface}`}
    >
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          onClick={() => setOpen((v) => !v)}
          className={`edu-control absolute top-2 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-colors sm:top-2.5 sm:right-3 ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.25}
            className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      ) : null}

      <div
        className={`px-4 py-3 sm:px-5 ${collapsible ? 'pr-12 sm:pr-14' : ''} ${
          open
            ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`
            : ''
        }`}
      >
        <h3 className={`${TYPE.titleSm} ${titleColor}`}>{title}</h3>
        {description ? (
          <p className={`mt-1 text-xs ${muted}`}>{description}</p>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-3 p-3 sm:p-4">
          {showStrategies ? (
            <StrategyRow
              options={SECONDARY_STRATEGIES}
              value={secondaryStrategy}
              onChange={onSecondaryStrategyChange}
              isDarkMode={isDarkMode}
              accentHex={accentHex}
              onAccentHex={onAccentHex}
            />
          ) : null}

          {board ? (
            <div className="space-y-3">
              {/* Accent columns: Primary (+ Accent Container) · Secondary · Tertiary · Error */}
              <div className="@container">
                <div className="grid grid-cols-1 items-start gap-2 @[28rem]:grid-cols-2 @[48rem]:grid-cols-4 @[48rem]:gap-2.5">
                  {board.accents.map((column) => (
                    <AccentColumn
                      key={column.id}
                      column={column}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
              </div>

              {/* Surfaces + Inverse */}
              <div className="@container grid gap-3 @[40rem]:grid-cols-[minmax(0,1.65fr)_minmax(12rem,0.7fr)]">
                <SurfacesBlock
                  surfaces={board.surfaces}
                  isDarkMode={isDarkMode}
                />
                <InverseBlock inverse={board.inverse} isDarkMode={isDarkMode} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
