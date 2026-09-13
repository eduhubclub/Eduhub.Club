import { BoardView } from './views/BoardView';
import { EditBoardView } from './views/EditBoardView';
import { LayoutLabView } from './views/LayoutLabView';

/**
 * Edu.MorningMeeting — classroom walk-in board.
 */
export function MorningMeetingApp({ activeTab, isDarkMode, theme, onOpenApp }) {
  if (activeTab === 'Edit board') {
    return <EditBoardView isDarkMode={isDarkMode} theme={theme} />;
  }
  if (activeTab === 'Layout lab') {
    return <LayoutLabView isDarkMode={isDarkMode} theme={theme} />;
  }

  return (
    <BoardView isDarkMode={isDarkMode} theme={theme} onOpenApp={onOpenApp} />
  );
}
