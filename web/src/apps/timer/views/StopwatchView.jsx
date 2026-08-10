import { useCallback, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, User, Users, X } from 'lucide-react';
import { StopwatchCard } from '../components/StopwatchCard';
import { StudentStopwatchRow } from '../components/StudentStopwatchRow';
import { SegmentControl } from '../../../shared/SegmentControl';
import { ButtonRow } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';

export function StopwatchView({ isDarkMode, theme, students }) {
  const [mode, setMode] = useState('whole');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studentConfigs, setStudentConfigs] = useState({});
  const [isAllRunning, setIsAllRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [rowStatuses, setRowStatuses] = useState({});

  const broadcast = (type) => {
    const actionId = Date.now();
    const next = {};
    students.forEach((s) => {
      next[s.id] = { type, actionId };
    });
    setStudentConfigs((prev) => ({ ...prev, ...next }));
  };

  const handleStatusChange = useCallback((studentId, status) => {
    setRowStatuses((prev) => {
      const cur = prev[studentId];
      if (
        cur &&
        cur.active === status.active &&
        cur.running === status.running
      ) {
        return prev;
      }
      return { ...prev, [studentId]: status };
    });
    if (status.active) setHasStarted(true);
  }, []);

  const anyRunning = useMemo(
    () => Object.values(rowStatuses).some((s) => s?.running),
    [rowStatuses],
  );
  const anyActive = useMemo(
    () => Object.values(rowStatuses).some((s) => s?.active),
    [rowStatuses],
  );
  const showBulkControls = hasStarted || anyActive;
  const showPause = anyRunning || isAllRunning;

  const toolBtn = toolBtnClass(isDarkMode);
  const dangerBtn = `${toolBtn} text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {!isFullscreen ? (
        <div className="flex justify-center mt-2 mb-6 shrink-0">
          <SegmentControl
            isDarkMode={isDarkMode}
            theme={theme}
            value={mode}
            onChange={setMode}
            options={[
              { id: 'whole', label: 'Whole Class', icon: Users },
              { id: 'individual', label: 'Individual', icon: User },
            ]}
          />
        </div>
      ) : null}

      {mode === 'whole' ? (
        <div className="flex-1 flex flex-col w-full min-h-0 justify-center">
          <StopwatchCard
            isDarkMode={isDarkMode}
            theme={theme}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            large
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <ButtonRow>
            {!showBulkControls ? (
              <button
                type="button"
                onClick={() => {
                  broadcast('START_ALL');
                  setIsAllRunning(true);
                  setHasStarted(true);
                }}
                className={toolBtn}
              >
                <Play size={16} strokeWidth={2.5} />
                Start All
              </button>
            ) : (
              <>
                {showPause ? (
                  <button
                    type="button"
                    onClick={() => {
                      broadcast('PAUSE_ALL');
                      setIsAllRunning(false);
                    }}
                    className={toolBtn}
                  >
                    <Pause size={16} strokeWidth={2.5} />
                    Pause All
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      broadcast('RESUME_ALL');
                      setIsAllRunning(true);
                    }}
                    className={toolBtn}
                  >
                    <Play size={16} strokeWidth={2.5} />
                    Resume All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    broadcast('RESET_ALL');
                    setIsAllRunning(false);
                  }}
                  className={toolBtn}
                >
                  <RotateCcw size={16} strokeWidth={2.5} />
                  Restart All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    broadcast('CLEAR_ALL');
                    setIsAllRunning(false);
                    setHasStarted(false);
                    setRowStatuses({});
                  }}
                  className={dangerBtn}
                >
                  <X size={16} strokeWidth={2.5} />
                  Clear All
                </button>
              </>
            )}
          </ButtonRow>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto p-1 pb-8">
            {students.map((student) => (
              <StudentStopwatchRow
                key={student.id}
                student={student}
                isDarkMode={isDarkMode}
                theme={theme}
                config={studentConfigs[student.id]}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
