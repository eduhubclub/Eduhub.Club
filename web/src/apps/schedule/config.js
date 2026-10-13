import {
  CalendarDays,
  CalendarRange,
  Layers,
  LayoutList,
} from 'lucide-react';
import { ScheduleApp } from './ScheduleApp';

/**
 * Edu.Schedule — per-class day structure and Day #N.
 */
export const scheduleApp = {
  id: 'schedule',
  name: 'Schedule',
  themeKey: 'Schedule',
  defaultView: 'Today',
  about: {
    description:
      'Build each class day’s lesson slots and track Day #N from the school calendar. Hang curriculum links in Planner.',
    features: [
      'Day #N from Calendar session days',
      'Day presets with weekday selection (FAB to add)',
      'Week block view with times × days',
      'Today’s periods with quick plan assign',
    ],
  },
  nav: [
    {
      id: 'classes',
      name: 'Classes',
      icon: Layers,
      type: 'panel',
      panelTitle: 'Classes',
      panelSource: 'classes',
      panelContent: [],
    },
    { id: 'today', name: 'Today', icon: CalendarDays, type: 'link' },
    { id: 'templates', name: 'Day shape', icon: LayoutList, type: 'link' },
    { id: 'blocks', name: 'Block view', icon: CalendarRange, type: 'link' },
  ],
  View: ScheduleApp,
};
