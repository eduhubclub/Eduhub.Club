import { useCallback, useEffect, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { PageHeader } from '../../shared/PageHeader';
import {
  readSchedule,
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
import { ResourcesView } from './views/ResourcesView';
import { PlanView } from './views/PlanView';
import { CloudPickView } from './views/CloudPickView';

const PLANNER_TABS = ['Resources', 'Plan', 'Cloud pick'];

function useClassPlanner(classId) {
  const [schedule, setSchedule] = useState(() => readSchedule(classId));
  const [resources, setResources] = useState(() => readResources(classId));
  const [plan, setPlan] = useState(() => readPlan(classId));

  const refresh = useCallback(() => {
    setSchedule(readSchedule(classId));
    setResources(readResources(classId));
    setPlan(readPlan(classId));
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onAny = () => refresh();
    window.addEventListener(SCHEDULE_UPDATED_EVENT, onAny);
    window.addEventListener(RESOURCES_UPDATED_EVENT, onAny);
    window.addEventListener(PLAN_UPDATED_EVENT, onAny);
    return () => {
      window.removeEventListener(SCHEDULE_UPDATED_EVENT, onAny);
      window.removeEventListener(RESOURCES_UPDATED_EVENT, onAny);
      window.removeEventListener(PLAN_UPDATED_EVENT, onAny);
    };
  }, [refresh]);

  return { schedule, resources, plan, refresh };
}

/**
 * Edu.Planner — resources, curriculum plan, cloud pickers.
 */
export function PlannerApp({ activeTab, isDarkMode, theme }) {
  const { selectedClass, classes } = useClasses();
  const activeClasses = (classes || []).filter((c) => !c.isArchived);
  const classId = selectedClass?.id;

  const bundle = useClassPlanner(classId);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <EmptyState
          isDarkMode={isDarkMode}
          message="Add a class first, then plan its curriculum links."
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
    classId,
    className: selectedClass.name,
    ...bundle,
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Planner"
        description={`${selectedClass.name} · Links and curriculum plan`}
        isDarkMode={isDarkMode}
      />

      {activeTab === 'Plan' ? <PlanView {...common} /> : null}
      {activeTab === 'Cloud pick' ? <CloudPickView {...common} /> : null}
      {activeTab === 'Resources' || !PLANNER_TABS.includes(activeTab) ? (
        <ResourcesView {...common} />
      ) : null}
    </AppPageShell>
  );
}
