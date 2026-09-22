import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  ACCURACY_MODES,
  EDU_TYPE_SETTINGS_EVENT,
  readAccuracyMode,
  writeAccuracyMode,
} from '../../data/eduType/settings';

/**
 * Edu.Type options on the shell Settings page.
 */
export function EduTypeSettingsCards({ theme, isDarkMode, Card }) {
  const [accuracyMode, setAccuracyMode] = useState(readAccuracyMode);

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail?.accuracyMode) setAccuracyMode(e.detail.accuracyMode);
      else setAccuracyMode(readAccuracyMode());
    };
    window.addEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(EDU_TYPE_SETTINGS_EVENT, onChange);
  }, []);

  const active = ACCURACY_MODES.find((m) => m.id === accuracyMode) || ACCURACY_MODES[0];

  return (
    <Card
      title="Accuracy"
      description="Choose how Edu.Type measures accuracy in the live stats and session history."
      isDarkMode={isDarkMode}
    >
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-wrap gap-2">
          {ACCURACY_MODES.map((mode) => {
            const on = accuracyMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAccuracyMode(writeAccuracyMode(mode.id))}
                className={`edu-control min-w-[7rem] h-11 px-3 rounded-xl ${TYPE.labelLg} border-[1.5px] transition-all ${
                  on
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
        <p
          className={`${TYPE.bodySm} mt-3 ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {active.description}
        </p>
      </div>
    </Card>
  );
}
