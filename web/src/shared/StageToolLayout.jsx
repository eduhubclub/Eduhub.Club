import { AppBoard } from './AppBoard';
import { ButtonRow } from './ButtonRow';

/**
 * Toolbar + height-locked static stage board.
 * Parent should wrap with `AppPageShell variant="stage"`.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.toolbar] — ButtonRow children
 * @param {'full' | 'md' | 'sm'} [props.boardSize='full']
 * @param {'board' | 'stage' | 'none'} [props.pad='stage']
 * @param {{ colorSurface?: string, colorOutline?: string }} props.theme
 * @param {string} [props.className]
 * @param {string} [props.boardClassName]
 * @param {import('react').ReactNode} props.children
 */
export function StageToolLayout({
  toolbar = null,
  boardSize = 'full',
  pad = 'stage',
  theme,
  className = '',
  boardClassName = '',
  children,
}) {
  return (
    <div className={`flex h-full min-h-0 flex-col gap-3 ${className}`.trim()}>
      {toolbar ? <ButtonRow>{toolbar}</ButtonRow> : null}
      <AppBoard
        mode="static"
        size={boardSize}
        pad={pad}
        theme={theme}
        className={`flex-1 min-h-0 ${boardClassName}`.trim()}
      >
        {children}
      </AppBoard>
    </div>
  );
}
