import { Layers, Star } from 'lucide-react';
import { GradesApp } from './GradesApp';

/**
 * Grades — native scores from Tests, plus a teacher close when a student cannot finish.
 */
export const gradesApp = {
  id: 'grades',
  name: 'Grades',
  themeKey: 'Grades',
  defaultView: 'Book',
  about: {
    description:
      'See each test score the way the author wrote it. Enter a score and close a test when a student cannot finish it on their own.',
    features: [
      'Native points for every assigned test',
      'Formative scores stay out of the compiled subject grade',
      'Close a test so it leaves the student list',
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
    { id: 'book', name: 'Book', icon: Star, type: 'link' },
  ],
  View: GradesApp,
};
