import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { usePacingStore } from '../../data/pacing/usePacingStore';
import { ScheduleView } from './views/ScheduleView';
import { ContentAreasView } from './views/ContentAreasView';
import { WeekView } from './views/WeekView';
import { CalendarView } from './views/CalendarView';
import { InsightsView } from './views/InsightsView';

/**
 * Edu.Pacing shell — Schedule, Content Areas, Week, Calendar, Insights.
 * Check-in modal is hosted in AppShell so it also appears on Dashboard.
 */
export function PacingApp({ activeTab, isDarkMode, theme }) {
  const { store, refresh, school, grade } = usePacingStore();

  const common = { theme, isDarkMode, store, refresh, school, grade };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Pacing"
        description={`${school.name} · ${grade.label} · ${school.year}`}
        isDarkMode={isDarkMode}
      />
      {activeTab === 'Schedule' ? <ScheduleView {...common} /> : null}
      {activeTab === 'Content Areas' ? <ContentAreasView {...common} /> : null}
      {activeTab === 'Week' ? <WeekView {...common} /> : null}
      {activeTab === 'Calendar' ? <CalendarView {...common} /> : null}
      {activeTab === 'Insights' ? <InsightsView {...common} /> : null}
    </AppPageShell>
  );
}
