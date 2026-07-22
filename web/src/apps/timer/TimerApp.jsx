import { useEffect, useMemo, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { WholeClassView } from './views/WholeClassView';
import { SmallGroupView } from './views/SmallGroupView';
import { IndividualView } from './views/IndividualView';
import { StopwatchView } from './views/StopwatchView';
import { LearningView } from './views/LearningView';
import { SavedTimersView } from './views/SavedTimersView';
import { LocalTimeView } from './views/LocalTimeView';
import { WorldClockView } from './views/WorldClockView';

/**
 * Edu.Timer — classroom timers, stopwatches, and clocks.
 */
export function TimerApp({ activeTab, isDarkMode, theme, isLeft }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const [savedTimers, setSavedTimers] = useState([]);
  const [pendingRotation, setPendingRotation] = useState(null);

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );

  const students = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass?.studentList],
  );

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  const needsRoster =
    activeTab === 'Individual' || activeTab === 'Stopwatch';

  if (needsRoster && !activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<TimerIcon size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const shellVariant =
    activeTab === 'Whole Class' ||
    activeTab === 'Small Group' ||
    activeTab === 'Individual' ||
    activeTab === 'Stopwatch' ||
    activeTab === 'Saved Timers' ||
    activeTab === 'World Clock'
      ? 'stage'
      : 'scroll';

  const handleSaveRotation = (groups, min) => {
    setSavedTimers((prev) => [
      ...prev,
      {
        id: `st-rotation-${Date.now()}`,
        type: 'rotation',
        label: `${groups.length} Group Rotation`,
        groups: [...groups],
        min,
      },
    ]);
  };

  return (
    <AppPageShell variant={shellVariant}>
      {activeTab === 'Whole Class' ? (
        <WholeClassView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      ) : null}

      {activeTab === 'Small Group' ? (
        <SmallGroupView
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
          onSaveRotation={handleSaveRotation}
          initialGroups={pendingRotation?.groups}
          initialMinutes={pendingRotation?.min}
          onConsumedRotation={() => setPendingRotation(null)}
        />
      ) : null}

      {activeTab === 'Individual' ? (
        <IndividualView isDarkMode={isDarkMode} theme={theme} students={students} />
      ) : null}

      {activeTab === 'Stopwatch' ? (
        <StopwatchView isDarkMode={isDarkMode} theme={theme} students={students} />
      ) : null}

      {activeTab === 'Learning' ? (
        <LearningView isDarkMode={isDarkMode} theme={theme} />
      ) : null}

      {activeTab === 'Saved Timers' ? (
        <SavedTimersView
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
          savedTimers={savedTimers}
          onRemove={(id) => setSavedTimers((prev) => prev.filter((t) => t.id !== id))}
          onLoadRotation={(timer) => setPendingRotation(timer)}
          onAddTimer={(timer) => setSavedTimers((prev) => [...prev, timer])}
        />
      ) : null}

      {activeTab === 'Local Time' ? (
        <LocalTimeView isDarkMode={isDarkMode} theme={theme} />
      ) : null}

      {activeTab === 'World Clock' ? (
        <WorldClockView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      ) : null}
    </AppPageShell>
  );
}
