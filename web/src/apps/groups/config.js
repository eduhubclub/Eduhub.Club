import { Archive, Layers, Save, UserPlus, Users } from 'lucide-react';
import { GroupsApp } from './GroupsApp';

/**
 * Edu.Groups — sort / build / save student groups with pairing preferences.
 * Reads shared Classes data; does not own student records.
 */
export const groupsApp = {
  id: 'groups',
  name: 'Groups',
  themeKey: 'Groups',
  defaultView: 'Group Generator',
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
    { id: 'group-generator', name: 'Group Generator', icon: Users, type: 'link' },
    { id: 'create-groups', name: 'Create Groups', icon: Layers, type: 'link' },
    { id: 'pairing', name: 'Pairings', icon: UserPlus, type: 'link' },
    { id: 'saved-groups', name: 'Saved Groups', icon: Save, type: 'link' },
    { id: 'archive', name: 'Archive', icon: Archive, type: 'link' },
  ],
  View: GroupsApp,
};
