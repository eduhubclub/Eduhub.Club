import { APP_EMPTY_SLOT } from './layout';
import { TYPE } from './typography';

/**
 * Standard empty main-area state.
 *
 * Today: dashed frame + message.
 * Later: pass `illustration` (img, SVG, or component) to replace the frame.
 *         Keep `message` — it stays under the graphic. Type: TYPE.bodyMd.
 */
export function EmptyState({
  message,
  illustration = null,
  isDarkMode = false,
  className = '',
}) {
  const frameClass = illustration
    ? 'flex flex-col items-center justify-center min-h-48 sm:min-h-64 px-4 py-8'
    : `flex flex-col items-center justify-center min-h-48 sm:min-h-64 ${APP_EMPTY_SLOT} px-4 ${
        isDarkMode ? 'border-slate-700' : 'border-slate-300'
      }`;

  return (
    <div className={`${frameClass} ${className}`.trim()}>
      {illustration ? (
        <div className="mb-4 w-full max-w-xs sm:max-w-sm flex items-center justify-center">
          {illustration}
        </div>
      ) : null}
      <p className={`${TYPE.bodyMd} text-slate-500 text-center max-w-md`}>{message}</p>
    </div>
  );
}
