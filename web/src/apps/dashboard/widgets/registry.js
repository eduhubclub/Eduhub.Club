import {
  Building,
  Circle,
  CircleDashed,
  Shuffle,
  Layers,
  UserRound,
  Users,
  Save,
  Hash,
  CircleDot,
  Copy,
  Mic,
  Palette,
  Swords,
} from 'lucide-react';
import { WheelOfNamesWidget } from './WheelOfNamesWidget';
import { RandomizerShuffleWidget } from './RandomizerShuffleWidget';
import { PickACardWidget } from './PickACardWidget';
import { PullANameWidget } from './PullANameWidget';
import { GroupGeneratorWidget } from './GroupGeneratorWidget';
import { SavedGroupsWidget } from './SavedGroupsWidget';
import { PickANumberWidget } from './PickANumberWidget';
import { CoinTossWidget } from './CoinTossWidget';
import { TieBreakerCardWidget } from './TieBreakerCardWidget';
import { RandomTiebreakerWidget } from './RandomTiebreakerWidget';
import { StudentShowdownWidget } from './StudentShowdownWidget';
import { NoiseMeterWidget } from './NoiseMeterWidget';
import { ColorMeterWidget } from './ColorMeterWidget';
import { DotMeterWidget } from './DotMeterWidget';
import { BubbleClassroomWidget } from './BubbleClassroomWidget';
import { BlockTowerWidget } from './BlockTowerWidget';

/** Max teaching widgets pinned to the Dashboard sidebar. */
export const MAX_DASHBOARD_WIDGETS = 5;

/**
 * Widget catalog grouped by source app.
 * Only entries with `available: true` and a Component can be pinned.
 */
export const DASHBOARD_WIDGET_APPS = [
  {
    id: 'randomizer',
    name: 'Randomizer',
    widgets: [
      {
        id: 'wheel-of-names',
        name: 'Wheel of Names',
        description: 'Spin the wheel to pick a student.',
        icon: CircleDashed,
        available: true,
        Component: WheelOfNamesWidget,
      },
      {
        id: 'randomizer-shuffle',
        name: 'Randomizer',
        description: 'Shuffle cards until one student remains.',
        icon: Shuffle,
        available: true,
        Component: RandomizerShuffleWidget,
      },
      {
        id: 'pick-a-card',
        name: 'Pick a Card',
        description: 'Deal faces and tap to reveal a student.',
        icon: Layers,
        available: true,
        Component: PickACardWidget,
      },
      {
        id: 'pull-a-name',
        name: 'Pull a Name',
        description: 'Draw names from a cup one at a time.',
        icon: UserRound,
        available: true,
        Component: PullANameWidget,
      },
    ],
  },
  {
    id: 'groups',
    name: 'Groups',
    widgets: [
      {
        id: 'group-generator',
        name: 'Group Generator',
        description: 'Quickly generate and reshuffle student groups.',
        icon: Users,
        available: true,
        Component: GroupGeneratorWidget,
      },
      {
        id: 'saved-groups',
        name: 'Saved Groups',
        description: 'Reopen and adjust saved group arrangements.',
        icon: Save,
        available: true,
        Component: SavedGroupsWidget,
      },
    ],
  },
  {
    id: 'tiebreaker',
    name: 'TieBreaker',
    widgets: [
      {
        id: 'pick-a-number',
        name: 'Pick A Number',
        description: 'Settle a tie with a random number in a range.',
        icon: Hash,
        available: true,
        Component: PickANumberWidget,
      },
      {
        id: 'coin-toss',
        name: 'Coin Toss',
        description: 'Flip a coin for a quick heads-or-tails decision.',
        icon: CircleDot,
        available: true,
        Component: CoinTossWidget,
      },
      {
        id: 'tiebreaker-pick-a-card',
        name: 'Pick A Card',
        description: 'Draw a playing card for a classroom choice.',
        icon: Copy,
        available: true,
        Component: TieBreakerCardWidget,
      },
      {
        id: 'random-tiebreaker',
        name: 'Random Tiebreaker',
        description: 'Pick a classic challenge like RPS or thumb war.',
        icon: Shuffle,
        available: true,
        Component: RandomTiebreakerWidget,
      },
      {
        id: 'student-showdown',
        name: 'Student Showdown',
        description: '1v1 matchups or split the class into teams.',
        icon: Swords,
        available: true,
        Component: StudentShowdownWidget,
      },
    ],
  },
  {
    id: 'noisemeter',
    name: 'NoiseMeter',
    widgets: [
      {
        id: 'noise-meter',
        name: 'Noise Meter',
        description: 'Live classroom volume meter with pause and alert limit.',
        icon: Mic,
        available: true,
        Component: NoiseMeterWidget,
      },
      {
        id: 'color-meter',
        name: 'Color Meter',
        description: 'Calm green–amber–red card that shifts with classroom volume.',
        icon: Palette,
        available: true,
        Component: ColorMeterWidget,
      },
      {
        id: 'dot-meter',
        name: 'Dot Meter',
        description: 'Soft dots that fill in when the class goes over the alert limit.',
        icon: CircleDot,
        available: true,
        Component: DotMeterWidget,
      },
      {
        id: 'bubble-classroom',
        name: 'Bubble Classroom',
        description: 'Keep bubbles floating by keeping voices low.',
        icon: Circle,
        available: true,
        Component: BubbleClassroomWidget,
      },
      {
        id: 'block-tower',
        name: 'Block Tower',
        description: 'Quiet voices keep the tower standing.',
        icon: Building,
        available: true,
        Component: BlockTowerWidget,
      },
    ],
  },
];

/** Flat list of every catalog entry (available and not). */
export const DASHBOARD_WIDGETS = DASHBOARD_WIDGET_APPS.flatMap((app) =>
  app.widgets.map((w) => ({ ...w, appId: app.id, appName: app.name }))
);

export function getDashboardWidget(id) {
  return DASHBOARD_WIDGETS.find((w) => w.id === id) ?? null;
}

export function isWidgetAvailable(id) {
  const w = getDashboardWidget(id);
  return Boolean(w?.available && w?.Component);
}
