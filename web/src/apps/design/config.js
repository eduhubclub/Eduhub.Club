import {
  AppWindow,
  Box,
  CircleDot,
  Eye,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Navigation,
  NotebookPen,
  Palette,
  PanelTop,
  Sparkles,
  SquareStack,
  SwatchBook,
  Type,
} from 'lucide-react';
import { DesignApp } from './DesignApp';
import { CARD_EXAMPLE_VIEWS } from './cardExamples';
import { CARD_STYLE_VIEWS } from './cardStyles';
import { CARD_TYPE_VIEWS } from './cardTypes';

/**
 * Edu.Design — living style guide as a first-class mini-app.
 * Patterns and Cards open a double sidebar. Cards nests Card Types / Card Styles /
 * Card Examples as panel accordions — each leaf opens its own live page.
 * Modal is a separate live page (dialog chrome, not a card surface).
 * Live View is a canvas + floating component dock to compose pieces live.
 */
export const designApp = {
  id: 'design',
  name: 'AppGuide',
  themeKey: 'Design',
  defaultView: 'Overview',
  nav: [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, type: 'link' },
    { id: 'branding', name: 'Branding', icon: Palette, type: 'link' },
    { id: 'text', name: 'Text', icon: Type, type: 'link' },
    { id: 'buttons', name: 'Buttons', icon: CircleDot, type: 'link' },
    {
      id: 'patterns',
      name: 'Patterns',
      icon: LayoutTemplate,
      type: 'panel',
      panelTitle: 'Patterns',
      panelSource: 'design-patterns',
      panelContent: [
        {
          id: 'app-shell',
          label: 'App Shell',
          icon: Box,
          desc: 'Main inset padding — build live in the real shell',
        },
        {
          id: 'app-layout',
          label: 'App Layout',
          icon: AppWindow,
          desc: 'Header, toolbar, board, and circle FAB',
        },
      ],
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: SquareStack,
      type: 'panel',
      panelTitle: 'Cards',
      panelSource: 'design-cards',
      panelContent: [
        {
          id: 'card-types',
          label: 'Card Types',
          icon: SquareStack,
          desc: 'Layout chrome — boards, grid, nested, empty',
          subItems: CARD_TYPE_VIEWS,
        },
        {
          id: 'card-styles',
          label: 'Card Styles',
          icon: Layers,
          desc: 'M3 outlined/filled, hierarchy, and accessibility',
          subItems: CARD_STYLE_VIEWS,
        },
        {
          id: 'card-examples',
          label: 'Card Examples',
          icon: Sparkles,
          desc: 'Live product-shaped cards in the shell',
          subItems: CARD_EXAMPLE_VIEWS,
        },
      ],
    },
    { id: 'modal', name: 'Modal', icon: PanelTop, type: 'link' },
    { id: 'live-view', name: 'Live View', icon: Eye, type: 'link' },
    { id: 'navigation', name: 'Navigation', icon: Navigation, type: 'link' },
    { id: 'app', name: 'App', icon: AppWindow, type: 'link' },
    { id: 'colors', name: 'Colors', icon: SwatchBook, type: 'link' },
    { id: 'notes', name: 'Notes', icon: NotebookPen, type: 'link' },
  ],
  View: DesignApp,
};
