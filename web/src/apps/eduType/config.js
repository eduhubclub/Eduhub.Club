import {
  BookOpen,
  Bookmark,
  CalendarDays,
  BarChart2,
  Keyboard,
  Layers,
  PenLine,
  Trophy,
} from 'lucide-react';
import { EduTypeApp } from './EduTypeApp';

/**
 * Edu.Type — typing lessons, Type a Classic, and practice for the day.
 */
export const eduTypeApp = {
  id: 'eduType',
  name: 'Edu.Type',
  themeKey: 'EduType',
  defaultView: 'Type a Classic',
  nav: [
    {
      id: 'classes',
      name: 'Classes',
      icon: Layers,
      type: 'panel',
      panelTitle: 'Classes',
      panelSource: 'classes',
      panelContent: [],
      teacherOnly: true,
    },
    { id: 'type-a-classic', name: 'Type a Classic', icon: BookOpen, type: 'link' },
    { id: 'today', name: 'Today', icon: CalendarDays, type: 'link' },
    { id: 'create', name: 'Create', icon: PenLine, type: 'link', teacherOnly: true },
    { id: 'saved', name: 'Saved', icon: Bookmark, type: 'link', teacherOnly: true },
    { id: 'lessons', name: 'Lessons', icon: Keyboard, type: 'link' },
    { id: 'arcade', name: 'Arcade', icon: Trophy, type: 'link' },
    { id: 'stats', name: 'Class Stats', icon: BarChart2, type: 'link', teacherOnly: true },
  ],
  View: EduTypeApp,
};
