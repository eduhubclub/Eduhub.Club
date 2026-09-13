import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  LIBRARY_SETTINGS_UPDATED_EVENT,
  readLibrarySettings,
  writeLibrarySettings,
} from '../../data/library/settings';
import { readCopies, readTitles } from '../../data/library/storage';

/**
 * Library controls on the shell Settings page.
 */
export function LibrarySettingsCards({ theme, isDarkMode, Card }) {
  const [settings, setSettings] = useState(readLibrarySettings);
  const titleCount = readTitles().length;
  const copyCount = readCopies().length;

  useEffect(() => {
    const onChange = (e) => {
      setSettings(e?.detail?.settings || readLibrarySettings());
    };
    window.addEventListener(LIBRARY_SETTINGS_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(LIBRARY_SETTINGS_UPDATED_EVENT, onChange);
  }, []);

  const patch = (partial) => setSettings(writeLibrarySettings(partial));

  const fieldClass = `edu-control w-24 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <>
      <Card
        title="Checkout rules"
        description="Loan length and how many books a student may have out at once."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
          <label className="flex items-center justify-between gap-4">
            <span className="min-w-0">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Loan length (days)</p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                Default due date when a book is checked out.
              </p>
            </span>
            <input
              type="number"
              min={1}
              max={90}
              className={fieldClass}
              value={settings.loanDays}
              onChange={(e) => patch({ loanDays: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="min-w-0">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Max books per student</p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                Use 0 for no limit.
              </p>
            </span>
            <input
              type="number"
              min={0}
              max={50}
              className={fieldClass}
              value={settings.maxBooks}
              onChange={(e) => patch({ maxBooks: Number(e.target.value) })}
            />
          </label>
        </div>
      </Card>

      <Card
        title="Student self-checkout"
        description="Let students check books out with their class PIN after identifying themselves."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pr-2">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Allow self-checkout</p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                {settings.studentSelfCheckout
                  ? 'On — Circulation can run in student mode with a PIN.'
                  : 'Off — only the teacher checks books out.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.studentSelfCheckout}
              aria-label="Allow self-checkout"
              onClick={() =>
                patch({ studentSelfCheckout: !settings.studentSelfCheckout })
              }
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                settings.studentSelfCheckout
                  ? theme.colorPrimary
                  : isDarkMode
                    ? 'bg-slate-700'
                    : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.studentSelfCheckout ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className={`${TYPE.bodySm} mt-4 ${theme.colorOnSurfaceVariant}`}>
            This library has {titleCount} title{titleCount === 1 ? '' : 's'} and {copyCount}{' '}
            cop{copyCount === 1 ? 'y' : 'ies'} on this device.
          </p>
        </div>
      </Card>
    </>
  );
}
