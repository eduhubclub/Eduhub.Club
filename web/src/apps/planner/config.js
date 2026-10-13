import { Cloud, Layers, Link2, ListOrdered } from 'lucide-react';
import { PlannerApp } from './PlannerApp';

/**
 * Edu.Planner — link library, Day #N curriculum queue, cloud pickers.
 */
export const plannerApp = {
  id: 'planner',
  name: 'Planner',
  themeKey: 'Planner',
  defaultView: 'Resources',
  about: {
    description:
      'Hang Drive, OneDrive, and web links on Day #N for teaching from the Dashboard hub — separate from building the bell schedule.',
    features: [
      'Link library (metadata only)',
      'Google Drive and OneDrive search',
      'Assign resources to Day #N / slots',
      'Mark done and shift the curriculum queue',
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
    { id: 'resources', name: 'Resources', icon: Link2, type: 'link' },
    { id: 'plan', name: 'Plan', icon: ListOrdered, type: 'link' },
    { id: 'cloud', name: 'Cloud pick', icon: Cloud, type: 'link' },
  ],
  View: PlannerApp,
};
