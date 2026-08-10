import { Briefcase, ClipboardList, LayoutDashboard, Layers } from 'lucide-react';
import { JobsApp } from './JobsApp';

/**
 * Edu.Jobs — classroom jobs & salaries.
 * Reads shared Classes roster; optional sync pushes salaries into Bank for payday.
 */
export const jobsApp = {
  id: 'jobs',
  name: 'Jobs',
  themeKey: 'Jobs',
  defaultView: 'Dashboard',
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
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, type: 'link' },
    { id: 'jobs', name: 'Job Assignments', icon: Briefcase, type: 'link' },
    { id: 'job-board', name: 'Job Board', icon: ClipboardList, type: 'link' },
  ],
  View: JobsApp,
};
