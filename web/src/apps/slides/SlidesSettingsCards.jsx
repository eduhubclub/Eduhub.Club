import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import { SLIDES_SETTINGS_UPDATED_EVENT } from '../../data/slides/types';
import { readDecks } from '../../data/slides/storage';
import { readSlidesSettings, writeSlidesSettings } from '../../data/slides/settings';

/**
 * Slides controls on the shell Settings page.
 */
export function SlidesSettingsCards({ theme, isDarkMode, Card }) {
  const [settings, setSettings] = useState(readSlidesSettings);
  const deckCount = readDecks().length;

  useEffect(() => {
    const onChange = (e) => {
      setSettings(e?.detail?.settings || readSlidesSettings());
    };
    window.addEventListener(SLIDES_SETTINGS_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(SLIDES_SETTINGS_UPDATED_EVENT, onChange);
  }, []);

  const patch = (partial) => setSettings(writeSlidesSettings(partial));
  const fieldClass = `edu-control w-full max-w-sm rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <>
      <Card
        title="Lesson decks"
        description="One library of decks for this teacher. Classes only choose who is following."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
          <label className="flex items-center justify-between gap-4">
            <span className="min-w-0">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Default aspect</p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                Classroom displays are 16:9. 4:3 is for older projectors.
              </p>
            </span>
            <select
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              value={settings.aspect}
              onChange={(e) => patch({ aspect: e.target.value })}
            >
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
            </select>
          </label>
          <ToggleRow
            theme={theme}
            isDarkMode={isDarkMode}
            label="Show join QR while presenting"
            description={
              settings.showJoinQr
                ? 'On — students can scan the code on the board.'
                : 'Off — join with the four-letter code only.'
            }
            checked={settings.showJoinQr}
            onToggle={() => patch({ showJoinQr: !settings.showJoinQr })}
          />
          <ToggleRow
            theme={theme}
            isDarkMode={isDarkMode}
            label="Speaker notes"
            description={
              settings.speakerNotes
                ? 'On — Present can open notes in a second window.'
                : 'Off — hide the notes control.'
            }
            checked={settings.speakerNotes}
            onToggle={() => patch({ speakerNotes: !settings.speakerNotes })}
          />
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {deckCount} deck{deckCount === 1 ? '' : 's'} on this device.
          </p>
        </div>
      </Card>

      <Card
        title="Google Slides"
        description="Optional. Paste a Google Cloud OAuth client ID to list and export decks from Drive. Official Google colors stay on the Google mark."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3">
          <label className="block">
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>OAuth client ID</span>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              className={`${fieldClass} mt-2`}
              placeholder="123456789-abc.apps.googleusercontent.com"
              value={settings.googleClientId}
              onChange={(e) => patch({ googleClientId: e.target.value })}
            />
          </label>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Without a client ID, Import still accepts a Google Slides download as PowerPoint or PDF.
          </p>
        </div>
      </Card>
    </>
  );
}

function ToggleRow({ theme, isDarkMode, label, description, checked, onToggle }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 pr-2">
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{label}</p>
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? theme.colorPrimary : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
