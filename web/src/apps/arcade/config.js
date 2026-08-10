import {
  Bomb,
  BrickWall,
  Bug,
  Fish,
  Joystick,
  Spade,
  SquareStack,
  Worm,
  Zap,
} from 'lucide-react';
import { ArcadeApp } from './ArcadeApp';

/**
 * Edu.Arcade — for-fun classroom games so kids stay in Edu.Hub.
 * Classic, Cards, and Platformers are sibling sidebar panels.
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
      type: 'panel',
      panelTitle: 'Classic',
      panelSource: 'arcade-classic',
      panelContent: [
        {
          id: 'snake',
          label: 'Snake',
          icon: Worm,
          desc: 'Grow longer — don’t bite yourself',
        },
        {
          id: 'arkanoid',
          label: 'Arkanoid',
          icon: BrickWall,
          desc: 'Bounce the ball — clear every brick',
        },
      ],
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: SquareStack,
      type: 'panel',
      panelTitle: 'Cards',
      panelSource: 'arcade-cards',
      panelContent: [
        {
          id: 'card-games',
          label: 'Card Games',
          icon: SquareStack,
          desc: 'Solitaire, Spider, Go Fish, and more',
          subItems: [
            {
              id: 'solitaire',
              label: 'Solitaire',
              icon: Spade,
              desc: 'Klondike — Ace to King',
            },
            {
              id: 'spider',
              label: 'Spider',
              icon: Bug,
              desc: '10 columns — clear King to Ace runs',
            },
            {
              id: 'go-fish',
              label: 'Go Fish',
              icon: Fish,
              desc: 'Ask for ranks — 2 to 4 players',
            },
          ],
        },
      ],
    },
    {
      id: 'platformers',
      name: 'Platformers',
      icon: Zap,
      type: 'panel',
      panelTitle: 'Platformers',
      panelSource: 'arcade-platformers',
      panelContent: [
        {
          id: 'boom-jump',
          label: 'Boom Jump',
          icon: Bomb,
          desc: 'Hop TNT — outlast the collapse',
        },
      ],
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
