import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, Pause, Play, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { formatStopwatch } from '../timerUtils';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

const FULLSCREEN_Z = 'z-[240]';

/** Whole-class stopwatch with centisecond precision. */
export function StopwatchCard({ isDarkMode, theme, isFullscreen, setIsFullscreen }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTimeRef.current;
      intervalId = setInterval(() => {
        elapsedTimeRef.current = Date.now() - startTimeRef.current;
        setTime(elapsedTimeRef.current);
      }, 10);
    }
    return () => clearInterval(intervalId);
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
    setTime(0);
    elapsedTimeRef.current = 0;
  };

  const surface = isFullscreen
    ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 ${theme.colorBackground}`
    : `relative ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-8 sm:p-12`;

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  const shell = (
    <div
      className={`${surface} flex flex-col items-center justify-center text-center transition-all duration-300`}
    >
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className={`absolute ${isFullscreen ? 'top-8 right-8 p-3' : 'top-4 right-4 p-2'} rounded-xl transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-80`}
        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {isFullscreen ? <Minimize size={32} /> : <Maximize size={24} />}
      </button>

      <TimerIcon className={`mb-4 ${theme.text}`} size={isFullscreen ? 80 : 48} />
      <h3
        className={`${isFullscreen ? 'text-4xl font-bold mb-2' : TYPE.titleLg} ${theme.colorOnSurface}`}
      >
        Stopwatch
      </h3>

      <p
        className={`font-mono ${TYPE.displayLg} whitespace-nowrap ${
          isFullscreen
            ? 'text-[15vw] leading-none my-6'
            : 'mt-4 mb-8'
        } ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
      >
        {formatStopwatch(time)}
      </p>

      <div className={`flex items-center gap-4 ${isFullscreen ? 'scale-125' : ''}`}>
        <button
          type="button"
          onClick={handleReset}
          className={`flex items-center px-4 py-3 rounded-xl ${TYPE.labelLg} transition-colors shadow-sm ${chipBtn}`}
        >
          <RotateCcw size={20} className="mr-2" /> Reset
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center px-6 py-3 rounded-xl ${TYPE.labelLg} transition-all shadow-md hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
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
