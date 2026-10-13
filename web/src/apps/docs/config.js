import { Cloud, FileText, Files, LayoutTemplate, Trash2 } from 'lucide-react';
import { DocsApp } from './DocsApp';

/**
 * Edu.Docs — local-first word processor (native .edudoc).
 */
export const docsApp = {
  id: 'docs',
  name: 'Docs',
  themeKey: 'Docs',
  defaultView: 'Documents',
  about: {
    description:
      'A streamlined classroom word processor. Docs live on this device first; optional Drive / OneDrive copies use Edu.Hub’s .edudoc format so Word won’t scramble them.',
    features: [
      'Documents (recent), Files, Templates, Shared, and Trash',
      'Reusable template docs',
      'Bold, italic, underline, headings, lists, fonts & sizes',
      'Letter page layout with print / PDF export',
      'Images, tables, and local comments',
      'Save / open .edudoc under Edu.Hub/Docs on Drive or OneDrive',
    ],
  },
  nav: [
    { id: 'documents', name: 'Documents', icon: FileText, type: 'link' },
    { id: 'files', name: 'Files', icon: Files, type: 'link' },
    {
      id: 'templates',
      name: 'Templates',
      icon: LayoutTemplate,
      type: 'link',
    },
    { id: 'shared', name: 'Shared', icon: Cloud, type: 'link' },
    { id: 'trash', name: 'Trash', icon: Trash2, type: 'link' },
  ],
  View: DocsApp,
};
