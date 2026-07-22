import { Layers, Archive } from 'lucide-react';
import { ClassesApp } from './ClassesApp';

/**
 * Classes app — teacher foundation.
 * Nav is intentionally simple (no accordion/panel); student data lives in
 * the shared ClassProvider for every other app to consume.
 */
export const classesApp = {
  id: 'classes',
  name: 'Classes',
  themeKey: 'Classes',
  defaultView: 'Classes',
  about: {
    description:
      'Classes is your roster home base. Build classes with subjects and grade levels, add students, and keep the shared directory other Edu.Hub apps read from.',
    features: [
      'Create classes with name, subject, grade, and icon',
      'Add students by typing, pasting, or importing a CSV',
      'Open a class roster and edit student details',
      'Reorder classes with drag and drop',
      'Archive classes you are not using this term',
      'Share roster data with Randomizer, Groups, Timer, and more',
    ],
  },
  nav: [
    { id: 'classes', name: 'Classes', icon: Layers, type: 'link' },
    { id: 'archive', name: 'Archive', icon: Archive, type: 'link' },
  ],
  View: ClassesApp,
};
