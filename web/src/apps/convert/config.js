import {
  FileText,
  FileType,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { ConvertApp } from './ConvertApp';

/**
 * Edu.Convert — free, on-device file conversion for teachers.
 */
export const convertApp = {
  id: 'convert',
  name: 'Convert',
  themeKey: 'Convert',
  defaultView: 'Images',
  about: {
    description:
      'Convert classroom files on this device — nothing is uploaded. Images and PDF tools are ready; Office and media come next.',
    features: [
      'PNG, JPG, and WEBP convert, resize, crop, rotate, and compress presets',
      'PDF merge, split, rotate, edit pages, stamp, and compress',
      'PDF ↔ images and batch ZIP download',
      'Processed in the browser; free and private',
      'Office and media tabs coming soon',
    ],
  },
  nav: [
    { id: 'images', name: 'Images', icon: ImageIcon, type: 'link' },
    { id: 'pdf', name: 'PDF', icon: FileText, type: 'link' },
    { id: 'office', name: 'Office', icon: FileType, type: 'link' },
    { id: 'media', name: 'Media', icon: Film, type: 'link' },
  ],
  View: ConvertApp,
};
