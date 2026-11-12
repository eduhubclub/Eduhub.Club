import { Bookmark, FileText, NotebookPen, Sparkles, Layers } from 'lucide-react';
import { WritingBuddyApp } from './WritingBuddyApp';

/**
 * Writing Buddy — guided K–5 writing process (non-AI step engine).
 */
export const writingBuddyApp = {
  id: 'writingBuddy',
  name: 'Writing Buddy',
  themeKey: 'WritingBuddy',
  // Teacher sidebar label; students still see “Write” via student app parts.
  defaultView: 'Student View',
  about: {
    description:
      'A friendly buddy guides students through writing piece by piece — sentence, paragraph, or essay — with revise checks between steps. Teachers create buddy characters and assign writing templates separately.',
    features: [
      'Onboarding for topic, genre, and length',
      'Essay-first workflows built from paragraph pieces',
      'Edit gates with spelling help (no AI required)',
      'Buddy characters kids can pick',
      'Curriculum templates (Arts & Letters Anatomy of an Essay) plus custom templates, assignable by class',
      'Saved drafts per class and student',
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
      teacherOnly: true,
    },
    { id: 'write', name: 'Student View', icon: NotebookPen, type: 'link' },
    {
      id: 'buddies',
      name: 'Buddies',
      icon: Sparkles,
      type: 'link',
      teacherOnly: true,
    },
    {
      id: 'templates',
      name: 'Templates',
      icon: FileText,
      type: 'link',
      teacherOnly: true,
    },
    {
      id: 'saved',
      name: 'Saved',
      icon: Bookmark,
      type: 'link',
      teacherOnly: true,
    },
  ],
  View: WritingBuddyApp,
};
