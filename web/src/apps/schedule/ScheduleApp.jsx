import { useCallback, useEffect, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { PageHeader } from '../../shared/PageHeader';
import {
  readAcademic,
  readClosures,
  CALENDAR_UPDATED_EVENT,
} from '../../data/calendar/calendarStorage';
import {
  readSchedule,
  writeSchedule,
  SCHEDULE_UPDATED_EVENT,
} from '../../data/schedule/scheduleStorage';
import {
  readResources,
  RESOURCES_UPDATED_EVENT,
} from '../../data/resources/resourceStorage';
import {
  readPlan,
  PLAN_UPDATED_EVENT,
} from '../../data/plan/planStorage';
import { TodayView } from './views/TodayView';
import { TemplatesView } from './views/TemplatesView';
import { BlockView } from './views/BlockView';

const SCHEDULE_TABS = ['Today', 'Day shape', 'Block view'];

function useClassSchedule(classId) {
  const [schedule, setSchedule] = useState(() => readSchedule(classId));
  const [resources, setResources] = useState(() => readResources(classId));
  const [plan, setPlan] = useState(() => readPlan(classId));
  const [academic, setAcademic] = useState(() => readAcademic(classId));
  const [closures, setClosures] = useState(() => readClosures(classId));

  const refresh = useCallback(() => {
    setSchedule(readSchedule(classId));
    setResources(readResources(classId));
    setPlan(readPlan(classId));
    setAcademic(readAcademic(classId));
    setClosures(readClosures(classId));
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onAny = () => refresh();
    window.addEventListener(SCHEDULE_UPDATED_EVENT, onAny);
    window.addEventListener(RESOURCES_UPDATED_EVENT, onAny);
    window.addEventListener(PLAN_UPDATED_EVENT, onAny);
    window.addEventListener(CALENDAR_UPDATED_EVENT, onAny);
    return () => {
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, onAny);
      window.removeEventListener(RESOURCES_UPDATED_EVENT, onAny);
      window.removeEventListener(PLAN_UPDATED_EVENT, onAny);
      window.removeEventListener(CALENDAR_UPDATED_EVENT, onAny);
    };
  }, [refresh]);

  const saveSchedule = useCallback(
    (next) => {
      writeSchedule(classId, next);
      setSchedule(readSchedule(classId));
    },
    [classId],
  );

  return {
    schedule,
    saveSchedule,
    resources,
    plan,
    academic,
    closures,
    refresh,
  };
}

/**
 * Edu.Schedule — day structure and Day #N.
 */
export function ScheduleApp({ activeTab, isDarkMode, theme, isLeft = true }) {
  const { selectedClass, classes } = useClasses();
  const activeClasses = (classes || []).filter((c) => !c.isArchived);
  const classId = selectedClass?.id;

  const bundle = useClassSchedule(classId);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <EmptyState
          isDarkMode={isDarkMode}
          message="Add a class first, then build its daily schedule."
        />
      </AppPageShell>
    );
  }

  if (!selectedClass) {
    return (
      <AppPageShell variant="page">
        <EmptyState
          isDarkMode={isDarkMode}
          message="Select a class from the Classes panel."
        />
      </AppPageShell>
    );
  }

  const common = {
    theme,
    isDarkMode,
    isLeft,
    classId,
    className: selectedClass.name,
    ...bundle,
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Schedule"
        description={`${selectedClass.name} · Day shape and periods`}
        isDarkMode={isDarkMode}
      />

      {activeTab === 'Day shape' ? <TemplatesView {...common} /> : null}
      {activeTab === 'Block view' ? <BlockView {...common} /> : null}
      {activeTab === 'Today' || !SCHEDULE_TABS.includes(activeTab) ? (
        <TodayView {...common} />
      ) : null}
    </AppPageShell>
  );
}
