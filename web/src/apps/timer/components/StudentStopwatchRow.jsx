import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, RotateCcw, X } from 'lucide-react';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { formatStopwatch } from '../timerUtils';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/** Compact per-student stopwatch row. */
export function StudentStopwatchRow({ student, isDarkMode, theme, config }) {
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);

  useEffect(() => {
    if (!config) return;
    if (config.type === 'START_ALL') {
      setIsStopwatchActive(true);
      setIsRunning(true);
      setTime(0);
      elapsedTimeRef.current = 0;
      setIsExpanded(false);
    } else if (config.type === 'PAUSE_ALL') {
      setIsRunning(false);
    } else if (config.type === 'RESUME_ALL') {
      setIsRunning(true);
    } else if (config.type === 'CLEAR_ALL') {
      setIsStopwatchActive(false);
      setIsRunning(false);
      setTime(0);
      elapsedTimeRef.current = 0;
      setIsExpanded(false);
    }
  }, [config?.actionId, config?.type]);

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

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    elapsedTimeRef.current = 0;
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
            {student.name}
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
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95 ${theme.colorPrimary} ${theme.colorOnPrimary} shadow-sm`}
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
                  setIsStopwatchActive(false);
                  handleReset();
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

      {isStopwatchActive && isExpanded ? (
        <div
          className={`flex items-center justify-end mt-3 pt-3 border-t ${theme.colorOutlineVariant}`}
        >
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center px-3 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors shadow-sm ${chipBtn}`}
          >
            <RotateCcw size={14} className="mr-1.5" /> Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}
