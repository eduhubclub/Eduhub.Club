import { useState } from 'react';
import { Grid, Home, Layers, Menu, Search, User } from 'lucide-react';
import { LogoIcon2x2 } from './Logo';
import {
  APP_BOARD_MAX_WIDTH,
  APP_EMPTY_SLOT,
  APP_GRID_CARD,
  APP_NESTED_CARD,
  APP_SCROLL_BOARD,
  APP_STATIC_BOARD,
} from './layout';
import { PREVIEW_BREAKPOINTS } from './previewBreakpoints';
import { TYPE } from './typography';

/** @typedef {import('./previewBreakpoints').PreviewBreakpoint} PreviewBreakpoint */
/** @typedef {'static' | 'scroll' | 'grid' | 'nested' | 'empty'} CardType */

const CARD_TYPES = [
  {
    id: 'static',
    label: 'Static',
    token: 'APP_STATIC_BOARD',
    note: 'Fills content area · max-w-7xl · shell does not scroll',
  },
  {
    id: 'scroll',
    label: 'Scrolling',
    token: 'APP_SCROLL_BOARD',
    note: 'Same chrome as static · if past the bottom edge, regular scrollbar',
  },
  {
    id: 'grid',
    label: 'Grid',
    token: 'APP_GRID_CARD',
    note: 'Content-sized · dynamic grid · set min cards per row',
  },
  {
    id: 'nested',
    label: 'Nested',
    token: 'APP_NESTED_CARD',
    note: 'Soft fill inside a board · compact title + caption',
  },
  {
    id: 'empty',
    label: 'Empty',
    token: 'APP_EMPTY_SLOT',
    note: 'Dashed frame · short centered prompt',
  },
];

function PaddingBand({ sizeClass }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-emerald-400/35 shrink-0 ${sizeClass}`}
      aria-hidden
    />
  );
}

/**
 * Live previews for Static / Scrolling / Grid boards (+ nested / empty helpers)
 * inside a mini AppShell at Mobile / Tablet / Desktop.
 */
export function ContentCardStylesPreview({ isDarkMode, theme }) {
  const [breakpoint, setBreakpoint] = useState(/** @type {PreviewBreakpoint} */ ('desktop'));
  const [cardType, setCardType] = useState(/** @type {CardType} */ ('static'));
  const bp = PREVIEW_BREAKPOINTS[breakpoint];
  const typeMeta = CARD_TYPES.find((t) => t.id === cardType) || CARD_TYPES[0];

  const chrome = isDarkMode
    ? 'bg-slate-900 border-slate-600 text-slate-300'
    : 'bg-white border-slate-300 text-slate-600';
  const sidebar = `${theme.colorSurface} ${theme.colorOutline}`;
  const header = `${theme.colorSurface} ${theme.colorOutline}`;
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const headerBar = isDarkMode
    ? 'border-slate-600 bg-slate-900 text-slate-500'
    : 'border-slate-300 bg-slate-100 text-slate-400';
  const nestedFill = isDarkMode
    ? 'bg-slate-800/60 border-slate-600'
    : 'bg-slate-50 border-slate-200';
  const emptyFill = isDarkMode
    ? 'border-slate-600 text-slate-500'
    : 'border-slate-300 text-slate-400';
  const titleColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const bodyColor = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const padLabel = `${bp.padPx}px`;

  const actions = (
    <div className="mt-4 flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center h-8 px-3 rounded-lg text-[10px] font-bold ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      >
        Primary
      </span>
      <span
        className={`inline-flex items-center h-8 px-3 rounded-lg text-[10px] font-bold border ${
          isDarkMode
            ? 'border-slate-600 text-slate-300'
            : 'border-slate-300 text-slate-600'
        }`}
      >
        Secondary
      </span>
    </div>
  );

  const cardBody = (() => {
    if (cardType === 'empty') {
      return (
        <div
          className={`${APP_EMPTY_SLOT} ${bp.cardPad} min-h-[7rem] flex flex-col items-center justify-center gap-1.5 ${emptyFill}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">Empty slot</p>
          <p className={`text-[9px] text-center max-w-[12rem] ${muted}`}>
            Short prompt for the next action
          </p>
        </div>
      );
    }

    if (cardType === 'nested') {
      return (
        <div className={`${APP_SCROLL_BOARD} ${bp.cardPad} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${bp.title} font-bold mb-3 ${titleColor}`}>Scrolling board</p>
          <div className={`${APP_NESTED_CARD} ${bp.nestedPad} ${nestedFill}`}>
            <p className={`text-[11px] font-bold ${theme.text}`}>Nested card</p>
            <p className={`text-[9px] font-mono mt-1 ${muted}`}>{APP_NESTED_CARD}</p>
            <p className={`text-[10px] mt-2 ${bodyColor}`}>
              Compact label + one supporting caption.
            </p>
          </div>
        </div>
      );
    }

    if (cardType === 'static') {
      return (
        <div
          className={`${APP_STATIC_BOARD} ${bp.cardPad} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${bp.title} font-bold ${titleColor}`}>Static board</p>
          <p className={`text-[10px] font-mono mt-0.5 ${muted}`}>
            APP_STATIC_BOARD · {APP_BOARD_MAX_WIDTH} · {bp.cardPad}
          </p>
          <p className={`${bp.body} mt-3 leading-relaxed ${bodyColor}`}>
            Fills the content area. Shell and board do not scroll. Width tracks available space up to max-w-7xl.
          </p>
          <div className="mt-auto">{actions}</div>
        </div>
      );
    }

    if (cardType === 'scroll') {
      return (
        <div className="space-y-3 pb-2">
          <div
            className={`${APP_SCROLL_BOARD} ${bp.cardPad} ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <p className={`${bp.title} font-bold ${titleColor}`}>Scrolling board</p>
            <p className={`text-[10px] font-mono mt-0.5 ${muted}`}>
              APP_SCROLL_BOARD · {APP_BOARD_MAX_WIDTH} · {bp.cardPad}
            </p>
            <p className={`${bp.body} mt-3 leading-relaxed ${bodyColor}`}>
              Same chrome as a static board. Height follows content — if it stretches past the
              bottom of the screen, the regular scrollbar appears.
            </p>
            {actions}
            <p className={`text-[10px] mt-6 leading-relaxed ${muted}`}>
              Extra content continues below so the board is taller than the viewport…
            </p>
            <p className={`text-[10px] mt-3 leading-relaxed ${muted}`}>
              …and scrolling is just the normal page scrollbar — nothing special.
            </p>
          </div>
        </div>
      );
    }

    // grid
    return (
      <div className={`grid gap-2 ${bp.showSidebar ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {['A', 'B', 'C', 'D'].slice(0, bp.showSidebar ? 4 : 2).map((label) => (
          <div
            key={label}
            className={`${APP_GRID_CARD} ${bp.cardPad} ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <p className={`${bp.title} font-bold ${titleColor}`}>Grid card {label}</p>
            <p className={`text-[10px] font-mono mt-0.5 ${muted}`}>APP_GRID_CARD</p>
            <p className={`text-[10px] mt-2 ${bodyColor}`}>Fits content. Min per row is set per app.</p>
          </div>
        ))}
      </div>
    );
  })();

  const staticSlot = cardType === 'static';

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'border-slate-600' : 'border-slate-300'
      }`}
    >
      <div
        className={`px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b ${headerBar}`}
      >
        <span className={`${TYPE.labelMicro} shrink-0`}>
          Live preview — {typeMeta.label.toLowerCase()}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex rounded-lg p-0.5 ${
              isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-300'
            }`}
            role="group"
            aria-label="Card type"
          >
            {CARD_TYPES.map((t) => {
              const active = cardType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCardType(/** @type {CardType} */ (t.id))}
                  className={`px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${
                    active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div
            className={`flex rounded-lg p-0.5 ${
              isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-300'
            }`}
            role="group"
            aria-label="Preview breakpoint"
          >
            {Object.entries(PREVIEW_BREAKPOINTS).map(([id, cfg]) => {
              const active = breakpoint === id;
              const BtnIcon = cfg.Icon;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  title={cfg.label}
                  onClick={() => setBreakpoint(/** @type {PreviewBreakpoint} */ (id))}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold transition-colors ${
                    active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : isDarkMode
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BtnIcon size={11} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        <div className={bp.frame}>
          <div
            className={`rounded-xl border overflow-hidden flex w-full ${bp.shell} ${chrome}`}
            aria-label={`${typeMeta.label} card content styles at ${bp.label}`}
          >
            {bp.showSidebar ? (
              <aside
                className={`${bp.sidebarCollapsed ? 'w-14' : 'w-16'} shrink-0 border-r flex flex-col ${sidebar}`}
                aria-hidden
              >
                <div className={`h-11 border-b flex items-center justify-center ${header}`}>
                  <LogoIcon2x2 className="w-6 h-6" />
                </div>
                <nav className="flex-1 px-1.5 py-2 space-y-1">
                  <div
                    className={`h-8 rounded-lg flex items-center justify-center ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  >
                    <Home size={14} strokeWidth={2.5} />
                  </div>
                  <div className={`h-8 rounded-lg flex items-center justify-center ${muted}`}>
                    <Layers size={14} />
                  </div>
                  {!bp.sidebarCollapsed ? (
                    <div className={`h-8 rounded-lg flex items-center justify-center ${muted}`}>
                      <Grid size={14} />
                    </div>
                  ) : null}
                </nav>
              </aside>
            ) : null}

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <header
                className={`h-11 shrink-0 border-b px-3 flex items-center justify-between ${header}`}
                aria-hidden
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {!bp.showSidebar ? <Menu size={12} className={muted} /> : null}
                  <div className="flex items-baseline gap-0.5 min-w-0">
                    <span className="text-[10px] font-bold truncate">Edu.</span>
                    <span className={`text-[10px] font-bold truncate ${theme.text}`}>Hub</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Search size={12} className={muted} />
                  <Grid size={12} className={muted} />
                  <User size={12} className={muted} />
                </div>
              </header>

              <main className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                <PaddingBand sizeClass={bp.bandH} />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <PaddingBand sizeClass={bp.bandW} />
                  <div
                    className={`flex-1 min-w-0 min-h-0 ${
                      staticSlot ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
                    }`}
                  >
                    {cardBody}
                  </div>
                  <PaddingBand sizeClass={bp.bandW} />
                </div>
                <PaddingBand sizeClass={bp.bandH} />
              </main>
            </div>
          </div>
        </div>

        <p className={`text-center text-[10px] ${muted}`}>
          <code className="font-mono">{typeMeta.token}</code>
          {' · '}
          {typeMeta.note}
          {' · '}
          shell {padLabel}
        </p>
      </div>
    </div>
  );
}
