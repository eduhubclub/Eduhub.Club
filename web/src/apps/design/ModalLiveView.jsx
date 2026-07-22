import { useState } from 'react';
import { Settings2, Save } from 'lucide-react';
import {
  APP_BOARD_PAD,
  APP_MAX_WIDTH,
  APP_PAGE_BOTTOM,
  APP_SCROLL_BOARD,
} from '../../shared/layout';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

/**
 * Edu.Design — live Modal chrome (overlay, primary header, footer actions).
 * Separate from Cards — modals are dialog chrome, not board/grid surfaces.
 */
export function ModalLiveView({ isDarkMode, theme }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [tempOn, setTempOn] = useState(true);
  const [committedOn, setCommittedOn] = useState(true);

  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const muted = theme.colorOnSurfaceVariant;
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const cancelClass = `px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${muted} ${theme.hoverBg}`;

  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
      <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
        <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Modal</p>
        <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
          shared/Modal · shared/ModalPrimaryButton
        </p>
        <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
          Portaled overlay with a primary-colored header, scrollable body, and footer actions.
          Not a card — use boards/grid under Cards.
        </p>

        <ul className={`mt-4 space-y-1.5 list-disc pl-5 ${TYPE.bodySm} ${muted}`}>
          <li>
            Header: <code className="font-mono">theme.colorPrimary</code> + on-primary title/close
          </li>
          <li>
            Body scrolls inside <code className="font-mono">max-h-[90vh]</code>
          </li>
          <li>
            Footer: Cancel text + <code className="font-mono">ModalPrimaryButton</code>
          </li>
          <li>Settings pattern: temp state while open → Apply commits, Cancel discards</li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-2 h-10 px-4 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => {
              setTempOn(committedOn);
              setSettingsOpen(true);
            }}
          >
            <Settings2 size={16} strokeWidth={2.5} />
            Open settings
          </button>
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-2 h-10 px-4 rounded-xl ${TYPE.labelLg} border ${theme.colorOutline} ${theme.colorOnSurface} ${theme.hoverBg}`}
            onClick={() => setSaveOpen(true)}
          >
            <Save size={16} strokeWidth={2.5} />
            Open choice modal
          </button>
        </div>
      </div>

      <Modal
        isOpen={settingsOpen}
        title="Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setSettingsOpen(false)}
        maxWidth="max-w-sm"
        footer={
          <>
            <button type="button" onClick={() => setSettingsOpen(false)} className={cancelClass}>
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              onClick={() => {
                setCommittedOn(tempOn);
                setSettingsOpen(false);
              }}
            >
              Apply Changes
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6">
          <label
            className={`flex items-center justify-between gap-4 cursor-pointer ${TYPE.bodyMd} ${theme.colorOnSurface}`}
          >
            <span>Demo switch</span>
            <button
              type="button"
              role="switch"
              aria-checked={tempOn}
              onClick={() => setTempOn((v) => !v)}
              className={`edu-control relative w-11 h-6 rounded-full transition-colors ${
                tempOn ? theme.colorPrimary : isDarkMode ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  tempOn ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>
          <p className={`${TYPE.bodySm} mt-3 ${muted}`}>
            Edits stay temporary until Apply. Cancel restores the committed value.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={saveOpen}
        title="Save Whiteboard"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setSaveOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSaveOpen(false)} className={cancelClass}>
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={() => setSaveOpen(false)}>
              Continue
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-5 sm:p-6 space-y-2">
          <p className={`${TYPE.bodyMd} ${body}`}>
            Choice / confirm modals use the same shell — primary header, body choices, footer
            primary.
          </p>
          <p className={`${TYPE.bodySm} font-mono ${muted}`}>max-w-lg default · z-[200]</p>
        </div>
      </Modal>
    </div>
  );
}
