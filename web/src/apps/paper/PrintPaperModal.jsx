import { useEffect, useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

/**
 * Chrome print dialog needs Margins: None and 100% scale for true inches.
 */
export function PrintPaperModal({ isOpen, onClose, theme, isDarkMode, onPrint }) {
  const [skipAgain, setSkipAgain] = useState(false);

  useEffect(() => {
    if (!isOpen) setSkipAgain(false);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      title="Print at exact size"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} onClick={() => onPrint?.(skipAgain)}>
            Print
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 p-5 sm:p-6">
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          In the print dialog, set <strong>Margins</strong> to <strong>None</strong> and
          scale to <strong>100%</strong> or <strong>Actual size</strong>. “Fit to
          printable area” shrinks the page, so inch spacing will not match a ruler.
        </p>
        <label className={`flex items-center gap-2.5 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          <input
            type="checkbox"
            className="edu-control h-4 w-4 rounded border-slate-300"
            checked={skipAgain}
            onChange={(e) => setSkipAgain(e.target.checked)}
          />
          Don't show this again
        </label>
      </div>
    </Modal>
  );
}
