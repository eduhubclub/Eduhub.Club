import { createContext, useContext } from 'react';
import { GripVertical } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { pinTextStyle } from '../pinTextStyle';

/** @type {import('react').Context<null | { pinId: string, label: string, isDropTarget?: boolean }>} */
export const BoardDragContext = createContext(null);

export const MM_PIN_DRAG_TYPE = 'text/mm-pin-id';

/**
 * Shared chrome for Morning Meeting widget cards — fills the pin cell.
 * Body does not scroll: the board grows pins to content mins so everything stays visible.
 *
 * @param {{ compact?: boolean, pin?: { textSize?: string, font?: string } }} [props]
 */
export function WidgetShell({
  theme,
  title,
  icon: Icon,
  children,
  action = null,
  compact = false,
  pin = null,
}) {
  const drag = useContext(BoardDragContext);
  const dropHighlight = drag?.isDropTarget
    ? 'ring-2 ring-inset ring-orange-400'
    : '';
  const textStyle = pinTextStyle(pin?.textSize, pin?.font);

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${APP_GRID_CARD} ${
        compact ? 'p-2' : 'p-3 sm:p-4'
      } ${theme.colorSurface} ${theme.colorOutline} ${dropHighlight}`}
      style={Object.keys(textStyle).length ? textStyle : undefined}
    >
      <div
        className={`flex items-center gap-1.5 shrink-0 min-w-0 ${
          compact ? 'mb-1' : 'mb-2 gap-2'
        }`}
      >
        {Icon ? (
          <span
            className={`inline-flex rounded-lg shrink-0 ${
              compact ? 'p-1' : 'p-1.5'
            } ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <Icon size={compact ? 12 : 14} />
          </span>
        ) : null}
        <p className={`${TYPE.labelLg} truncate flex-1 min-w-0 ${theme.colorOnSurface}`}>{title}</p>
        {action ? <div className="shrink-0">{action}</div> : null}
        {drag ? (
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(MM_PIN_DRAG_TYPE, drag.pinId);
              e.dataTransfer.effectAllowed = 'move';
              try {
                e.dataTransfer.setData('text/plain', drag.pinId);
              } catch {
                /* ignore */
              }
            }}
            className={`edu-control cursor-grab active:cursor-grabbing rounded-lg p-1 shrink-0 ${theme.colorOnSurfaceVariant}`}
            title="Drag to move"
            aria-label={`Move ${drag.label || title}`}
          >
            <GripVertical size={compact ? 14 : 16} />
          </button>
        ) : null}
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
