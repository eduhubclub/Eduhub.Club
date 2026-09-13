import { FlaskConical, Layers, LayoutGrid, Pencil } from 'lucide-react';
import { MorningMeetingApp } from './MorningMeetingApp';

/**
 * Edu.MorningMeeting — walk-in classroom board with pinned widgets.
 */
export const morningMeetingApp = {
  id: 'morningMeeting',
  name: 'MorningMeeting',
  themeKey: 'MorningMeeting',
  defaultView: 'Board',
  about: {
    description:
      'The first thing students see when they walk in — a customizable board of date, instructions, attendance, lunch, jobs, and timer cards.',
    features: [
      'Pin widgets to a classroom morning board',
      'Resize cards small, medium, or large',
      'Live attendance and hot-lunch counts',
      'Morning message, today’s date, and weather',
      'Classroom jobs snapshot and a quick timer',
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
    { id: 'board', name: 'Board', icon: LayoutGrid, type: 'link' },
    { id: 'edit', name: 'Edit board', icon: Pencil, type: 'link' },
    { id: 'layoutLab', name: 'Layout lab', icon: FlaskConical, type: 'link' },
  ],
  View: MorningMeetingApp,
};
