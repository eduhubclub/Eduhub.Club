import {
  Archive,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Settings2,
} from 'lucide-react';
import { ClassCreatorApp } from './ClassCreatorApp';

/**
 * Class Creator — school-wide elementary next-grade placement (Admin + teacher ratings).
 */
export const classCreatorApp = {
  id: 'class-creator',
  name: 'Class Creator',
  themeKey: 'ClassCreator',
  defaultView: 'Dashboard',
  about: {
    description:
      'Build next-year elementary classes school-wide — every grade rates together, then place into next-year teachers by grade.',
    features: [
      'School-wide rating window across the elementary band',
      'CSV intake for Kindergarten and new students',
      'Admin-customizable rating schema and sort priorities',
      'Survey Preview so admins can check the teacher survey before sending it',
      'Teacher rating grids with separations and pairings',
      'Setup for preplacement (rooms and teachers); Place to auto-sort after surveys',
      'Archive finalized next-year class lists for later reference',
    ],
  },
  nav: [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, type: 'link' },
    { id: 'setup', name: 'Setup', icon: Settings2, type: 'link', adminOnly: true },
    { id: 'ratings', name: 'Survey Preview', icon: ListChecks, type: 'link' },
    { id: 'place', name: 'Place', icon: LayoutGrid, type: 'link', adminOnly: true },
    { id: 'results', name: 'Results', icon: ClipboardList, type: 'link' },
    { id: 'archive', name: 'Archive', icon: Archive, type: 'link', adminOnly: true },
  ],
  View: ClassCreatorApp,
};
