import {
  ClipboardList,
  Layers,
  Library,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { StoreApp } from './StoreApp';

/**
 * Edu.Store — class rewards catalog & storefront.
 * Redeems into Bank and/or Behavior when connected in Settings.
 */
export const storeApp = {
  id: 'store',
  name: 'Store',
  themeKey: 'Store',
  defaultView: 'Storefront',
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
    { id: 'storefront', name: 'Storefront', icon: ShoppingBag, type: 'link' },
    { id: 'catalog', name: 'Catalog', icon: Library, type: 'link' },
    { id: 'activity', name: 'Activity', icon: ClipboardList, type: 'link' },
    { id: 'community', name: 'Community', icon: Users, type: 'link' },
  ],
  View: StoreApp,
};
