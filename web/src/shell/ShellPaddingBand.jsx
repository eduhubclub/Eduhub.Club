import { SHELL_PADDING_PX } from '../shared/layout';

/**
 * Visible AppShell main-inset bands (matches SHELL_MAIN_PADDING: p-4 / lg:p-6).
 * Used by Edu.Design App Shell pattern so padding is shown on the real shell.
 */
export function ShellPaddingBand({ edge }) {
  const isSide = edge === 'side';

  return (
    <div
      className={`relative flex items-center justify-center bg-emerald-400/35 shrink-0 ${
        isSide ? 'w-4 lg:w-6' : 'h-4 lg:h-6'
      }`}
      aria-hidden
    >
      <span
        className={`text-[8px] font-black leading-none text-emerald-900/80 select-none ${
          isSide ? '[writing-mode:vertical-lr] rotate-180' : ''
        }`}
      >
        <span className="lg:hidden">{SHELL_PADDING_PX.base}px</span>
        <span className="hidden lg:inline">{SHELL_PADDING_PX.lg}px</span>
      </span>
    </div>
  );
}

/**
 * Paint shell padding on top of live SHELL_MAIN_PADDING (no layout change).
 * Used by Live View → Space so AppShell inset stays scrollable.
 */
export function ShellPaddingOverlay() {
  const label = (
    <>
      <span className="lg:hidden">{SHELL_PADDING_PX.base}</span>
      <span className="hidden lg:inline">{SHELL_PADDING_PX.lg}</span>
    </>
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-[1]" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-4 lg:h-6 bg-emerald-400/40 flex items-center justify-center outline outline-1 outline-orange-400/70">
        <span className="text-[8px] font-black leading-none text-emerald-950 tabular-nums select-none">
          {label}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-4 lg:h-6 bg-emerald-400/40 flex items-center justify-center outline outline-1 outline-orange-400/70">
        <span className="text-[8px] font-black leading-none text-emerald-950 tabular-nums select-none">
          {label}
        </span>
      </div>
      <div className="absolute inset-y-0 left-0 w-4 lg:w-6 bg-emerald-400/40 flex items-center justify-center outline outline-1 outline-orange-400/70">
        <span className="text-[8px] font-black leading-none text-emerald-950 tabular-nums select-none [writing-mode:vertical-lr] rotate-180">
          {label}
        </span>
      </div>
      <div className="absolute inset-y-0 right-0 w-4 lg:w-6 bg-emerald-400/40 flex items-center justify-center outline outline-1 outline-orange-400/70">
        <span className="text-[8px] font-black leading-none text-emerald-950 tabular-nums select-none [writing-mode:vertical-lr] rotate-180">
          {label}
        </span>
      </div>
    </div>
  );
}
