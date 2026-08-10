import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Check,
  Clock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  X,
} from 'lucide-react';
import { countdownColorClass, countdownWarnThresholds, formatCountdown } from '../timerUtils';
import { APP_GRID_CARD, APP_BOARD_MAX_WIDTH, APP_STAGE_CARD_MAX_HEIGHT } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { FitPopout } from '../../../shared/usePopoutFit';
import {
  getAlarmSoundUrl,
  useAlarmSoundPreferences,
} from '../../../data/settings/AlarmSoundPreferencesContext';
import { enqueueTimerAlarm } from '../timerAlarmQueue';

const FULLSCREEN_Z = 'z-[240]';

/** Scale digital countdown to the flex region between title and controls. */
function useFluidCountdownSize(enabled, text = '00:00') {
  const containerRef = useRef(null);
  const [fontPx, setFontPx] = useState(72);
  const [bellPx, setBellPx] = useState(96);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width < 16 || height < 16) return;
      const chars = Math.max(4, String(textRef.current).length);
      // Shell stage is the max — scale down with the window, no artificial px cap.
      const byHeight = height * 0.82;
      const byWidth = width / (chars * 0.7);
      const next = Math.round(Math.max(32, Math.min(byHeight, byWidth)));
      setFontPx(next);
      setBellPx(
        Math.round(Math.max(48, Math.min(height * 0.7, width * 0.4))),
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, text]);

  return { containerRef, fontPx, bellPx };
}

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
  bulkCommand = null,
}) {
  const announce = useAnnounce();
  const {
    alarmUrl,
    durationSec,
    volume,
    classicSounds,
    soundId: defaultSoundId,
    addedSounds,
  } = useAlarmSoundPreferences();
  const [timeLeft, setTimeLeft] = useState(Math.round(initialMinutes * 60));
  const [isRunning, setIsRunning] = useState(autoStart);
  const [displayMode, setDisplayMode] = useState('digital');
  const [hasRung, setHasRung] = useState(false);
  /** null = use Settings default for this timer only */
  const [sessionSoundId, setSessionSoundId] = useState(null);
  const [alarmPickerOpen, setAlarmPickerOpen] = useState(false);
  const [alarmPopoutPos, setAlarmPopoutPos] = useState({ left: 0, bottom: 0 });
  const stopAlarmRef = useRef(null);
  const alarmPickerRef = useRef(null);
  const alarmButtonRef = useRef(null);
  const alarmPanelRef = useRef(null);
  const fluidDigital = useFluidCountdownSize(
    (isFullscreen || large) &&
      (displayMode === 'digital' || (displayMode === 'analog' && timeLeft === 0)),
    formatCountdown(timeLeft),
  );

  const usingDefaultAlarm = sessionSoundId == null;
  const effectiveAlarmUrl = usingDefaultAlarm
    ? alarmUrl
    : getAlarmSoundUrl(sessionSoundId, addedSounds);
  const activeSoundId = usingDefaultAlarm ? defaultSoundId : sessionSoundId;

  useEffect(() => {
    setTimeLeft(Math.round(initialMinutes * 60));
    setIsRunning(autoStart);
    setHasRung(false);
  }, [initialMinutes, autoStart]);

  useEffect(() => {
    if (!bulkCommand?.actionId) return;
    if (bulkCommand.type === 'START_ALL') {
      setIsRunning(true);
    } else if (bulkCommand.type === 'PAUSE_ALL') {
      setIsRunning(false);
    } else if (bulkCommand.type === 'RESET_ALL') {
      setIsRunning(false);
      setTimeLeft(Math.round(initialMinutes * 60));
      setHasRung(false);
    }
    // Respond once per broadcast — do not re-run on other state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkCommand?.actionId, bulkCommand?.type]);

  useEffect(() => {
    return () => {
      if (stopAlarmRef.current) {
        stopAlarmRef.current();
        stopAlarmRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !hasRung) {
      if (stopAlarmRef.current) stopAlarmRef.current();
      stopAlarmRef.current = enqueueTimerAlarm({
        url: effectiveAlarmUrl,
        durationSec,
        volume,
        onEnd: () => {
          stopAlarmRef.current = null;
        },
      });
      setHasRung(true);
      const label = title?.trim() ? title.trim() : 'Timer';
      announce(`${label} finished`);
    } else if (timeLeft > 0) {
      setHasRung(false);
      if (stopAlarmRef.current) {
        stopAlarmRef.current();
        stopAlarmRef.current = null;
      }
    }
  }, [timeLeft, hasRung, title, announce, effectiveAlarmUrl, durationSec, volume]);

  useLayoutEffect(() => {
    if (!alarmPickerOpen) return undefined;
    const place = () => {
      const btn = alarmButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setAlarmPopoutPos({
        left: rect.left + rect.width / 2,
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [alarmPickerOpen]);

  useEffect(() => {
    if (!alarmPickerOpen) return undefined;
    const onPointerDown = (e) => {
      const inTrigger = alarmPickerRef.current?.contains(e.target);
      const inPanel = alarmPanelRef.current?.contains(e.target);
      if (!inTrigger && !inPanel) setAlarmPickerOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAlarmPickerOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [alarmPickerOpen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !alarmPickerOpen && onToggleFullscreen) {
        onToggleFullscreen();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, onToggleFullscreen, alarmPickerOpen]);

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

  const totalSeconds = Math.round(initialMinutes * 60);
  const timerColor = countdownColorClass(timeLeft, isDarkMode, totalSeconds);
  const { yellowAt: warnYellowAt, redAt: warnRedAt } =
    countdownWarnThresholds(totalSeconds);

  const surface = isFullscreen
    ? `fixed inset-0 ${FULLSCREEN_Z} rounded-none border-0 ${theme.colorBackground}`
    : `relative ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`;

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  const chromeIconSize = isFullscreen ? 32 : large ? 20 : 16;
  const useChromeTitle = Boolean(title) && (large || isFullscreen);

  const shell = (
    <div
      className={`transition-all duration-300 flex flex-col ${
        isFullscreen ? 'overflow-hidden' : large ? 'overflow-hidden' : 'overflow-visible'
      } ${surface} ${
        isFullscreen
          ? 'items-center p-6 sm:p-8'
          : large
            ? `items-center p-5 sm:p-6 w-full h-full min-h-0 ${APP_BOARD_MAX_WIDTH} ${APP_STAGE_CARD_MAX_HEIGHT} mx-auto my-auto text-center`
            : 'p-6'
      }`}
    >
      <div
        className={`absolute inset-x-0 z-10 flex items-center justify-between gap-3 pointer-events-none ${
          isFullscreen ? 'top-6 px-6 sm:top-8 sm:px-8' : 'top-4 px-4'
        }`}
      >
        <div className="min-w-0 flex-1 text-left">
          {useChromeTitle ? (
            <h3
              className={`truncate font-semibold leading-none ${theme.colorOnSurfaceVariant}`}
              style={{ fontSize: chromeIconSize }}
            >
              {title}
            </h3>
          ) : null}
        </div>
        <div
          className={`flex items-center shrink-0 pointer-events-auto ${
            isFullscreen ? 'gap-4' : 'gap-2'
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
                <Minimize size={chromeIconSize} strokeWidth={2.5} />
              ) : (
                <Maximize size={chromeIconSize} strokeWidth={2.5} />
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
              <X size={chromeIconSize} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>

      {!useChromeTitle && (title || subtitle) ? (
        <div className="w-full shrink-0 mb-4 text-left">
          {title ? (
            <h3 className={`${theme.colorOnSurface} ${TYPE.titleMd}`}>{title}</h3>
          ) : null}
          {subtitle ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>{subtitle}</p>
          ) : null}
        </div>
      ) : null}

      {useChromeTitle && subtitle ? (
        <div className="w-full shrink-0 mb-2 mt-8 text-center">
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>{subtitle}</p>
        </div>
      ) : null}

      {useChromeTitle && !subtitle ? (
        <div className="w-full shrink-0 h-8 sm:h-10" aria-hidden />
      ) : null}

      {displayMode === 'digital' ? (
        <div
          ref={isFullscreen || large ? fluidDigital.containerRef : undefined}
          className={`relative flex items-center justify-center font-mono font-black tracking-tighter w-full min-w-0 overflow-hidden ${timerColor} ${
            isFullscreen || large
              ? 'flex-1 min-h-0 my-2'
              : 'min-h-[4rem] my-2'
          }`}
        >
          {timeLeft === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-0">
              <h2
                className={`font-sans font-black uppercase tracking-widest text-rose-500 leading-none ${
                  isFullscreen || large ? '' : 'text-base mb-1'
                }`}
                style={
                  isFullscreen || large
                    ? { fontSize: Math.max(24, Math.round(fluidDigital.bellPx * 0.28)) }
                    : undefined
                }
              >
                Time&apos;s Up!
              </h2>
              <Bell
                fill="currentColor"
                className="text-rose-500 animate-timer-swing shrink-0"
                style={{
                  width: isFullscreen || large ? fluidDigital.bellPx : 48,
                  height: isFullscreen || large ? fluidDigital.bellPx : 48,
                }}
              />
            </div>
          ) : (
            <span
              className={`z-10 whitespace-nowrap ${
                isFullscreen || large
                  ? 'font-black tabular-nums leading-none tracking-tighter'
                  : TYPE.displayLg
              }`}
              style={
                isFullscreen || large
                  ? { fontSize: fluidDigital.fontPx }
                  : undefined
              }
            >
              {formatCountdown(timeLeft)}
            </span>
          )}
        </div>
      ) : null}

      {displayMode === 'analog' ? (
        timeLeft === 0 && (isFullscreen || large) ? (
          <div
            ref={fluidDigital.containerRef}
            className="relative flex flex-1 min-h-0 w-full min-w-0 items-center justify-center my-2 overflow-hidden"
          >
            <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-0">
              <h2
                className="font-sans font-black uppercase tracking-widest text-rose-500 leading-none"
                style={{ fontSize: Math.max(24, Math.round(fluidDigital.bellPx * 0.28)) }}
              >
                Time&apos;s Up!
              </h2>
              <Bell
                fill="currentColor"
                className="text-rose-500 animate-timer-swing shrink-0"
                style={{
                  width: fluidDigital.bellPx,
                  height: fluidDigital.bellPx,
                }}
              />
            </div>
          </div>
        ) : (
        <div
          className={`relative my-2 flex items-center justify-center ${
            isFullscreen || large
              ? 'flex-1 min-h-0 w-full'
              : 'w-32 h-32'
          }`}
        >
          <div
            className={
              isFullscreen || large
                ? 'h-full max-h-full w-auto max-w-full aspect-square'
                : 'w-full h-full'
            }
          >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm overflow-visible">
            {timeLeft === 0 ? (
              <>
                <text
                  x="50"
                  y="22"
                  fontSize="14"
                  fontWeight="900"
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-rose-500 uppercase tracking-widest font-sans"
                >
                  TIME&apos;S UP!
                </text>
                <foreignObject x="8" y="28" width="84" height="68" className="overflow-visible">
                  <div className="w-full h-full flex items-center justify-center overflow-visible">
                    <Bell
                      fill="currentColor"
                      className="w-[85%] h-[85%] text-rose-500 animate-timer-swing"
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
                {timeLeft <= warnYellowAt && timeLeft > 0 ? (
                  <path
                    d={`M 50 50 L 50 2 A 48 48 0 0 1 ${50 + 48 * Math.cos(((timeLeft % 60) * 6 - 90) * (Math.PI / 180))} ${50 + 48 * Math.sin(((timeLeft % 60) * 6 - 90) * (Math.PI / 180))} Z`}
                    className={`${timeLeft <= warnRedAt ? 'fill-rose-500' : 'fill-amber-400'} opacity-25`}
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
        </div>
        )
      ) : null}

      <div
        className={`flex items-center justify-center w-full gap-3 shrink-0 mt-3 sm:mt-4 ${
          isFullscreen ? 'mb-4' : ''
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
        className={`flex flex-wrap items-center justify-center w-full gap-2 md:gap-3 shrink-0 z-10 ${
          isFullscreen || large ? 'mt-3 mb-1' : 'mt-4 md:mt-6'
        }`}
      >
        <button
          type="button"
          onClick={resetTime}
          className={`edu-control flex items-center px-3 py-2 md:px-4 md:py-2.5 rounded-xl ${TYPE.labelLg} transition-colors shadow-sm border ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
        >
          <RotateCcw size={16} className="mr-2" /> Restart
        </button>

        <div className="relative" ref={alarmPickerRef}>
          <button
            ref={alarmButtonRef}
            type="button"
            onClick={() => setAlarmPickerOpen((open) => !open)}
            aria-expanded={alarmPickerOpen}
            aria-haspopup="listbox"
            className={`edu-control flex items-center px-3 py-2 md:px-4 md:py-2.5 rounded-xl ${TYPE.labelLg} transition-colors shadow-sm border ${
              usingDefaultAlarm
                ? `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                : `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer} border-transparent`
            }`}
            title={
              usingDefaultAlarm
                ? 'Alarm sound (using Timer settings default)'
                : 'Alarm sound (one-time for this timer)'
            }
          >
            <Bell size={16} className="mr-2" />
            <span className="hidden sm:inline">Alarm</span>
          </button>

          {alarmPickerOpen
            ? createPortal(
                <FitPopout
                  ref={alarmPanelRef}
                  open={alarmPickerOpen}
                  centerX
                  style={{
                    left: alarmPopoutPos.left,
                    bottom: alarmPopoutPos.bottom,
                  }}
                  className={`fixed w-56 rounded-2xl border-[1.5px] shadow-lg z-[300] overflow-hidden isolate ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-600'
                      : 'bg-white border-slate-300'
                  }`}
                  role="listbox"
                  aria-label="Alarm sound for this timer"
                >
                  <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5 [scrollbar-gutter:stable]">
                    <p
                      className={`px-2.5 pt-1.5 pb-1 ${TYPE.bodySm} ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      This timer only
                    </p>
                    <button
                      type="button"
                      role="option"
                      aria-selected={usingDefaultAlarm}
                      onClick={() => {
                        setSessionSoundId(null);
                        setAlarmPickerOpen(false);
                      }}
                      className={`edu-control w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${TYPE.labelLg} transition-colors ${
                        usingDefaultAlarm
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                          : isDarkMode
                            ? 'text-slate-200 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">Default</span>
                      {usingDefaultAlarm ? (
                        <Check size={14} strokeWidth={2.5} className="shrink-0" />
                      ) : null}
                    </button>
                    {classicSounds.map((sound) => {
                      const isActive =
                        !usingDefaultAlarm && activeSoundId === sound.id;
                      return (
                        <button
                          key={sound.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setSessionSoundId(sound.id);
                            setAlarmPickerOpen(false);
                          }}
                          className={`edu-control w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left ${TYPE.labelLg} transition-colors ${
                            isActive
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                              : isDarkMode
                                ? 'text-slate-200 hover:bg-slate-800'
                                : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {sound.label}
                          </span>
                          {isActive ? (
                            <Check
                              size={14}
                              strokeWidth={2.5}
                              className="shrink-0"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </FitPopout>,
                document.body,
              )
            : null}
        </div>

        {!digitalOnly ? (
          <div
            className={`flex p-1 rounded-xl shadow-sm border ${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`}
          >
            <button
              type="button"
              onClick={() => setDisplayMode('digital')}
              className={`edu-control flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${TYPE.labelLg} transition-all ${
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
              className={`edu-control flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${TYPE.labelLg} transition-all ${
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
