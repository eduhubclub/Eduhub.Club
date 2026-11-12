import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  readAllowCustomBuddyPhotos,
  writeAllowCustomBuddyPhotos,
  WRITING_BUDDY_SETTINGS_EVENT,
} from '../../data/writingBuddy/settings';

/**
 * Writing Buddy prefs for the shell Settings page.
 */
export function WritingBuddySettingsCards({ theme, isDarkMode, Card }) {
  const [allowPhotos, setAllowPhotos] = useState(readAllowCustomBuddyPhotos);

  useEffect(() => {
    const onChange = (e) => {
      if (typeof e?.detail?.allowCustomBuddyPhotos === 'boolean') {
        setAllowPhotos(e.detail.allowCustomBuddyPhotos);
      } else {
        setAllowPhotos(readAllowCustomBuddyPhotos());
      }
    };
    window.addEventListener(WRITING_BUDDY_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(WRITING_BUDDY_SETTINGS_EVENT, onChange);
  }, []);

  return (
    <Card
      title="Custom buddy photos"
      description="Let students upload a photo, paste an image link, or take a picture for their own buddy. Preset buddies stay available either way."
      isDarkMode={isDarkMode}
    >
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 pr-2">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Allow custom photos
            </p>
            <p
              className={`${TYPE.bodySm} mt-1 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Turn off if you only want the built-in buddies (and teacher-made
              buddy characters) in Student View.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowPhotos}
            onClick={() => setAllowPhotos(writeAllowCustomBuddyPhotos(!allowPhotos))}
            className={`edu-control relative h-8 w-14 shrink-0 rounded-full border-[1.5px] transition-colors ${
              allowPhotos
                ? `${theme.colorPrimary} border-transparent`
                : `${theme.colorSurface} ${theme.colorOutline}`
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                allowPhotos ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  );
}
