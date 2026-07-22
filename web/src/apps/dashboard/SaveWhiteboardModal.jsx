import { useEffect, useState } from 'react';
import { Download, Save } from 'lucide-react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

/**
 * Choose download current page vs save full whiteboard to the library.
 */
export function SaveWhiteboardModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  pageLabel = '1',
  defaultName = '',
  showLibraryOption = true,
  onDownloadPage,
  onSaveToLibrary,
}) {
  const [mode, setMode] = useState(showLibraryOption ? 'library' : 'download'); // 'download' | 'library'
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (!isOpen) return;
    setMode(showLibraryOption ? 'library' : 'download');
    setName(defaultName);
  }, [isOpen, defaultName, showLibraryOption]);

  if (!isOpen) return null;

  const choiceClass = (active) =>
    `w-full flex items-start gap-3 p-4 rounded-2xl border-[1.5px] text-left transition-colors edu-control ${
      active
        ? `${theme.colorPrimaryContainer} ${theme.colorOutline} ${theme.colorOnSurface}`
        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`
    }`;

  const inputClass = `w-full mt-3 px-4 py-3 rounded-xl border-[1.5px] ${TYPE.bodyMd} outline-none ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  const canSaveLibrary = name.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      title="Save Whiteboard"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
          >
            Cancel
          </button>
          <ModalPrimaryButton
            theme={theme}
            disabled={mode === 'library' && !canSaveLibrary}
            onClick={() => {
              if (mode === 'download') {
                onDownloadPage?.();
                onClose();
                return;
              }
              if (!canSaveLibrary) return;
              onSaveToLibrary?.(name.trim());
              onClose();
            }}
          >
            {mode === 'download' ? 'Download page' : 'Save whiteboard'}
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-3">
        <button
          type="button"
          className={choiceClass(mode === 'download')}
          onClick={() => setMode('download')}
        >
          <span
            className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              mode === 'download'
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : isDarkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Download size={18} />
          </span>
          <span className="min-w-0">
            <span className={`block ${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Download this page
            </span>
            <span className={`block mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Save page {pageLabel} as a PNG on your computer.
            </span>
          </span>
        </button>

        {showLibraryOption ? (
          <button
            type="button"
            className={choiceClass(mode === 'library')}
            onClick={() => setMode('library')}
          >
            <span
              className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                mode === 'library'
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Save size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block ${TYPE.titleSm} ${theme.colorOnSurface}`}>
                Save to Saved Whiteboards
              </span>
              <span className={`block mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Keep every page of this whiteboard in Edu.Hub.
              </span>
              {mode === 'library' ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Whiteboard name"
                  className={inputClass}
                  autoFocus
                />
              ) : null}
            </span>
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
