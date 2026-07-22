import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize } from 'lucide-react';
import { APP_STATIC_BOARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

/** Fullscreen overlay sits above shell chrome (sidebar z-70, header menus z-150). */
const FULLSCREEN_Z = 'z-[240]';

/** Shared static-board shell + fullscreen control for Noise Meter stages. */
export function StageChrome({
  isDarkMode,
  theme,
  isFullScreen,
  setIsFullScreen,
  children,
  className = '',
  surfaceClass,
  shellStyle,
  fullscreenVariant = 'default',
}) {
  const surface =
    surfaceClass ??
    (theme
      ? `${theme.colorSurface} ${theme.colorOutline}`
      : isDarkMode
        ? 'bg-slate-900 border-slate-700'
        : 'bg-white border-slate-200');

  useEffect(() => {
    if (!isFullScreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullScreen, setIsFullScreen]);

  const exitBtn =
    fullscreenVariant === 'ghost' ? (
      <button
        type="button"
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute top-4 right-4 z-[60] p-2 rounded-lg text-slate-900/45 hover:text-slate-900/80 transition-colors"
        title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullScreen ? <Minimize size={20} strokeWidth={2.5} /> : <Maximize size={20} strokeWidth={2.5} />}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setIsFullScreen(!isFullScreen)}
        className={`absolute top-4 right-4 z-[60] p-2.5 rounded-full shadow-sm transition-colors ${
          isDarkMode
            ? 'bg-slate-800 text-white hover:bg-slate-700'
            : 'bg-white text-slate-700 hover:bg-slate-50'
        }`}
        title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
        aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullScreen ? <Minimize size={20} strokeWidth={2.5} /> : <Maximize size={20} strokeWidth={2.5} />}
      </button>
    );

  const shell = (
    <div
      className={`${
        isFullScreen
          ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 overflow-hidden flex flex-col ${surface}`
          : `relative w-full ${APP_STATIC_BOARD} ${surface}`
      } ${className}`}
      style={shellStyle}
    >
      {exitBtn}
      {children}
    </div>
  );

  if (isFullScreen && typeof document !== 'undefined') {
    return createPortal(shell, document.body);
  }

  return shell;
}

const SENSITIVITY_MIN = 10;
const SENSITIVITY_MAX = 300;
/** Half of FAB size so the thumb sits lighter next to pause. */
const THUMB_PX = 28;

export function SensitivitySlider({
  isDarkMode,
  theme,
  sensitivity,
  setSensitivity,
  className = '',
  trailing = null,
  bordered = true,
}) {
  const clamped = Math.min(
    SENSITIVITY_MAX,
    Math.max(SENSITIVITY_MIN, sensitivity),
  );
  const progress =
    ((clamped - SENSITIVITY_MIN) / (SENSITIVITY_MAX - SENSITIVITY_MIN)) * 100;
  const halfThumb = THUMB_PX / 2;

  return (
    <div
      className={`shrink-0 ${
        bordered
          ? `pt-5 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`
          : ''
      } ${className}`}
    >
      <label
        className={`block ${TYPE.titleSm} mb-3 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        Microphone Sensitivity
      </label>
      <div className={`flex items-center ${trailing ? 'gap-3' : ''}`}>
        <div className="relative flex-1 min-w-0 h-14">
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-full overflow-hidden ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
            style={{ left: halfThumb, right: halfThumb }}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-75 ease-linear ${theme.colorPrimaryVariant}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border-2 border-transparent pointer-events-none z-10 ${theme.colorPrimaryVariant} ${theme.colorOnPrimaryVariant}`}
            style={{
              left: `calc(${halfThumb}px + (100% - ${THUMB_PX}px) * ${progress / 100})`,
            }}
            aria-hidden
          >
            <span className="text-[9px] font-black tabular-nums leading-none">
              {Math.round(clamped)}%
            </span>
          </div>

          <input
            type="range"
            min={SENSITIVITY_MIN}
            max={SENSITIVITY_MAX}
            value={clamped}
            onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            aria-label="Microphone sensitivity"
            style={{ touchAction: 'none' }}
          />
        </div>
        {trailing}
      </div>
    </div>
  );
}
