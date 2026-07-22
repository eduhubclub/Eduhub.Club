import {
  CircleDot,
  Copy,
  Hash,
  Layers,
  Shuffle,
  Swords,
} from 'lucide-react';
import { TieBreakerApp } from './TieBreakerApp';

/**
 * Edu.TieBreaker — classroom tiebreakers and matchups.
 * Reads shared Classes data for Student Showdown.
 */
export const tiebreakerApp = {
  id: 'tiebreaker',
  name: 'TieBreaker',
  themeKey: 'TieBreaker',
  defaultView: 'Pick A Number',
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
    { id: 'pick-a-number', name: 'Pick A Number', icon: Hash, type: 'link' },
    { id: 'coin-toss', name: 'Coin Toss', icon: CircleDot, type: 'link' },
    { id: 'pick-a-card', name: 'Pick A Card', icon: Copy, type: 'link' },
    { id: 'random-tiebreaker', name: 'Random Tiebreaker', icon: Shuffle, type: 'link' },
    { id: 'student-showdown', name: 'Student Showdown', icon: Swords, type: 'link' },
  ],
  View: TieBreakerApp,
};
