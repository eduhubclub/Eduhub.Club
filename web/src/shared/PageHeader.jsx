import { Info } from 'lucide-react';
import { useAppInfo } from './AppInfo';
import { TYPE, typeRoleLabel } from './typography';

/**
 * Optional page chrome for page-shaped screens (lists, settings, directories,
 * empty gates that need a title + short explanation).
 *
 * Do not use on widget/stage tools — sidebar/nav already names the tool, and
 * Hub Apps → Description covers app-level explanations. Stage tools use a
 * toolbar (ButtonRow) and board only.
 *
 * Type: TYPE.titleLg + TYPE.bodyMd. Info sits beside the title and opens the
 * App Info overlay (or a custom `onInfoClick`). Optional `leading` / `actions`.
 * `fontsDebug` — Live View Fonts mode: mark title/description for TYPE probes.
 */
export function PageHeader({
  title,
  description,
  isDarkMode,
  actions,
  leading,
  onInfoClick,
  infoLabel = 'About this app',
  fontsDebug = false,
}) {
  const appInfo = useAppInfo();
  const handleInfo = onInfoClick ?? appInfo?.openAppInfo;

  return (
    <div
      className={`mb-4 sm:mb-5 max-w-7xl flex items-start gap-3 ${
        actions ? 'justify-between' : ''
      }`}
    >
      <div className="min-w-0 flex items-start gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1
              className={`${TYPE.titleLg} ${fontsDebug ? 'edu-type-probe' : 'truncate'} ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
              {...(fontsDebug
                ? { 'data-edu-type': 'titleLg', 'data-edu-type-label': typeRoleLabel('titleLg') }
                : {})}
            >
              {title}
            </h1>
            <button
              type="button"
              onClick={handleInfo}
              title={infoLabel}
              aria-label={infoLabel}
              className={`edu-control shrink-0 p-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Info size={18} strokeWidth={2} />
            </button>
          </div>
          {description && (
            <p
              className={`${TYPE.bodyMd} mt-1 ${fontsDebug ? 'edu-type-probe' : ''} ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
              {...(fontsDebug
                ? { 'data-edu-type': 'bodyMd', 'data-edu-type-label': typeRoleLabel('bodyMd') }
                : {})}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {actions ? (
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="flex items-center">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}
