import { BookA, Sparkles } from 'lucide-react';
import { DictionaryApp } from './DictionaryApp';

/**
 * Edu.Dictionary — lookup for every age, with spelling help.
 */
export const dictionaryApp = {
  id: 'dictionary',
  name: 'Dictionary',
  themeKey: 'Dictionary',
  defaultView: 'Lookup',
  about: {
    description:
      'Type a word even if the spelling is off. Dictionary suggests close matches from how the word sounds, remembers how kids tried to spell it on this device, and shows a short definition with a public-domain picture when one is available.',
    features: [
      'Word of the Day with a picture and kid-readable definition',
      'Invented spellings still find the word (pouhm → poem)',
      'Kid-readable definitions from WordNet / Wiktionary',
      'Public-domain pictures (CC0) when we can find one',
      'Ask a teacher to type the real word; the class dictionary remembers that spelling',
    ],
  },
  nav: [
    { id: 'lookup', name: 'Lookup', icon: BookA, type: 'link' },
    { id: 'word-of-the-day', name: 'Word of the Day', icon: Sparkles, type: 'link' },
  ],
  View: DictionaryApp,
};
