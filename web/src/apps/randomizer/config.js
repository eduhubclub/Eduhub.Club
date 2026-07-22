import { Layers, Shuffle, CircleDashed, SquareStack, Inbox } from 'lucide-react';
import { RandomizerApp } from './RandomizerApp';

/**
 * Edu.Randomizer — class roster randomizers (proof-of-concept modes).
 * Reads shared Classes data; does not own student records.
 *
 * `panelSource: 'classes'` tells the shell to fill the double-sidebar
 * panel from the live class list (same pattern other apps can reuse).
 */
export const randomizerApp = {
  id: 'randomizer',
  name: 'Randomizer',
  themeKey: 'Randomizer',
  defaultView: 'Randomizer',
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
    { id: 'randomizer', name: 'Randomizer', icon: Shuffle, type: 'link' },
    { id: 'wheel', name: 'Wheel of Names', icon: CircleDashed, type: 'link' },
    { id: 'cards', name: 'Pick a Card', icon: SquareStack, type: 'link' },
    { id: 'pull', name: 'Pull A Name', icon: Inbox, type: 'link' },
  ],
  View: RandomizerApp,
};
