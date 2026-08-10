import {
  Award,
  ClipboardList,
  Layers,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { BehaviorApp } from './BehaviorApp';

/**
 * Edu.Behavior — ClassDojo-style points tracker.
 * Store nav is filtered in AppShell when Edu.Store → Connect to Behavior is off.
 */
export const behaviorApp = {
  id: 'behavior',
  name: 'Behavior',
  themeKey: 'Behavior',
  defaultView: 'Award',
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
    { id: 'award', name: 'Award', icon: Award, type: 'link' },
    { id: 'behaviors', name: 'Behaviors', icon: Sparkles, type: 'link' },
    { id: 'store', name: 'Store', icon: ShoppingBag, type: 'link' },
    { id: 'trends', name: 'Trends', icon: TrendingUp, type: 'link' },
    { id: 'reports', name: 'Reports', icon: ClipboardList, type: 'link' },
  ],
  View: BehaviorApp,
};
