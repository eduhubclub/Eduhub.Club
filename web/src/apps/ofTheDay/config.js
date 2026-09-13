import { Bookmark, Layers, Plus, Sparkles, Users } from 'lucide-react';
import { OF_THE_DAY_META, OF_THE_DAY_TYPES } from '../../data/ofTheDay/types';
import { OfTheDayApp } from './OfTheDayApp';

/**
 * Edu.OfTheDay — daily Joke, Art, Animal, Word, Quote, Fact, and Song.
 */
export const ofTheDayApp = {
  id: 'ofTheDay',
  name: 'OfTheDay',
  themeKey: 'OfTheDay',
  defaultView: 'Today',
  about: {
    description:
      'A classroom hub for Joke, Art, Animal, Word, Quote, Fact, and Song of the Day. Dictionary’s Word of the Day pulls from here. Save a day’s set and reuse it in every class.',
    features: [
      'Today grid with all seven types at once',
      'A sidebar tab for each type',
      'Date-stable picks you can reshuffle',
      'Create your own jokes, quotes, facts, and songs',
      'Community list for items you mark public',
      'Art and animals with public-domain pictures',
      'Song Listen opens YouTube in a new tab',
    ],
  },
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
    { id: 'today', name: 'Today', icon: Sparkles, type: 'link' },
    ...OF_THE_DAY_TYPES.map((type) => ({
      id: type,
      name: OF_THE_DAY_META[type].label,
      icon: OF_THE_DAY_META[type].Icon,
      type: 'link',
    })),
    { id: 'saved', name: 'Saved', icon: Bookmark, type: 'link' },
    { id: 'create', name: 'Create', icon: Plus, type: 'link' },
    { id: 'community', name: 'Community', icon: Users, type: 'link' },
  ],
  View: OfTheDayApp,
};
