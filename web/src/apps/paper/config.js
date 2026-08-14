import { Bookmark, NotebookPen } from 'lucide-react';
import { PaperApp } from './PaperApp';

/**
 * Edu.Paper — custom printable paper (lines, dots, grids, and more).
 */
export const paperApp = {
  id: 'paper',
  name: 'Paper',
  themeKey: 'Paper',
  defaultView: 'Paper',
  about: {
    description:
      'Print custom classroom paper at Letter size (8.5×11). Preview in the app, then print or download a PDF. Lined sheets use blue rules and a red margin so they stay readable in grayscale or color.',
    features: [
      'Lined, primary, handwriting, story, Cornell, music, and more',
      'Dots, grid, graph, isometric, hex, number lines, and boxes',
      'Live sliders for spacing, margins, stroke, and ink',
      'Vertical or horizontal Letter preview',
      'Print from the browser and download a vector PDF',
      'Save presets like “3rd grade handwriting”',
    ],
  },
  nav: [
    { id: 'paper', name: 'Paper', icon: NotebookPen, type: 'link' },
    { id: 'saved', name: 'Saved', icon: Bookmark, type: 'link' },
  ],
  View: PaperApp,
};
