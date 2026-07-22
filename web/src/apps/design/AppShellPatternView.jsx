import { SHELL_MAIN_PADDING, SHELL_PADDING_PX } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

/**
 * Edu.Design — App Shell pattern (from scratch).
 * Shell edge padding is visualized by AppShell itself when this view is active;
 * this fills the padded content area.
 */
export function AppShellPatternView({ isDarkMode, theme }) {
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const title = isDarkMode ? 'text-white' : 'text-slate-900';
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const frame = isDarkMode
    ? 'border-slate-600 bg-slate-900/80'
    : 'border-slate-300 bg-white';

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div
        className={`flex-1 min-h-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center px-6 py-10 text-center ${frame}`}
      >
        <p
          className={`${TYPE.labelMicro} mb-2 ${muted}`}
        >
          App content
        </p>
        <h1 className={`${TYPE.titleMd} ${title}`}>App Shell</h1>
        <p className={`${TYPE.bodyMd} mt-2 max-w-md ${body}`}>
          Building from scratch. The green bands around this area are the real{' '}
          <code className={`font-mono ${TYPE.bodySm}`}>{SHELL_MAIN_PADDING}</code> inset on{' '}
          <code className={`font-mono ${TYPE.bodySm}`}>&lt;main&gt;</code> — not a mock preview.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-left max-w-sm w-full">
          <div>
            <dt className={`${TYPE.labelMicro} ${muted}`}>
              Mobile / tablet
            </dt>
            <dd className={`${TYPE.titleSm} font-mono mt-0.5 ${title}`}>
              {SHELL_PADDING_PX.base}px · p-4
            </dd>
          </div>
          <div>
            <dt className={`${TYPE.labelMicro} ${muted}`}>
              Desktop (lg+)
            </dt>
            <dd className={`${TYPE.titleSm} font-mono mt-0.5 ${title}`}>
              {SHELL_PADDING_PX.lg}px · lg:p-6
            </dd>
          </div>
        </dl>
        <p className={`${TYPE.bodySm} mt-6 ${theme.text}`}>
          Token: <code className="font-mono">{SHELL_MAIN_PADDING}</code>
        </p>
      </div>
    </div>
  );
}
