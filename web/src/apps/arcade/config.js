import {
  Bomb,
  BrickWall,
  Bug,
  Fish,
  Grid3x3,
  Spade,
  TrainFront,
  Worm,
} from 'lucide-react';
import { ArcadeApp } from './ArcadeApp';

/**
 * Edu.Arcade — for-fun classroom games so kids stay in Edu.Hub.
 * Flat primary-sidebar tabs (one game per link — no panels or accordions).
 */
export const arcadeApp = {
  id: 'arcade',
  name: 'Arcade',
  themeKey: 'Arcade',
  defaultView: 'Solitaire',
  nav: [
    { id: 'snake', name: 'Snake', icon: Worm, type: 'link' },
    { id: 'arkanoid', name: 'Arkanoid', icon: BrickWall, type: 'link' },
    { id: 'solitaire', name: 'Solitaire', icon: Spade, type: 'link' },
    { id: 'spider', name: 'Spider', icon: Bug, type: 'link' },
    { id: 'go-fish', name: 'Go Fish', icon: Fish, type: 'link' },
    { id: 'math-train', name: 'Math Train', icon: TrainFront, type: 'link' },
    { id: 'sudoku', name: 'Sudoku', icon: Grid3x3, type: 'link' },
    { id: 'boom-jump', name: 'Boom Jump', icon: Bomb, type: 'link' },
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
