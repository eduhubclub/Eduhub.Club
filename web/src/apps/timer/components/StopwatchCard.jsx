import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, Pause, Play, RotateCcw } from 'lucide-react';
import { formatStopwatch } from '../timerUtils';
import {
  APP_BOARD_MAX_WIDTH,
  APP_GRID_CARD,
  APP_STAGE_CARD_MAX_HEIGHT,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

const FULLSCREEN_Z = 'z-[240]';

/** Scale stopwatch digits to the flex region between chrome and controls. */
function useFluidStopwatchSize(enabled, text = '00:00.00') {
  const containerRef = useRef(null);
  const [fontPx, setFontPx] = useState(72);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 16 || height < 16) return;
      const chars = Math.max(8, String(textRef.current).length);
      const byHeight = height * 0.82;
      const byWidth = width / (chars * 0.62);
      setFontPx(Math.round(Math.max(32, Math.min(byHeight, byWidth))));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, text]);

  return { containerRef, fontPx };
}

/** Whole-class stopwatch with centisecond precision. */
export function StopwatchCard({
  isDarkMode,
  theme,
  isFullscreen,
  setIsFullscreen,
  large = false,
}) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const display = formatStopwatch(time);
  const fluid = useFluidStopwatchSize(isFullscreen || large, display);

  const stopTicker = () => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    stopTicker();
    if (!isRunning) return undefined;
    startTimeRef.current = Date.now() - elapsedTimeRef.current;
    intervalRef.current = window.setInterval(() => {
      elapsedTimeRef.current = Date.now() - startTimeRef.current;
      setTime(elapsedTimeRef.current);
    }, 10);
    return () => stopTicker();
  }, [isRunning]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, setIsFullscreen]);

  const handleReset = () => {
    setIsRunning(false);
    stopTicker();
    elapsedTimeRef.current = 0;
    startTimeRef.current = Date.now();
    setTime(0);
  };

  const chromeIconSize = isFullscreen ? 32 : large ? 20 : 16;
  const useStageLayout = isFullscreen || large;

  const surface = isFullscreen
    ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 ${theme.colorBackground}`
    : `relative ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`;

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  const shell = (
    <div
      className={`transition-all duration-300 flex flex-col ${
        useStageLayout ? 'overflow-hidden' : 'overflow-visible'
      } ${surface} ${
        isFullscreen
          ? 'items-center p-6 sm:p-8'
          : large
            ? `items-center p-5 sm:p-6 w-full h-full min-h-0 ${APP_BOARD_MAX_WIDTH} ${APP_STAGE_CARD_MAX_HEIGHT} mx-auto my-auto text-center`
            : 'p-8 sm:p-12 items-center justify-center text-center'
      }`}
    >
      <div
        className={`absolute inset-x-0 z-10 flex items-center justify-between gap-3 pointer-events-none ${
          isFullscreen ? 'top-6 px-6 sm:top-8 sm:px-8' : 'top-4 px-4'
        }`}
      >
        <div className="min-w-0 flex-1 text-left">
          {useStageLayout ? (
            <h3
              className={`truncate font-semibold leading-none ${theme.colorOnSurfaceVariant}`}
              style={{ fontSize: chromeIconSize }}
            >
              Stopwatch
            </h3>
          ) : null}
        </div>
        <div className="flex items-center shrink-0 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`edu-control p-2 rounded-xl transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-80`}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? (
              <Minimize size={chromeIconSize} strokeWidth={2.5} />
            ) : (
              <Maximize size={chromeIconSize} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {useStageLayout ? (
        <div className="w-full shrink-0 h-8 sm:h-10" aria-hidden />
      ) : null}

      <div
        ref={useStageLayout ? fluid.containerRef : undefined}
        className={
          useStageLayout
            ? 'flex-1 min-h-0 w-full flex items-center justify-center px-2'
            : 'w-full'
        }
      >
        <p
          className={`font-mono font-black whitespace-nowrap tabular-nums ${
            useStageLayout ? 'leading-none' : `${TYPE.displayLg} mt-4 mb-8`
          } ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
          style={
            useStageLayout
              ? { fontSize: fluid.fontPx, lineHeight: 1 }
              : undefined
          }
        >
          {display}
        </p>
      </div>

      <div
        className={`flex items-center justify-center gap-3 md:gap-4 shrink-0 z-10 ${
          useStageLayout ? 'mt-3 mb-1' : ''
        } ${isFullscreen ? 'scale-125' : ''}`}
      >
        <button
          type="button"
          onClick={handleReset}
          className={`edu-control flex items-center px-4 py-3 rounded-xl ${TYPE.labelLg} transition-colors shadow-sm ${chipBtn}`}
        >
          <RotateCcw size={20} className="mr-2" /> Reset
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`edu-control flex items-center px-6 py-3 rounded-xl ${TYPE.labelLg} transition-all shadow-md hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          {isRunning ? (
            <>
              <Pause size={20} className="mr-2" fill="currentColor" /> Pause
            </>
          ) : (
            <>
              <Play size={20} className="mr-2" fill="currentColor" /> Start
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(shell, document.body);
  }
  return shell;
}
