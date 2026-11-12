import { Archive, Bookmark, Building2, CalendarDays, Layers, PenLine, Plus, Users } from 'lucide-react';
import { TestsApp } from './TestsApp';

/**
 * Tests — teachers and admins author assessments. Students take them one item at a time.
 */
export const testsApp = {
  id: 'tests',
  name: 'Assessments',
  themeKey: 'Tests',
  defaultView: 'Saved Assessments',
  about: {
    description:
      'Create a short test, assign it to a class, and let students answer one question at a time on a small screen.',
    features: [
      'Choose one, number, and short writing',
      'Self-paced player with read-aloud',
      'Formative tests stay out of the compiled subject grade',
      'Scores land in Grades',
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
    { id: 'district', name: 'District', icon: Building2, type: 'link', teacherOnly: true },
    {
      id: 'create',
      name: 'Create Assessments',
      icon: Plus,
      type: 'panel',
      panelTitle: 'Assessment',
      panelSource: 'assessment-draft',
      panelContent: [{ id: 'details', label: 'Title & scoring', desc: 'Start' }],
      teacherOnly: true,
    },
    { id: 'saved', name: 'Saved Assessments', icon: Bookmark, type: 'link', teacherOnly: true },
    {
      id: 'calendar',
      name: 'Assessment Calendar',
      icon: CalendarDays,
      type: 'link',
      teacherOnly: true,
    },
    { id: 'archived', name: 'Archived Assessments', icon: Archive, type: 'link', teacherOnly: true },
    { id: 'community', name: 'Community Assessments', icon: Users, type: 'link', teacherOnly: true },
    { id: 'student', name: 'Student view', icon: PenLine, type: 'link' },
  ],
  View: TestsApp,
};
