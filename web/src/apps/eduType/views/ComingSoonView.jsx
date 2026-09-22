import {
  APP_BOARD_PAD,
  APP_STATIC_BOARD,
  APP_STAGE_PAD,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { EmptyState } from '../../../shared/EmptyState';

export function ComingSoonView({ theme, isDarkMode, title, message }) {
  return (
    <div
      className={`flex h-full min-h-0 w-full flex-col ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface} ${APP_BOARD_PAD} pb-0`}>{title}</h2>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <EmptyState isDarkMode={isDarkMode} message={message} />
      </div>
    </div>
  );
}
