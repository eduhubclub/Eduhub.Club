import { Users } from 'lucide-react';
import { StudentsApp } from './StudentsApp';

/**
 * Students app — shared student directory / profiles.
 * Will feed Classes and other apps with consistent student data.
 */
export const studentsApp = {
  id: 'students',
  name: 'Students',
  themeKey: 'Students',
  defaultView: 'Students',
  nav: [
    { id: 'students', name: 'Students', icon: Users, type: 'link' },
  ],
  View: StudentsApp,
};
