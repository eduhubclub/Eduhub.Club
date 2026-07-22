import { useState } from 'react';
import { Grid, Home, Layers, Menu, Search, User } from 'lucide-react';
import { LogoIcon2x2 } from './Logo';
import { PREVIEW_BREAKPOINTS } from './previewBreakpoints';
import { TYPE } from './typography';

/** @typedef {import('./previewBreakpoints').PreviewBreakpoint} PreviewBreakpoint */

/** Tiny label sitting inside a spacing band. */
function SpacingLabel({ children, vertical = false }) {
  return (
    <span
      className={`text-[8px] font-black leading-none text-emerald-900/80 select-none ${
        vertical ? '[writing-mode:vertical-lr] rotate-180' : ''
      }`}
    >
      {children}
    </span>
  );
}

/** Colored band representing padding with a pixel label. */
function PaddingBand({ sizeClass, label, vertical = false }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-emerald-400/35 shrink-0 ${sizeClass}`}
      aria-hidden
    >
      {label ? <SpacingLabel vertical={vertical}>{label}</SpacingLabel> : null}
    </div>
  );
}

/**
 * Miniature AppShell mockup with color-coded spacing annotations.
 * Used in the Design Guide to show where SHELL_MAIN_PADDING applies.
 * Frame aspect matches Mobile / Tablet / Desktop.
 */
export function ShellInsetPreview({ isDarkMode, theme }) {
  const [breakpoint, setBreakpoint] = useState(/** @type {PreviewBreakpoint} */ ('desktop'));
  const bp = PREVIEW_BREAKPOINTS[breakpoint];

  const chrome = isDarkMode
    ? 'bg-slate-900 border-slate-600 text-slate-300'
    : 'bg-white border-slate-300 text-slate-600';
  const sidebar = `${theme.colorSurface} ${theme.colorOutline}`;
  const header = `${theme.colorSurface} ${theme.colorOutline}`;
  const content = isDarkMode
    ? 'bg-slate-800/80 border-slate-600 text-slate-300'
    : 'bg-white border-slate-300 text-slate-600';
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const padLabel = `${bp.padPx}px`;

  const headerBar = isDarkMode
    ? 'border-slate-600 bg-slate-900 text-slate-500'
    : 'border-slate-300 bg-slate-100 text-slate-400';

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
            aria-label={`App shell preview at ${bp.label} — ${padLabel} main padding · ${bp.note}`}
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

              <main className="relative flex-1 flex flex-col min-h-0">
                <PaddingBand sizeClass={bp.bandH} label={padLabel} />

                <div className="flex flex-1 min-h-0">
                  <PaddingBand sizeClass={bp.bandW} label={padLabel} vertical />

                  <div
                    className={`flex-1 min-w-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center px-2 ${content}`}
                  >
                    <p className="text-[10px] font-bold">App content</p>
                    <p className={`text-[9px] mt-0.5 text-center ${muted}`}>
                      {bp.padToken} · {padLabel}
                    </p>
                  </div>

                  <PaddingBand sizeClass={bp.bandW} label={padLabel} vertical />
                </div>

                <PaddingBand sizeClass={bp.bandH} label={padLabel} />
              </main>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {[
            {
              swatch: 'bg-emerald-400/35',
              label: 'Padding — main inset',
              detail: `${padLabel} (${bp.padToken})`,
            },
            {
              swatch: `${theme.colorSurface} border ${theme.colorOutline}`,
              label: 'Chrome — sidebar',
              detail: bp.showSidebar ? 'no shell padding' : 'drawer on mobile',
            },
            {
              swatch: `${theme.colorSurface} border ${theme.colorOutline}`,
              label: 'Chrome — header',
              detail: 'no shell padding',
            },
            {
              swatch: isDarkMode
                ? 'bg-slate-800/80 border border-dashed border-slate-600'
                : 'bg-white border border-dashed border-slate-300',
              label: 'Content — app view',
              detail: 'fills padded area',
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
                <p className={`text-[9px] ${muted}`}>{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
