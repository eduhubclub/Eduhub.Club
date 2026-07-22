import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Clock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  X,
} from 'lucide-react';
import { countdownColorClass, formatCountdown } from '../timerUtils';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

const FULLSCREEN_Z = 'z-[240]';

/**
 * Countdown timer card — digital or analog display with play/pause controls.
 */
export function TimerCard({
  title,
  subtitle,
  initialMinutes = 5,
  isDarkMode,
  theme,
  onClose,
  large = false,
  isFullscreen = false,
  onToggleFullscreen,
  autoStart = false,
  digitalOnly = false,
}) {
  const announce = useAnnounce();
  const [timeLeft, setTimeLeft] = useState(Math.round(initialMinutes * 60));
  const [isRunning, setIsRunning] = useState(autoStart);
  const [displayMode, setDisplayMode] = useState('digital');
  const [hasRung, setHasRung] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setTimeLeft(Math.round(initialMinutes * 60));
    setIsRunning(autoStart);
    setHasRung(false);
  }, [initialMinutes, autoStart]);

  useEffect(() => {
    audioRef.current = new Audio(
      'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
    );
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !hasRung) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setHasRung(true);
      const label = title?.trim() ? title.trim() : 'Timer';
      announce(`${label} finished`);
    } else if (timeLeft > 0) {
      setHasRung(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [timeLeft, hasRung, title, announce]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onToggleFullscreen) onToggleFullscreen();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, onToggleFullscreen]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) setIsRunning(false);
  }, [timeLeft, isRunning]);

  const adjustTime = (secondsAmount) => {
    setTimeLeft((prev) => Math.max(0, prev + secondsAmount));
  };

  const resetTime = () => {
    setIsRunning(false);
    setTimeLeft(Math.round(initialMinutes * 60));
  };

  const timerColor = countdownColorClass(timeLeft, isDarkMode);

  const surface = isFullscreen
    ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 ${theme.colorBackground}`
    : `relative ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`;

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  const shell = (
    <div
      className={`transition-all duration-300 flex flex-col overflow-hidden ${surface} ${
        isFullscreen || large
          ? 'items-center justify-center p-6 sm:p-8'
          : 'p-6'
      } ${large && !isFullscreen ? 'flex-1 min-h-[300px] max-h-[650px] my-auto w-full text-center' : ''}`}
    >
      <div
        className={`absolute flex items-center gap-2 ${
          isFullscreen ? 'top-6 right-6 sm:top-8 sm:right-8 gap-4' : 'top-4 right-4'
        }`}
      >
        {onToggleFullscreen ? (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`p-2 rounded-xl transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-80`}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? (
              <Minimize size={isFullscreen ? 32 : 20} strokeWidth={2.5} />
            ) : (
              <Maximize size={large ? 20 : 16} strokeWidth={2.5} />
            )}
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-80`}
            aria-label="Close timer"
          >
            <X size={isFullscreen ? 32 : large ? 20 : 16} />
          </button>
        ) : null}
      </div>

      {title || subtitle ? (
        <div
          className={`w-full ${
            large || isFullscreen ? 'mb-4 md:mb-8 text-center mt-6' : 'mb-4 text-left'
          }`}
        >
          {title ? (
            <h3
              className={`${theme.colorOnSurface} ${
                isFullscreen
                  ? 'text-4xl md:text-5xl font-bold mb-2'
                  : large
                    ? 'text-3xl md:text-4xl font-bold mb-2'
                    : TYPE.titleMd
              }`}
            >
              {title}
            </h3>
          ) : null}
          {subtitle ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {displayMode === 'digital' ? (
        <div
          className={`relative flex items-center justify-center font-mono font-black tracking-tighter ${timerColor} ${
            isFullscreen
              ? 'min-h-[25vw] my-8'
              : large
                ? 'min-h-[10rem] sm:min-h-[12rem] lg:min-h-[16rem] my-4 md:my-6'
                : 'min-h-[4rem] my-2'
          }`}
        >
          {timeLeft === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <h2
                className={`font-sans font-black uppercase tracking-widest text-rose-500 ${
                  isFullscreen
                    ? 'text-5xl md:text-7xl mb-6'
                    : large
                      ? 'text-3xl md:text-4xl mb-4'
                      : 'text-base mb-1'
                }`}
              >
                Time&apos;s Up!
              </h2>
              <Bell
                fill="currentColor"
                className={`text-rose-500 animate-timer-swing ${
                  isFullscreen
                    ? 'w-56 h-56'
                    : large
                      ? 'w-32 h-32 md:w-40 md:h-40'
                      : 'w-12 h-12'
                }`}
              />
            </div>
          ) : (
            <span
              className={`z-10 ${
                isFullscreen
                  ? 'text-[20vw] leading-none'
                  : TYPE.displayLg
              }`}
            >
              {formatCountdown(timeLeft)}
            </span>
          )}
        </div>
      ) : null}

      {displayMode === 'analog' ? (
        <div
          className={`relative flex items-center justify-center ${
            isFullscreen
              ? 'w-[45vw] h-[45vw] min-w-[300px] min-h-[300px] max-w-[60vh] max-h-[60vh] my-8'
              : large
                ? 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 my-4 md:my-6'
                : 'w-32 h-32 my-2'
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm overflow-visible">
            {timeLeft === 0 ? (
              <>
                <text
                  x="50"
                  y="30"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-rose-500 uppercase tracking-widest font-sans"
                >
                  TIME&apos;S UP!
                </text>
                <foreignObject x="10" y="35" width="80" height="60" className="overflow-visible">
                  <div className="w-full h-full flex items-center justify-center overflow-visible">
                    <Bell
                      fill="currentColor"
                      className="w-[50%] h-[50%] text-rose-500 animate-timer-swing"
                    />
                  </div>
                </foreignObject>
              </>
            ) : (
              <>
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  className={
                    isDarkMode
                      ? 'fill-slate-900 stroke-slate-700'
                      : 'fill-white stroke-slate-200'
                  }
                  strokeWidth="2"
                />
                {timeLeft <= 30 && timeLeft > 0 ? (
                  <path
                    d={`M 50 50 L 50 2 A 48 48 0 0 1 ${50 + 48 * Math.cos(((timeLeft % 60) * 6 - 90) * (Math.PI / 180))} ${50 + 48 * Math.sin(((timeLeft % 60) * 6 - 90) * (Math.PI / 180))} Z`}
                    className={`${timeLeft <= 15 ? 'fill-rose-500' : 'fill-amber-400'} opacity-25`}
                  />
                ) : null}
                {Array.from({ length: 60 }).map((_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={i % 5 === 0 ? '4' : '6'}
                    x2="50"
                    y2="2"
                    transform={`rotate(${i * 6} 50 50)`}
                    className={
                      i % 5 === 0
                        ? isDarkMode
                          ? 'stroke-slate-400'
                          : 'stroke-slate-500'
                        : isDarkMode
                          ? 'stroke-slate-700'
                          : 'stroke-slate-300'
                    }
                    strokeWidth={i % 5 === 0 ? '1.5' : '0.5'}
                  />
                ))}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                  const angle = (num * 30 * Math.PI) / 180;
                  const radius = 35;
                  const x = 50 + radius * Math.sin(angle);
                  const y = 50 - radius * Math.cos(angle);
                  return (
                    <text
                      key={num}
                      x={x}
                      y={y}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`font-sans ${isDarkMode ? 'fill-slate-400' : 'fill-slate-500'}`}
                    >
                      {num}
                    </text>
                  );
                })}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="15"
                  transform={`rotate(${((Math.floor(timeLeft / 60) + (timeLeft % 60) / 60) * 6)} 50 50)`}
                  className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="50"
                  y1="60"
                  x2="50"
                  y2="10"
                  transform={`rotate(${(timeLeft % 60) * 6} 50 50)`}
                  className="text-rose-500"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="3"
                  className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}
                  fill="currentColor"
                />
                <circle cx="50" cy="50" r="1.5" className="text-rose-500" fill="currentColor" />
              </>
            )}
          </svg>
        </div>
      ) : null}

      <div
        className={`flex items-center justify-center w-full gap-3 mt-4 md:mt-8 ${
          isFullscreen ? 'scale-125 md:scale-150' : large ? 'scale-110 md:scale-125' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => adjustTime(-15)}
          className={`px-3 h-10 flex items-center justify-center rounded-xl ${TYPE.labelLg} transition-colors ${chipBtn}`}
        >
          - 15s
        </button>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-md hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        >
          {isRunning ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => adjustTime(15)}
          className={`px-3 h-10 flex items-center justify-center rounded-xl ${TYPE.labelLg} transition-colors ${chipBtn}`}
        >
          + 15s
        </button>
      </div>

      <div
        className={`flex flex-wrap items-center justify-center w-full gap-2 md:gap-3 mt-4 md:mt-6 z-10 ${
          isFullscreen || large ? 'scale-110 mt-8 mb-2' : ''
        }`}
      >
        <button
          type="button"
          onClick={resetTime}
          className={`flex items-center px-3 py-2 md:px-4 md:py-2.5 rounded-xl ${TYPE.labelLg} transition-colors shadow-sm border ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
        >
          <RotateCcw size={16} className="mr-2" /> Restart
        </button>
        {!digitalOnly ? (
          <div
            className={`flex p-1 rounded-xl shadow-sm border ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
          >
            <button
              type="button"
              onClick={() => setDisplayMode('digital')}
              className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${TYPE.labelLg} transition-all ${
                displayMode === 'digital'
                  ? `${theme.colorSurface} ${theme.colorOnSurface} shadow`
                  : `${theme.colorOnSurfaceVariant} hover:opacity-80`
              }`}
            >
              <TimerIcon size={16} className="mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Digital</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('analog')}
              className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${TYPE.labelLg} transition-all ${
                displayMode === 'analog'
                  ? `${theme.colorSurface} ${theme.colorOnSurface} shadow`
                  : `${theme.colorOnSurfaceVariant} hover:opacity-80`
              }`}
            >
              <Clock size={16} className="mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Analog</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(shell, document.body);
  }
  return shell;
}
