import {
  Bomb,
  BrickWall,
  Bug,
  Calculator,
  Fish,
  Grid3x3,
  Joystick,
  Spade,
  SquareStack,
  TrainFront,
  Worm,
  Zap,
} from 'lucide-react';
import { ArcadeApp } from './ArcadeApp';

/**
 * Edu.Arcade — for-fun classroom games so kids stay in Edu.Hub.
 * Classic, Cards, Number Games, and Platformers are primary-sidebar accordions.
 */
export const arcadeApp = {
  id: 'arcade',
  name: 'Arcade',
  themeKey: 'Arcade',
  defaultView: 'Card Games',
  nav: [
    {
      id: 'classic',
      name: 'Classic',
      icon: Joystick,
      type: 'accordion',
      subItems: ['Snake', 'Arkanoid'],
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: SquareStack,
      type: 'accordion',
      subItems: ['Solitaire', 'Spider', 'Go Fish'],
    },
    {
      id: 'number-games',
      name: 'Number Games',
      icon: Calculator,
      type: 'accordion',
      subItems: ['Math Train', 'Sudoku'],
    },
    {
      id: 'platformers',
      name: 'Platformers',
      icon: Zap,
      type: 'accordion',
      subItems: ['Boom Jump'],
    },
  ],
  View: ArcadeApp,
};

/** Early-arcade cabinets on the Classic selection board. */
export const CLASSIC_GAMES = [
  {
    id: 'snake',
    name: 'Snake',
    tab: 'Snake',
    icon: Worm,
    blurb: 'Eat, grow, and don’t crash into yourself.',
  },
  {
    id: 'arkanoid',
    name: 'Arkanoid',
    tab: 'Arkanoid',
    icon: BrickWall,
    blurb: 'Keep the ball alive and clear the bricks.',
  },
];

/** Number-game cabinets on the Number Games selection board. */
export const NUMBER_GAMES = [
  {
    id: 'math-train',
    name: 'Math Train',
    tab: 'Math Train',
    icon: TrainFront,
    blurb: 'Swipe a train of numbers that hits the target.',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    tab: 'Sudoku',
    icon: Grid3x3,
    blurb: 'Fill every row, column, and box with 1–9.',
  },
];

/** Card-game cabinets shown on the Cards selection board. */
export const CARD_GAMES = [
  {
    id: 'solitaire',
    name: 'Solitaire',
    tab: 'Solitaire',
    icon: Spade,
    blurb: 'Klondike — build foundations Ace to King.',
  },
  {
    id: 'spider',
    name: 'Spider',
    tab: 'Spider',
    icon: Bug,
    blurb: '10 columns — clear eight King-to-Ace runs.',
  },
  {
    id: 'go-fish',
    name: 'Go Fish',
    tab: 'Go Fish',
    icon: Fish,
    blurb: 'Hot-seat classic — ask for ranks with 2–4 players.',
  },
];

/** Platformer cabinets on the Platformers selection board. */
export const PLATFORMER_GAMES = [
  {
    id: 'boom-jump',
    name: 'Boom Jump',
    tab: 'Boom Jump',
    icon: Bomb,
    blurb: 'Trigger TNT, ride the collapse, stay airborne.',
  },
];
