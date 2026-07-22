import {
  Home,
  LayoutGrid,
  BarChart2,
  Users,
  HelpCircle,
  Layers,
  Library,
  Inbox,
  Send,
  Archive,
  Trash2,
  Plus,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { HubApp } from './HubApp';

/**
 * Hub app definition.
 * Nav item `type` selects which nav behavior mounts:
 * - link | accordion | panel | popout
 * Apps that omit a type never load that behavior for their sidebar.
 */
export const hubApp = {
  id: 'hub',
  name: 'Hub',
  themeKey: 'Blue',
  defaultView: 'Dashboard',
  nav: [
    { id: 'dash', name: 'Dashboard', icon: Home, type: 'link' },
    { id: 'apps', name: 'Apps', icon: LayoutGrid, type: 'link' },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart2,
      type: 'accordion',
      subItems: ['Performance', 'Engagement', 'Retention'],
    },
    {
      id: 'resources',
      name: 'Resources',
      icon: Library,
      type: 'panel',
      panelTitle: 'Resources',
      panelContent: [
        { label: 'Inbox', icon: Inbox, desc: 'Access files' },
        { label: 'Sent', icon: Send, desc: 'Access files' },
        { label: 'Archived', icon: Archive, desc: 'Access files' },
        { label: 'Cloud Storage', icon: Layers, desc: 'Access files' },
        { label: 'Trash', icon: Trash2, desc: 'Access files' },
      ],
    },
    {
      id: 'district',
      name: 'District',
      icon: Users,
      type: 'popout',
      actions: [
        { name: 'Add Member', icon: Plus },
        { name: 'Edit Group', icon: Edit },
        { name: 'Export Data', icon: ExternalLink },
        { name: 'Delete', icon: Trash2, color: 'text-rose-500' },
      ],
    },
    { id: 'rooms', name: 'Classrooms', icon: Layers, type: 'link' },
    { id: 'help', name: 'Help Center', icon: HelpCircle, type: 'link' },
  ],
  View: HubApp,
};
