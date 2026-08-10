import {
  Award,
  ClipboardCheck,
  FileText,
  Layers,
  Utensils,
} from 'lucide-react';
import { AttendanceApp } from './AttendanceApp';

/**
 * Edu.Attendance — daily marks, lunch count, reports, and attendance goals.
 */
export const attendanceApp = {
  id: 'attendance',
  name: 'Attendance',
  themeKey: 'Attendance',
  defaultView: 'Daily',
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
    { id: 'daily', name: 'Daily', icon: ClipboardCheck, type: 'link' },
    { id: 'lunch', name: 'Lunch', icon: Utensils, type: 'link' },
    { id: 'reports', name: 'Reports', icon: FileText, type: 'link' },
    { id: 'awards', name: 'Awards', icon: Award, type: 'link' },
  ],
  View: AttendanceApp,
};
