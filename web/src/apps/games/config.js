import { Grid3x3 } from 'lucide-react';
import { GamesApp } from './GamesApp';

/**
 * Edu.Games — classroom literacy and learning games.
 */
export const gamesApp = {
  id: 'games',
  name: 'Games',
  themeKey: 'Games',
  defaultView: 'Wordle',
  nav: [
    { id: 'wordle', name: 'Wordle', icon: Grid3x3, type: 'link' },
  ],
  View: GamesApp,
};
