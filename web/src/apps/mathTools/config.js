import { Clock, Coins } from 'lucide-react';
import { MathToolsApp } from './MathToolsApp';

/**
 * Edu.MathTools — host for math learning desks (Money, Clock, …).
 * Bank / Timer Learning tabs embed these as widgets.
 */
export const mathToolsApp = {
  id: 'mathTools',
  name: 'MathTools',
  themeKey: 'MathTools',
  defaultView: 'Money',
  nav: [
    { id: 'money', name: 'Money', icon: Coins, type: 'link' },
    { id: 'clock', name: 'Clock', icon: Clock, type: 'link' },
  ],
  View: MathToolsApp,
};
