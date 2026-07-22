import { useState } from 'react';
import { Check, Clock, Users } from 'lucide-react';
import { secondsFromDuration } from '../timerUtils';
import { StudentTimerRow } from '../components/StudentTimerRow';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { ButtonRow } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';

export function IndividualView({ isDarkMode, theme, students }) {
  const [activeStudentSetup, setActiveStudentSetup] = useState(null);
  const [studentConfigs, setStudentConfigs] = useState({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAssignAllOpen, setIsAssignAllOpen] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const assignDuration = (studentIds, min, sec, autoStart) => {
    const totalSeconds = secondsFromDuration(min, sec);
    if (totalSeconds === 0) return;
    const triggerId = Date.now();
    const next = {};
    studentIds.forEach((id) => {
      next[id] = { totalSeconds, triggerId, autoStart };
    });
    setStudentConfigs((prev) => ({ ...prev, ...next }));
  };

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <div className="flex-1 flex flex-col min-h-0 mt-2">
      <ButtonRow>
        {isSelectionMode ? (
          <>
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedStudents([]);
              }}
              className={toolBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsSelectOpen(true)}
              disabled={selectedStudents.length === 0}
              className={`${toolBtn} disabled:opacity-50`}
            >
              <Clock size={16} strokeWidth={2.5} />
              Assign Selected ({selectedStudents.length})
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsSelectionMode(true)}
              className={toolBtn}
            >
              <Check size={16} strokeWidth={2.5} />
              Select
            </button>
            <button
              type="button"
              onClick={() => setIsAssignAllOpen(true)}
              className={toolBtn}
            >
              <Users size={16} strokeWidth={2.5} />
              Assign All
            </button>
          </>
        )}
      </ButtonRow>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-8 overflow-y-auto pr-2">
        {students.map((student) => (
          <StudentTimerRow
            key={student.id}
            student={student}
            isDarkMode={isDarkMode}
            theme={theme}
            onOpenSetup={setActiveStudentSetup}
            config={studentConfigs[student.id]}
            isSelectionMode={isSelectionMode}
            isSelected={selectedStudents.includes(student.id)}
            onToggleSelect={(id) =>
              setSelectedStudents((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
              )
            }
          />
        ))}
      </div>

      <TimerSetupModal
        isOpen={Boolean(activeStudentSetup)}
        onClose={() => setActiveStudentSetup(null)}
        onStart={(min, sec) => {
          if (!activeStudentSetup) return;
          assignDuration([activeStudentSetup.id], min, sec, true);
          setActiveStudentSetup(null);
        }}
        title={
          activeStudentSetup
            ? `Set Timer — ${activeStudentSetup.name}`
            : 'Set Timer'
        }
        isDarkMode={isDarkMode}
        theme={theme}
        startLabel="Start"
      />

      <TimerSetupModal
        isOpen={isAssignAllOpen}
        onClose={() => setIsAssignAllOpen(false)}
        onStart={(min, sec) => {
          assignDuration(
            students.map((s) => s.id),
            min,
            sec,
            false,
          );
          setIsAssignAllOpen(false);
        }}
        title="Assign All Students"
        isDarkMode={isDarkMode}
        theme={theme}
        startLabel="Assign"
      />

      <TimerSetupModal
        isOpen={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onStart={(min, sec) => {
          assignDuration(selectedStudents, min, sec, false);
          setIsSelectOpen(false);
          setIsSelectionMode(false);
          setSelectedStudents([]);
        }}
        title={`Assign ${selectedStudents.length} Selected`}
        isDarkMode={isDarkMode}
        theme={theme}
        startLabel="Assign"
      />
    </div>
  );
}
