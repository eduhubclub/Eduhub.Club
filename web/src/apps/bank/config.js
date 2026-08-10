import {
  ArrowLeftRight,
  Landmark,
  Layers,
  LayoutDashboard,
  Library,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { BankApp } from './BankApp';

/**
 * Edu.Bank — classroom economy (balances, transactions, payday).
 * Store nav is filtered in AppShell when Edu.Store → Connect to Bank is off.
 */
export const bankApp = {
  id: 'bank',
  name: 'Bank',
  themeKey: 'Bank',
  defaultView: 'Dashboard',
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
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, type: 'link' },
    { id: 'bank', name: 'Bank', icon: Landmark, type: 'link' },
    {
      id: 'transactions',
      name: 'Transactions',
      icon: ArrowLeftRight,
      type: 'link',
    },
    { id: 'trends', name: 'Trends', icon: TrendingUp, type: 'link' },
    { id: 'store', name: 'Store', icon: ShoppingBag, type: 'link' },
    { id: 'learning', name: 'Learning', icon: Library, type: 'link' },
  ],
  View: BankApp,
};
