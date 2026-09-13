import {
  BookA,
  Cat,
  Landmark,
  Laugh,
  Lightbulb,
  Music,
  Quote,
} from 'lucide-react';

/** @typedef {'joke' | 'art' | 'animal' | 'word' | 'quote' | 'fact' | 'song'} OfTheDayType */

/** @type {OfTheDayType[]} */
export const OF_THE_DAY_TYPES = [
  'joke',
  'art',
  'animal',
  'word',
  'quote',
  'fact',
  'song',
];

export const OF_THE_DAY_META = {
  joke: { id: 'joke', label: 'Joke', Icon: Laugh },
  art: { id: 'art', label: 'Art', Icon: Landmark },
  animal: { id: 'animal', label: 'Animal', Icon: Cat },
  word: { id: 'word', label: 'Word', Icon: BookA },
  quote: { id: 'quote', label: 'Quote', Icon: Quote },
  fact: { id: 'fact', label: 'Fact', Icon: Lightbulb },
  song: { id: 'song', label: 'Song', Icon: Music },
};

export const OF_THE_DAY_UPDATED_EVENT = 'eduHub.ofTheDay.updated';

/**
 * @param {string} type
 * @returns {type is OfTheDayType}
 */
export function isOfTheDayType(type) {
  return OF_THE_DAY_TYPES.includes(/** @type {OfTheDayType} */ (type));
}
