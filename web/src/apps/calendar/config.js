import {
  Bookmark,
  Calendar,
  CalendarPlus,
  Layers,
  Timer,
} from 'lucide-react';
import { CalendarApp } from './CalendarApp';

/**
 * Edu.Calendar — per-class planners, rotations, countdowns.
 * App settings live in the shell Settings page (not a duplicate nav item).
 */
export const calendarApp = {
  id: 'calendar',
  name: 'Calendar',
  themeKey: 'Calendar',
  defaultView: 'Calendar',
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
    { id: 'calendar', name: 'Calendar', icon: Calendar, type: 'link' },
    {
      id: 'create',
      name: 'Create Calendar',
      icon: CalendarPlus,
      type: 'link',
    },
    {
      id: 'saved',
      name: 'Saved Calendar',
      icon: Bookmark,
      type: 'link',
    },
    { id: 'countdown', name: 'Countdown', icon: Timer, type: 'link' },
  ],
  View: CalendarApp,
};
