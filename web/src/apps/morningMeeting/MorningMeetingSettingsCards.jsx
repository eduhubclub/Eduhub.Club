import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  CHECK_IN_CARD_STYLES,
  MORNING_MEETING_PREFS_EVENT,
  readCheckInCardStyle,
  writeCheckInCardStyle,
} from './checkInPrefs';

/**
 * Morning Meeting prefs on the shell Settings page.
 */
export function MorningMeetingSettingsCards({ theme, isDarkMode, Card }) {
  const [styleId, setStyleId] = useState(readCheckInCardStyle);

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail?.checkInCardStyle) setStyleId(e.detail.checkInCardStyle);
      else setStyleId(readCheckInCardStyle());
    };
    window.addEventListener(MORNING_MEETING_PREFS_EVENT, onChange);
    return () => window.removeEventListener(MORNING_MEETING_PREFS_EVENT, onChange);
  }, []);

  return (
    <Card
      title="Check-in cards"
      description="How student tiles look on the Morning Meeting check-in board."
      isDarkMode={isDarkMode}
    >
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-wrap gap-2">
          {CHECK_IN_CARD_STYLES.map((style) => {
            const active = styleId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyleId(writeCheckInCardStyle(style.id))}
                className={`edu-control min-w-[3.5rem] h-11 px-3 rounded-xl ${TYPE.labelLg} border-[1.5px] transition-all ${
                  active
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
        <p
          className={`${TYPE.bodySm} mt-3 ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {CHECK_IN_CARD_STYLES.find((style) => style.id === styleId)?.description}
        </p>
      </div>
    </Card>
  );
}
