import {
  APP_BOARD_PAD,
  APP_GRID_CARD,
  APP_MULTI_BOARD,
  APP_MULTI_BOARD_FULL,
  APP_SCROLL_BOARD,
  APP_STAGE_PAD,
  APP_STATIC_BOARD,
  APP_STATIC_BOARD_MD,
  APP_STATIC_BOARD_SM,
} from './layout';

/** @typedef {'static' | 'scroll' | 'multi' | 'grid'} AppBoardMode */
/** @typedef {'full' | 'md' | 'sm'} AppBoardSize */
/** @typedef {'board' | 'stage' | 'none'} AppBoardPad */

const STATIC_BY_SIZE = {
  full: APP_STATIC_BOARD,
  md: APP_STATIC_BOARD_MD,
  sm: APP_STATIC_BOARD_SM,
};

const PAD_CLASS = {
  board: APP_BOARD_PAD,
  stage: APP_STAGE_PAD,
  none: '',
};

/**
 * Shared board / card surface — chrome + pad + theme surface/outline.
 * Prefer this over copying APP_*_BOARD + pad + theme class stacks.
 *
 * @param {object} props
 * @param {AppBoardMode} [props.mode='static']
 * @param {AppBoardSize} [props.size='full'] — static boards only
 * @param {AppBoardPad} [props.pad='board']
 * @param {boolean} [props.fullHeight] — multi-board viewport-tall section
 * @param {{ colorSurface?: string, colorOutline?: string }} props.theme
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function AppBoard({
  mode = 'static',
  size = 'full',
  pad = 'board',
  fullHeight = false,
  theme,
  className = '',
  children,
  ...props
}) {
  let boardClass;
  if (mode === 'scroll') {
    boardClass = APP_SCROLL_BOARD;
  } else if (mode === 'multi') {
    boardClass = `${APP_MULTI_BOARD}${fullHeight ? ` ${APP_MULTI_BOARD_FULL}` : ''}`;
  } else if (mode === 'grid') {
    boardClass = APP_GRID_CARD;
  } else {
    boardClass = STATIC_BY_SIZE[size] || APP_STATIC_BOARD;
  }

  const padClass = PAD_CLASS[pad] || '';
  const surface = theme
    ? `${theme.colorSurface || ''} ${theme.colorOutline || ''}`.trim()
    : '';

  return (
    <div
      className={`${boardClass} ${padClass} ${surface} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
