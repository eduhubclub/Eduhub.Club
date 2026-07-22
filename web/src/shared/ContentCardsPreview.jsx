import { useState } from 'react';
import { Grid, Home, Layers, Menu, Search, User } from 'lucide-react';
import { LogoIcon2x2 } from './Logo';
import {
  APP_GRID_CARD,
  APP_EMPTY_SLOT,
  APP_NESTED_CARD,
} from './layout';
import { PREVIEW_BREAKPOINTS } from './previewBreakpoints';
import { TYPE } from './typography';

/** @typedef {import('./previewBreakpoints').PreviewBreakpoint} PreviewBreakpoint */

function PaddingBand({ sizeClass }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-emerald-400/35 shrink-0 ${sizeClass}`}
      aria-hidden
    />
  );
}

/**
 * Live preview of grid / nested / empty cards inside a mini AppShell
 * at Mobile / Tablet / Desktop aspect ratios.
 */
export function ContentCardsPreview({ isDarkMode, theme }) {
  const [breakpoint, setBreakpoint] = useState(/** @type {PreviewBreakpoint} */ ('desktop'));
  const bp = PREVIEW_BREAKPOINTS[breakpoint];

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
  const padLabel = `${bp.padPx}px`;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'border-slate-600' : 'border-slate-300'
      }`}
    >
      <div
        className={`px-3 py-2 flex items-center justify-between gap-3 border-b ${headerBar}`}
      >
        <span className={`${TYPE.labelMicro} shrink-0`}>
          Live preview
        </span>
        <div
          className={`flex rounded-lg p-0.5 shrink-0 ${
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

      <div className="p-3 sm:p-4 space-y-3">
        <div className={bp.frame}>
          <div
            className={`rounded-xl border overflow-hidden flex w-full ${bp.shell} ${chrome}`}
            aria-label={`Content card in shell at ${bp.label}`}
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
                  <div className="flex-1 min-w-0 min-h-0 overflow-auto">
                    <div
                      className={`${APP_GRID_CARD} ${bp.cardPad} h-full min-h-0 ${theme.colorSurface} ${theme.colorOutline}`}
                    >
                      <p
                        className={`${bp.title} font-bold mb-0.5 ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Grid card
                      </p>
                      <p className={`text-[9px] font-mono mb-2 ${muted}`}>
                        {APP_GRID_CARD} · shell {padLabel}
                      </p>
                      <div className={`grid ${bp.grid} gap-2`}>
                        <div className={`${APP_NESTED_CARD} ${bp.nestedPad} ${nestedFill}`}>
                          <p className={`text-[10px] font-bold ${theme.text}`}>Nested card</p>
                          <p className={`text-[8px] font-mono mt-1 ${muted}`}>
                            {APP_NESTED_CARD}
                          </p>
                        </div>
                        <div
                          className={`${APP_EMPTY_SLOT} min-h-[2.75rem] flex items-center justify-center text-[10px] font-bold ${emptyFill}`}
                        >
                          Empty slot
                        </div>
                      </div>
                    </div>
                  </div>
                  <PaddingBand sizeClass={bp.bandW} />
                </div>
                <PaddingBand sizeClass={bp.bandH} />
              </main>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {[
            {
              swatch: 'bg-emerald-400/35',
              label: 'Shell padding',
              detail: padLabel,
            },
            {
              swatch: `${theme.colorSurface} border ${theme.colorOutline}`,
              label: 'Grid card',
              detail: APP_GRID_CARD,
            },
            {
              swatch: isDarkMode
                ? 'bg-slate-800/60 border border-slate-600'
                : 'bg-slate-50 border border-slate-200',
              label: 'Nested card',
              detail: APP_NESTED_CARD,
            },
            {
              swatch: isDarkMode
                ? 'border border-dashed border-slate-600'
                : 'border border-dashed border-slate-300',
              label: 'Empty slot',
              detail: APP_EMPTY_SLOT,
            },
          ].map(({ swatch, label, detail }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded shrink-0 ${swatch}`} aria-hidden />
              <div>
                <p
                  className={`text-[10px] font-bold leading-none ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {label}
                </p>
                <p className={`text-[9px] font-mono ${muted}`}>{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <p className={`text-center text-[10px] ${muted}`}>{bp.note}</p>
      </div>
    </div>
  );
}
