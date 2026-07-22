import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { SHELL_PADDING_PX } from './layout';

/**
 * Shared Mobile / Tablet / Desktop frames for Design Guide live previews.
 * Aspect ratios approximate real devices so spacing demos read accurately.
 *
 * - Mobile: portrait phone (~9∶19)
 * - Tablet: portrait tablet (~3∶4)
 * - Desktop: widescreen (~16∶9)
 */

/** @typedef {'mobile' | 'tablet' | 'desktop'} PreviewBreakpoint */

/** @type {Record<PreviewBreakpoint, object>} */
export const PREVIEW_BREAKPOINTS = {
  mobile: {
    label: 'Mobile',
    Icon: Smartphone,
    /** Outer width constraint + centering */
    frame: 'w-[min(100%,220px)] mx-auto',
    /** Shell viewport ratio (width drives height) */
    shell: 'aspect-[9/19] h-auto',
    padPx: SHELL_PADDING_PX.base,
    padToken: 'p-4',
    bandH: 'h-4',
    bandW: 'w-4',
    cardPad: 'p-3',
    nestedPad: 'p-3',
    grid: 'grid-cols-1',
    title: 'text-xs',
    body: 'text-[11px]',
    showSidebar: false,
    note: 'Portrait phone · drawer nav',
  },
  tablet: {
    label: 'Tablet',
    Icon: Tablet,
    frame: 'w-[min(100%,360px)] mx-auto',
    shell: 'aspect-[3/4] h-auto',
    padPx: SHELL_PADDING_PX.base,
    padToken: 'p-4',
    bandH: 'h-4',
    bandW: 'w-4',
    cardPad: 'p-4',
    nestedPad: 'p-3',
    grid: 'grid-cols-2',
    title: 'text-sm',
    body: 'text-xs',
    showSidebar: true,
    sidebarCollapsed: true,
    note: 'Portrait tablet · collapsed rail',
  },
  desktop: {
    label: 'Desktop',
    Icon: Monitor,
    frame: 'w-full',
    shell: 'aspect-video h-auto',
    padPx: SHELL_PADDING_PX.lg,
    padToken: 'lg:p-6',
    bandH: 'h-6',
    bandW: 'w-6',
    cardPad: 'p-5',
    nestedPad: 'p-4',
    grid: 'grid-cols-2',
    title: 'text-sm',
    body: 'text-sm',
    showSidebar: true,
    sidebarCollapsed: false,
    note: '16∶9 · open sidebar',
  },
};
