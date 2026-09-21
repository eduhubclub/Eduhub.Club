import { Gem, Heart, Inbox, Layers } from 'lucide-react';
import { HeadspaceApp } from './HeadspaceApp';

/**
 * Edu.Headspace — SEL journaling hub. Pet Rock Pen Pal is the first type.
 */
export const headspaceApp = {
  id: 'headspace',
  name: 'Headspace',
  themeKey: 'Headspace',
  defaultView: 'Pet Rock',
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
      id: 'journaling',
      name: 'Journaling',
      icon: Heart,
      type: 'accordion',
      subItems: ['Pet Rock'],
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      type: 'link',
    },
  ],
  View: HeadspaceApp,
};

/** Journaling type cards for a future hub board. */
export const JOURNAL_TYPES = [
  {
    id: 'pet-rock',
    name: 'Pet Rock',
    tab: 'Pet Rock',
    icon: Gem,
    blurb: 'Name a rock, add googly eyes, draw, and write to your pen pal.',
  },
];
