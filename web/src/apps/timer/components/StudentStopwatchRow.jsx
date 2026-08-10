import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, RotateCcw, X } from 'lucide-react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { formatStopwatch } from '../timerUtils';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';

/** Compact per-student stopwatch row. */
export function StudentStopwatchRow({
  student,
  isDarkMode,
  theme,
  config,
  onStatusChange,
}) {
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const intervalRef = useRef(null);
  const activeRef = useRef(false);
  activeRef.current = isStopwatchActive;

  const stopTicker = () => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetElapsed = () => {
    stopTicker();
    elapsedTimeRef.current = 0;
    startTimeRef.current = Date.now();
    setTime(0);
  };

  useEffect(() => {
    onStatusChange?.(student.id, {
      active: isStopwatchActive,
      running: isRunning,
    });
  }, [student.id, isStopwatchActive, isRunning, onStatusChange]);

  useEffect(() => {
    return () => {
      stopTicker();
      onStatusChange?.(student.id, { active: false, running: false });
    };
  }, [student.id, onStatusChange]);

  useEffect(() => {
    if (!config) return;
    if (config.type === 'START_ALL') {
      resetElapsed();
      setIsStopwatchActive(true);
      setIsRunning(true);
      setIsExpanded(false);
    } else if (config.type === 'PAUSE_ALL') {
      setIsRunning(false);
    } else if (config.type === 'RESUME_ALL') {
      if (activeRef.current) setIsRunning(true);
    } else if (config.type === 'RESET_ALL') {
      if (!activeRef.current) return;
      setIsRunning(false);
      resetElapsed();
    } else if (config.type === 'CLEAR_ALL') {
      setIsStopwatchActive(false);
      setIsRunning(false);
      resetElapsed();
      setIsExpanded(false);
    }
    // Bulk commands only — intentional deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.actionId, config?.type]);

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

  const handleReset = () => {
    setIsRunning(false);
    resetElapsed();
  };

  const chipBtn = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} hover:opacity-90`
    : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant} hover:opacity-90`;

  return (
    <div
      className={`relative flex flex-col p-3 ${APP_GRID_CARD} transition-all ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={() => {
            if (isStopwatchActive) setIsExpanded(!isExpanded);
          }}
          className="flex items-center min-w-0 flex-1 text-left group outline-none"
        >
          <StudentAvatar
            student={student}
            theme={theme}
            isDarkMode={isDarkMode}
            size="sm"
            className="mr-3"
          />
          <span className={`${TYPE.titleSm} truncate pr-2 ${theme.colorOnSurface}`}>
            {studentDisplayName(student)}
          </span>
        </button>

        <div className="shrink-0 flex items-center ml-2">
          {!isStopwatchActive ? (
            <button
              type="button"
              onClick={() => {
                setIsStopwatchActive(true);
                setIsRunning(true);
                setTime(0);
                elapsedTimeRef.current = 0;
              }}
              className={`edu-control w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary} shadow-sm`}
              title="Start stopwatch"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`font-mono font-black text-sm tracking-tighter min-w-[4.5rem] text-right ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                {formatStopwatch(time)}
              </span>
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`edu-control p-1.5 rounded-md transition-colors ${chipBtn}`}
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
                  setIsStopwatchActive(false);
                  handleReset();
                  setIsExpanded(false);
                }}
                className={`edu-control p-1.5 rounded-md transition-colors ${theme.colorOnSurfaceVariant} hover:text-rose-500`}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isStopwatchActive && isExpanded ? (
        <div
          className={`flex items-center justify-end mt-3 pt-3 border-t ${theme.colorOutlineVariant}`}
        >
          <button
            type="button"
            onClick={handleReset}
            className={`edu-control flex items-center px-3 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors shadow-sm ${chipBtn}`}
          >
            <RotateCcw size={14} className="mr-1.5" /> Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}
