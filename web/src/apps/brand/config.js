import { Droplets, LayoutDashboard, Palette, Pencil, Shapes } from 'lucide-react';
import { BrandApp } from './BrandApp';

/**
 * Edu.HubBrand — product brand guidelines.
 * Shell nav stays; main column aims for brand-site rhythm (Hulu-like scroll pages).
 * AppGuide stays the system/UI reference (includes Logo Test / Color Test).
 */
export const brandApp = {
  id: 'brand',
  name: 'HubBrand',
  themeKey: 'HubBrand',
  defaultView: 'Overview',
  about: {
    description:
      'HubBrand holds Edu.Hub product brand guidelines — logo, illustration, and identity. Webpage feel inside the app shell; use AppGuide for UI system tokens.',
    features: [
      'Art style — playful line + shape building blocks',
      'Logo marks and glyph colors',
      'Color Test — workshop for theme roles / harmony (then Color Brand page)',
      'Color — interim Edu.ColorPalette spots until Brand page is simplified',
      'Brand do’s and don’ts (coming next)',
    ],
  },
  nav: [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, type: 'link' },
    { id: 'logo', name: 'Logo', icon: Shapes, type: 'link' },
    { id: 'color', name: 'Color', icon: Palette, type: 'link' },
    { id: 'color-test', name: 'Color Test', icon: Droplets, type: 'link' },
    { id: 'art-style', name: 'Art Style', icon: Pencil, type: 'link' },
  ],
  View: BrandApp,
};
