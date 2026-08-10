import {
  Archive,
  Clock,
  Globe,
  Layers,
  Library,
  Timer as TimerIcon,
  User,
  Users,
} from 'lucide-react';
import { TimerApp } from './TimerApp';

/**
 * Edu.Timer — classroom timers, stopwatches, and clocks.
 * Learning embeds the Clock widget from Edu.MathTools.
 */
export const timerApp = {
  id: 'timer',
  name: 'Timer',
  themeKey: 'Timer',
  defaultView: 'Whole Class',
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
    { id: 'whole-class', name: 'Whole Class', icon: Users, type: 'link' },
    { id: 'small-group', name: 'Small Group', icon: Layers, type: 'link' },
    { id: 'individual', name: 'Individual', icon: User, type: 'link' },
    { id: 'stopwatch', name: 'Stopwatch', icon: TimerIcon, type: 'link' },
    { id: 'learning', name: 'Learning', icon: Library, type: 'link' },
    { id: 'saved', name: 'Saved Timers', icon: Archive, type: 'link' },
    { id: 'local', name: 'Local Time', icon: Clock, type: 'link' },
    { id: 'world', name: 'World Clock', icon: Globe, type: 'link' },
  ],
  View: TimerApp,
};
