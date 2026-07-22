import { useState } from 'react';
import { LocalClockCard } from '../components/LocalClockCard';
import { APP_BOARD_MAX_WIDTH } from '../../../shared/layout';

export function LocalTimeView({ isDarkMode, theme }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="flex justify-center flex-1 pt-4 sm:pt-8">
      <div className={`w-full ${APP_BOARD_MAX_WIDTH}`}>
        <LocalClockCard
          isDarkMode={isDarkMode}
          theme={theme}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      </div>
    </div>
  );
}
