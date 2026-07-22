import { Layers, Library, Presentation, Save } from 'lucide-react';
import { DashboardApp } from './DashboardApp';

/**
 * Edu.Dashboard — smart whiteboard / annotation surface.
 * Classes + Lessons panels use the shared double-sidebar (SecondaryPanel).
 */
export const dashboardApp = {
  id: 'dashboard',
  name: 'Dashboard',
  themeKey: 'Dashboard',
  defaultView: 'Whiteboard',
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
    {
      id: 'lessons',
      name: 'Lessons',
      icon: Library,
      type: 'panel',
      panelTitle: 'Lessons',
      panelSource: 'lessons',
      panelContent: [],
    },
    { id: 'whiteboard', name: 'Whiteboard', icon: Presentation, type: 'link' },
    {
      id: 'saved-whiteboards',
      name: 'Saved Whiteboards',
      icon: Save,
      type: 'link',
    },
  ],
  View: DashboardApp,
};
