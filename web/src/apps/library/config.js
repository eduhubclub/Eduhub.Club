import {
  BookMarked,
  BookPlus,
  Layers,
  Library,
  ScanBarcode,
  Tag,
} from 'lucide-react';
import { LibraryApp } from './LibraryApp';

/**
 * Edu.Library — classroom bookshelf, ISBN ingest, and checkout.
 */
export const libraryApp = {
  id: 'library',
  name: 'Library',
  themeKey: 'Library',
  defaultView: 'Circulation',
  about: {
    description:
      'Build your classroom shelf, print unique copy labels, and check books out to students with due dates.',
    features: [
      'Manage titles and copies in Manage Library',
      'Multiple copies of the same title with unique printed labels',
      'Teacher checkout, student self-checkout, and year-end inventory',
      'Due dates, overdue list, and max books per student',
      'One library for this teacher — any class can borrow',
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
    { id: 'scan', name: 'Circulation', icon: ScanBarcode, type: 'link' },
    { id: 'shelf', name: 'Library', icon: Library, type: 'link' },
    { id: 'out', name: 'Out', icon: BookMarked, type: 'link' },
    { id: 'manage', name: 'Manage Library', icon: BookPlus, type: 'link' },
    { id: 'labels', name: 'Labels', icon: Tag, type: 'link' },
  ],
  View: LibraryApp,
};
