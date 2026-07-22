import { BookOpenCheck, Heart, LayoutGrid, SquareStack, WholeWord } from 'lucide-react';
import { EarlyLiteracyApp } from './EarlyLiteracyApp';

/**
 * Edu.EarlyLiteracy — blending, segmenting, and foundational word work.
 */
export const earlyLiteracyApp = {
  id: 'earlyliteracy',
  name: 'EarlyLiteracy',
  themeKey: 'EarlyLiteracy',
  defaultView: 'Blending Board',
  nav: [
    {
      id: 'blending-board',
      name: 'Blending Board',
      icon: LayoutGrid,
      type: 'link',
    },
    {
      id: 'word-work-mat',
      name: 'Word Work Mat',
      icon: WholeWord,
      type: 'link',
    },
    {
      id: 'elkonin',
      name: 'Elkonin Boxes',
      icon: SquareStack,
      type: 'link',
    },
    {
      id: 'heart-words',
      name: 'Heart Words',
      icon: Heart,
      type: 'link',
    },
    {
      id: 'sound-wall',
      name: 'Sound Wall',
      icon: BookOpenCheck,
      type: 'link',
    },
  ],
  View: EarlyLiteracyApp,
};
