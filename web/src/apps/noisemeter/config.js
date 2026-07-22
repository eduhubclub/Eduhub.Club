import { Building, Circle, CircleDot, Mic, Palette } from 'lucide-react';
import { NoiseMeterApp } from './NoiseMeterApp';

/**
 * Edu.NoiseMeter — classroom volume meter and quiet-room games.
 */
export const noiseMeterApp = {
  id: 'noisemeter',
  name: 'NoiseMeter',
  themeKey: 'NoiseMeter',
  defaultView: 'Noise Meter',
  nav: [
    { id: 'noise-meter', name: 'Noise Meter', icon: Mic, type: 'link' },
    { id: 'color-meter', name: 'Color Meter', icon: Palette, type: 'link' },
    { id: 'dot-meter', name: 'Dot Meter', icon: CircleDot, type: 'link' },
    { id: 'bubble', name: 'Bubble', icon: Circle, type: 'link' },
    { id: 'tower', name: 'Tower', icon: Building, type: 'link' },
  ],
  View: NoiseMeterApp,
};
