import { AppBoard } from './AppBoard';
import { APP_BOARD_BODY_SCROLL } from './layout';

/**
 * Static board with a fixed header band and scrolling body.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.header]
 * @param {'full' | 'md' | 'sm'} [props.size='full']
 * @param {'board' | 'stage' | 'none'} [props.pad='board'] — applied to body
 * @param {{ colorSurface?: string, colorOutline?: string, colorOutlineVariant?: string }} props.theme
 * @param {boolean} [props.isDarkMode]
 * @param {string} [props.className]
 * @param {string} [props.bodyClassName]
 * @param {import('react').ReactNode} props.children
 */
export function InternalScrollBoard({
  header = null,
  size = 'full',
  pad = 'board',
  theme,
  isDarkMode = false,
  className = '',
  bodyClassName = '',
  children,
}) {
  const headerBorder = theme?.colorOutlineVariant || theme?.colorOutline || '';
  const headerMuted = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <AppBoard
      mode="static"
      size={size}
      pad="none"
      theme={theme}
      className={className}
    >
      {header ? (
        <div
          className={`shrink-0 border-b-[1.5px] px-5 py-3 sm:px-6 ${headerBorder || headerMuted}`}
        >
          {header}
        </div>
      ) : null}
      <div
        className={`${APP_BOARD_BODY_SCROLL} ${
          pad === 'board'
            ? 'p-5 sm:p-6'
            : pad === 'stage'
              ? 'p-3 sm:p-5'
              : ''
        } ${bodyClassName}`.trim()}
      >
        {children}
      </div>
    </AppBoard>
  );
}
