import { ClipboardList, Layers, SpellCheck } from 'lucide-react';
import { ScreenerApp } from './ScreenerApp';

/**
 * Edu.Screener — host for classroom screeners. LETRS Spelling is the first.
 */
export const screenerApp = {
  id: 'screener',
  name: 'Screener',
  themeKey: 'Screener',
  defaultView: 'Screeners',
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
    { id: 'screeners', name: 'Screeners', icon: SpellCheck, type: 'link' },
    { id: 'results', name: 'Results', icon: ClipboardList, type: 'link' },
  ],
  View: ScreenerApp,
};
