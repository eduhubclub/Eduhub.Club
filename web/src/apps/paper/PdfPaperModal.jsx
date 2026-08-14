import { useEffect, useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';
import { PAPER_SIZES } from '../../data/paper/paperModel';

/**
 * Choose a page size before downloading the PDF.
 */
export function PdfPaperModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  defaultPageSize = 'letter',
  onDownload,
}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => {
    if (!isOpen) return;
    setPageSize(defaultPageSize);
  }, [isOpen, defaultPageSize]);

  const submit = () => {
    onDownload?.(pageSize);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Save PDF"
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
          <ModalPrimaryButton theme={theme} onClick={submit}>
            Download PDF
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 p-5 sm:p-6">
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          Choose the paper size for this PDF. Ruling and margins stay in inches on
          the page you pick.
        </p>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Paper size"
        >
          {PAPER_SIZES.map((size) => {
            const on = pageSize === size.id;
            return (
              <button
                key={size.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-3 text-left ${
                  on
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
                onClick={() => setPageSize(size.id)}
              >
                <span className={`block ${TYPE.labelLg}`}>{size.label}</span>
                <span
                  className={`mt-0.5 block ${TYPE.bodySm} ${
                    on ? 'opacity-90' : theme.colorOnSurfaceVariant
                  }`}
                >
                  {size.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
