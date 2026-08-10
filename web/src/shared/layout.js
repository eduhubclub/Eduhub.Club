/**
 * Canonical layout tokens for Edu.Hub shell and app content.
 * Import these instead of copying class strings across apps.
 *
 * Card types (top-level):
 * 1. Static board — fills the content area (up to APP_MAX_WIDTH), fits the viewport (no scroll)
 * 2. Static medium / small — same height lock + chrome; narrower max-width, centered in the shell
 * 3. Scrolling board — same chrome/width as full static; height follows content. If it stretches past
 *    the bottom of the screen, the regular scrollbar appears (nothing special beyond that).
 * 4. Internal scroll — static board (viewport-locked) whose body scrolls under a header, and/or
 *    horizontally for wide content (tables). Pair APP_STATIC_BOARD + APP_BOARD_BODY_SCROLL.
 * 5. Multi board scroll — boards stacked vertically (full static and/or content-sized); AppShell scrolls
 * 6. Grid card — content-sized cards in a dynamic grid (ask for min cards per row when building)
 *
 * Nested helpers: APP_NESTED_CARD, APP_EMPTY_SLOT (live inside a board, not top-level types)
 *
 * Inner padding:
 * - APP_BOARD_PAD — default board content (`p-5 sm:p-6`)
 * - APP_STAGE_PAD — dense stage tools (`p-3 sm:p-5`)
 */

/** AppShell `<main>` edge padding — 16px base, 24px on lg+ (standard web spacing). */
export const SHELL_MAIN_PADDING = 'p-4 lg:p-6';

/** Bottom footer strip in the main column (matches sidebar utility footer height). */
export const APP_SHELL_FOOTER_CHROME = 'shrink-0 p-2 border-t-[0.5px]';

/** Pixel values for docs / previews (match Tailwind p-4 and p-6). */
export const SHELL_PADDING_PX = { base: 16, lg: 24 };

/** Max content width for every mini-app view (page shell). */
export const APP_MAX_WIDTH = 'max-w-7xl';

/** Shared board / grid-card chrome — 1.5px border, no shadow. */
export const APP_BOARD_CHROME = 'rounded-2xl border-[1.5px]';

/**
 * Default inner padding for boards (Design demos, scrolling boards, roomy stage content).
 * 20px base → 24px from `sm`. Pair inside the board, not on AppPageShell.
 */
export const APP_BOARD_PAD = 'p-5 sm:p-6';

/** Pixel values for docs / previews (match APP_BOARD_PAD). */
export const APP_BOARD_PAD_PX = { base: 20, sm: 24 };

/**
 * Recommended inner padding for dense stage tools (letter grids, keyboards, mats).
 * Tighter than APP_BOARD_PAD so interactive chrome keeps vertical room.
 * 12px base → 20px from `sm`.
 */
export const APP_STAGE_PAD = 'p-3 sm:p-5';

/** Pixel values for docs / previews (match APP_STAGE_PAD). */
export const APP_STAGE_PAD_PX = { base: 12, sm: 20 };
/**
 * Max width for full Static and Scrolling boards — same as the page shell so boards
 * grow with available horizontal space (e.g. when the sidebar collapses).
 * Pair with `w-full mx-auto`. Cap is XL only (`max-w-7xl`).
 */
export const APP_BOARD_MAX_WIDTH = APP_MAX_WIDTH;

/**
 * Centered medium stage board width — focused widgets that look stretched at full shell width
 * (pick-a-number, coin toss, random method, etc.). Tailwind `max-w-2xl` (42rem).
 */
export const APP_BOARD_MAX_WIDTH_MD = 'max-w-2xl';

/**
 * Centered small stage board width — compact single-focus tools.
 * Tailwind `max-w-md` (28rem).
 */
export const APP_BOARD_MAX_WIDTH_SM = 'max-w-md';

/** @deprecated Use APP_BOARD_MAX_WIDTH */
export const APP_STAGE_CARD_MAX_WIDTH = APP_BOARD_MAX_WIDTH;

/**
 * Max height for a focused stage card on a standard 13.3″ laptop content area.
 * Fills available height up to this cap; centers when the shell is taller (large monitors).
 * Pair with `h-full min-h-0 … mx-auto my-auto`.
 */
export const APP_STAGE_CARD_MAX_HEIGHT = 'max-h-[min(100%,40.625rem)]'; // 650px

/** Bottom clearance when a shell FAB sits over scrollable content. */
export const APP_SCROLL_BOTTOM = 'pb-24';

/** Bottom spacing for static pages (settings, design guide, empty states). */
export const APP_PAGE_BOTTOM = 'pb-10';

/**
 * Static-board shell — fill-height tools where the board fits the viewport.
 * Locks height; AppShell content area does not scroll. Pair with APP_STATIC_BOARD.
 */
export const APP_STAGE_SHELL = `relative h-full min-h-0 ${APP_MAX_WIDTH} flex flex-col overflow-hidden`;

/**
 * Scrolling shell — boards/grids that can grow past the viewport.
 * No overflow here — AppShell `<main>` owns the regular edge scrollbar.
 */
export const APP_SCROLL_SHELL = `relative ${APP_MAX_WIDTH} ${APP_SCROLL_BOTTOM}`;

/**
 * Informational page — settings, design guide, empty gates.
 * No overflow here — AppShell `<main>` owns the regular edge scrollbar.
 */
export const APP_PAGE_SHELL = `relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`;

/**
 * Static board — single surface that fills the content area.
 * Same chrome as scrolling boards; height-locked; shell does not scroll.
 * Pair with AppPageShell variant="stage".
 */
export const APP_STATIC_BOARD = `${APP_BOARD_CHROME} w-full ${APP_BOARD_MAX_WIDTH} mx-auto h-full min-h-0 flex flex-col overflow-hidden`;

/**
 * Static medium — same as static board, narrower centered width (`APP_BOARD_MAX_WIDTH_MD`).
 * Use when a full-bleed board stretches the interaction awkwardly.
 */
export const APP_STATIC_BOARD_MD = `${APP_BOARD_CHROME} w-full ${APP_BOARD_MAX_WIDTH_MD} mx-auto h-full min-h-0 flex flex-col overflow-hidden`;

/**
 * Static small — same as static board, compact centered width (`APP_BOARD_MAX_WIDTH_SM`).
 */
export const APP_STATIC_BOARD_SM = `${APP_BOARD_CHROME} w-full ${APP_BOARD_MAX_WIDTH_SM} mx-auto h-full min-h-0 flex flex-col overflow-hidden`;

/**
 * Interior scroll pane inside a static board.
 * Board stays viewport-locked; this region scrolls vertically and/or horizontally
 * (tables under a sticky header). Place under a `shrink-0` header — not on AppShell.
 */
export const APP_BOARD_BODY_SCROLL = 'flex-1 min-h-0 overflow-auto';

/** @deprecated Use APP_STATIC_BOARD */
export const APP_STAGE_CARD = APP_STATIC_BOARD;

/**
 * Scrolling board — same chrome and max-width as a static board; height follows content.
 * If the board stretches past the bottom of the screen, the regular AppShell scrollbar
 * appears on the content edge (not on the card).
 */
export const APP_SCROLL_BOARD = `${APP_BOARD_CHROME} w-full ${APP_BOARD_MAX_WIDTH} mx-auto`;

/**
 * Multi-board scroll — boards stacked vertically; AppShell `<main>` scrolls between them.
 * Same chrome/width as other boards. Height is per board: content-sized by default, or
 * add APP_MULTI_BOARD_FULL for a static/viewport-tall section.
 * Pair with APP_SCROLL_SHELL + gap.
 */
export const APP_MULTI_BOARD = `${APP_BOARD_CHROME} w-full ${APP_BOARD_MAX_WIDTH} mx-auto flex flex-col overflow-hidden`;

/** Full content-viewport height for one section in a multi-board stack. */
export const APP_MULTI_BOARD_FULL =
  'h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-6.5rem)] min-h-0';

/**
 * Grid card — content-sized card in a dynamic grid (timers, clocks, groups).
 * When creating a grid-card app, ask what the minimum cards-per-row should be.
 * Always fill with theme.colorSurface + theme.colorOutline.
 */
export const APP_GRID_CARD = APP_BOARD_CHROME;

/**
 * @deprecated Prefer APP_GRID_CARD for grid items, or APP_SCROLL_BOARD / APP_STATIC_BOARD for boards.
 * Kept as an alias of APP_GRID_CARD for existing imports.
 */
export const APP_CONTENT_CARD = APP_GRID_CARD;

/**
 * Nested panel inside a board — options, slots, secondary panels.
 * Soft fill (slate-50 / slate-800) — not the outer white surface.
 * Same 1.5px border weight as boards; no shadow.
 */
export const APP_NESTED_CARD = 'rounded-xl border-[1.5px]';

/**
 * Empty dashed slot inside a board (waiting for a pick / FAB action).
 */
export const APP_EMPTY_SLOT = 'rounded-xl border-[1.5px] border-dashed';

/**
 * Horizontal edge for shell FABs / FAB stacks (opposite the sidebar).
 * Sidebar left → right edge; sidebar flipped → left edge.
 */
export function appFabEdgeClass(isLeft = true) {
  return isLeft ? 'right-5 sm:right-8' : 'left-5 sm:left-8';
}

/**
 * Primary FAB chrome without horizontal edge — use `appFabClass(isLeft)`.
 * `fixed` is contained by AppShell’s content column (`transform-gpu`), not the viewport.
 */
export const APP_FAB_BASE =
  'fixed bottom-5 sm:bottom-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0';

/**
 * Primary FAB in the app shell (bottom corner opposite the sidebar).
 * Contained in the AppShell content column; flips left/right with the sidebar.
 * Pair with theme.colorPrimary + theme.colorOnPrimary; icon size 24.
 */
export function appFabClass(isLeft = true) {
  return `${APP_FAB_BASE} ${appFabEdgeClass(isLeft)}`;
}

/**
 * Multi-button FAB stack chrome (Groups, etc.) — same shell edge rules as `appFabClass`.
 */
export function appFabStackClass(isLeft = true) {
  return `fixed bottom-5 sm:bottom-8 z-50 flex items-center gap-3 print:hidden ${appFabEdgeClass(isLeft)}`;
}

/**
 * @deprecated Prefer `appFabClass(isLeft)` so the FAB flips with the sidebar.
 * Defaults to sidebar-left (FAB on the right).
 */
export const APP_FAB = appFabClass(true);

/** @typedef {'stage' | 'scroll' | 'page'} AppShellVariant */

/** @type {Record<AppShellVariant, string>} */
export const APP_SHELL_VARIANTS = {
  stage: APP_STAGE_SHELL,
  scroll: APP_SCROLL_SHELL,
  page: APP_PAGE_SHELL,
};
