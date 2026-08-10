import { useEffect, useState } from 'react';
import { Bell, Check, Pause, Play, Plus, RotateCcw, X } from 'lucide-react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { formatShortCountdown } from '../timerUtils';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { studentDisplayName } from '../../../data/students/displayName';

/** Compact per-student countdown row. */
export function StudentTimerRow({
  student,
  isDarkMode,
  theme,
  onOpenSetup,
  config,
  bulkCommand,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}) {
  const announce = useAnnounce();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAnnouncedEnd, setHasAnnouncedEnd] = useState(false);

  useEffect(() => {
    if (!config?.triggerId) return;
    setTimeLeft(config.totalSeconds);
    setInitialTime(config.totalSeconds);
    setIsTimerActive(true);
    setIsRunning(config.autoStart ?? true);
    setIsExpanded(false);
    setHasAnnouncedEnd(false);
  }, [config?.triggerId, config?.totalSeconds, config?.autoStart]);

  useEffect(() => {
    if (!bulkCommand?.actionId) return;
    if (bulkCommand.type === 'START_ALL') {
      if (isTimerActive && timeLeft > 0) setIsRunning(true);
    } else if (bulkCommand.type === 'PAUSE_ALL') {
      setIsRunning(false);
    } else if (bulkCommand.type === 'CLEAR_ALL') {
      setIsTimerActive(false);
      setIsRunning(false);
      setTimeLeft(0);
      setInitialTime(0);
      setIsExpanded(false);
      setHasAnnouncedEnd(false);
    }
    // Respond once per broadcast — do not re-run on timer ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isTimerActive/timeLeft read from the actionId render
  }, [bulkCommand?.actionId, bulkCommand?.type]);

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

  useEffect(() => {
    if (timeLeft === 0 && isTimerActive && !hasAnnouncedEnd) {
      setHasAnnouncedEnd(true);
      const name = studentDisplayName(student);
      announce(`${name}'s timer finished`);
    } else if (timeLeft > 0 && hasAnnouncedEnd) {
      setHasAnnouncedEnd(false);
    }
  }, [timeLeft, isTimerActive, hasAnnouncedEnd, student, announce]);

  const adjustTime = (amount) => setTimeLeft((prev) => Math.max(0, prev + amount));
  const resetTime = () => setTimeLeft(initialTime);

  let timerColor = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  if (timeLeft === 0 && isTimerActive) timerColor = 'text-rose-500 animate-pulse';
  else if (timeLeft <= 60 && isTimerActive) timerColor = 'text-rose-500';
  else if (timeLeft <= 120 && isTimerActive) timerColor = 'text-amber-500';

  const cardClass = isSelected
    ? `ring-2 ${theme.ring} ${theme.colorPrimaryContainer} border-transparent`
    : `${theme.colorSurface} ${theme.colorOutline}`;

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  return (
    <div
      className={`relative flex flex-col p-3 ${APP_GRID_CARD} transition-all ${cardClass} ${
        isSelectionMode ? 'cursor-pointer edu-control' : ''
      }`}
      role={isSelectionMode ? 'button' : undefined}
      tabIndex={isSelectionMode ? 0 : undefined}
      aria-pressed={isSelectionMode ? isSelected : undefined}
      aria-label={
        isSelectionMode
          ? `${isSelected ? 'Deselect' : 'Select'} ${studentDisplayName(student)}`
          : undefined
      }
      onClick={
        isSelectionMode ? () => onToggleSelect(student.id) : undefined
      }
      onKeyDown={
        isSelectionMode
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleSelect(student.id);
              }
            }
          : undefined
      }
    >
      {!isSelectionMode && isTimerActive && timeLeft <= 120 && timeLeft > 60 ? (
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[calc(1rem-1.5px)] bg-amber-500/10" />
      ) : null}
      {!isSelectionMode && isTimerActive && timeLeft <= 60 && timeLeft > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[calc(1rem-1.5px)] bg-rose-500/15" />
      ) : null}

      <div className="relative z-10 flex items-center justify-between w-full">
        {isSelectionMode ? (
          <div className="flex min-w-0 flex-1 items-center text-left">
            <StudentAvatar
              student={student}
              theme={theme}
              isDarkMode={isDarkMode}
              size="sm"
              className="mr-3"
            />
            <span
              className={`${TYPE.titleSm} truncate pr-2 ${theme.colorOnSurface}`}
            >
              {studentDisplayName(student)}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isTimerActive) setIsExpanded(!isExpanded);
              else onOpenSetup(student);
            }}
            className="flex items-center min-w-0 flex-1 text-left cursor-pointer group outline-none"
          >
            <StudentAvatar
              student={student}
              theme={theme}
              isDarkMode={isDarkMode}
              size="sm"
              className="mr-3"
            />
            <span
              className={`${TYPE.titleSm} truncate pr-2 transition-colors ${theme.colorOnSurface} group-hover:opacity-90`}
            >
              {studentDisplayName(student)}
            </span>
          </button>
        )}

        <div className="shrink-0 flex items-center ml-2">
          {isSelectionMode ? (
            <div
              aria-hidden
              className={`pointer-events-none w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                isSelected
                  ? `${theme.colorPrimary} border-transparent ${theme.colorOnPrimary}`
                  : `${theme.colorSurfaceVariant} ${theme.colorOutline}`
              }`}
            >
              {isSelected ? <Check size={14} strokeWidth={3} /> : null}
            </div>
          ) : !isTimerActive ? (
            <button
              type="button"
              onClick={() => onOpenSetup(student)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary} shadow-sm`}
              title="Add timer"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <div className={`flex items-center justify-center min-w-[3.5rem] ${timerColor}`}>
                {timeLeft === 0 ? (
                  <div className="flex flex-col items-center justify-center mr-1">
                    <span className="text-[8px] font-sans font-black uppercase tracking-wider text-rose-500 leading-none mb-1">
                      Time&apos;s Up!
                    </span>
                    <Bell
                      size={20}
                      fill="currentColor"
                      className="animate-timer-swing shrink-0 text-rose-500"
                    />
                  </div>
                ) : (
                  <span className="font-mono font-black text-lg tracking-tighter">
                    {formatShortCountdown(timeLeft)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`p-1.5 rounded-md transition-colors ${chipBtn}`}
              >
                {isRunning ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerActive(false);
                  setTimeLeft(0);
                  setIsRunning(false);
                  setIsExpanded(false);
                }}
                className={`p-1.5 rounded-md transition-colors ${theme.colorOnSurfaceVariant} hover:text-rose-500`}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isSelectionMode && isTimerActive && isExpanded ? (
        <div
          className={`relative z-10 flex items-center justify-between mt-3 pt-3 border-t ${theme.colorOutlineVariant}`}
        >
          <button
            type="button"
            onClick={resetTime}
            className={`flex items-center px-3 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors shadow-sm ${chipBtn}`}
          >
            <RotateCcw size={14} className="mr-1.5" /> Restart
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => adjustTime(-15)}
              className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors shadow-sm ${chipBtn}`}
            >
              - 15s
            </button>
            <button
              type="button"
              onClick={() => adjustTime(15)}
              className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors shadow-sm ${chipBtn}`}
            >
              + 15s
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
