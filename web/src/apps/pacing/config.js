import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  Clock3,
  LineChart,
} from 'lucide-react';
import { PacingApp } from './PacingApp';

/**
 * Edu.Pacing — district steady path + teacher reality for curriculum pacing.
 */
export const pacingApp = {
  id: 'pacing',
  name: 'Pacing',
  themeKey: 'Pacing',
  defaultView: 'Schedule',
  about: {
    description:
      'School schedule minutes, content-area pacings, calendar placement, and teacher week adjustments — with district as the steady path.',
    features: [
      'TES schedule seed with available teaching minutes',
      'Content area pacings and lesson slots',
      'Calendar placement and district block-outs',
      'Teacher week edits, check-in, and pace insights',
    ],
  },
  nav: [
    { id: 'schedule', name: 'Schedule', icon: Clock3, type: 'link' },
    { id: 'content', name: 'Content Areas', icon: BookOpen, type: 'link' },
    { id: 'week', name: 'Week', icon: CalendarRange, type: 'link' },
    { id: 'calendar', name: 'Calendar', icon: CalendarDays, type: 'link' },
    { id: 'insights', name: 'Insights', icon: LineChart, type: 'link' },
  ],
  View: PacingApp,
};
