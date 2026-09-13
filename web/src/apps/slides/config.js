import {
  FileUp,
  GalleryVertical,
  Layers,
  Pencil,
  Presentation,
  QrCode,
} from 'lucide-react';
import { SlidesApp } from './SlidesApp';

/**
 * Edu.Slides — teacher lesson decks, Present, import, and student follow.
 */
export const slidesApp = {
  id: 'slides',
  name: 'Slides',
  themeKey: 'Slides',
  defaultView: 'Decks',
  about: {
    description:
      'Build 16:9 lesson decks, present them on the classroom display, import PDF or PowerPoint, and let students follow along.',
    features: [
      'Freeform 16:9 canvas with text, images, shapes, and Edu.Hub embeds',
      'Fullscreen Present with keyboard or click to advance',
      'Optional speaker notes in a second window on this computer',
      'Import PDF pages and PowerPoint files',
      'Google Slides export when an OAuth client ID is set',
      'Join code and QR so students can follow on a second window',
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
    { id: 'decks', name: 'Decks', icon: GalleryVertical, type: 'link' },
    { id: 'edit', name: 'Edit', icon: Pencil, type: 'link' },
    { id: 'present', name: 'Present', icon: Presentation, type: 'link' },
    { id: 'follow', name: 'Follow', icon: QrCode, type: 'link' },
    { id: 'import', name: 'Import', icon: FileUp, type: 'link' },
  ],
  View: SlidesApp,
};
