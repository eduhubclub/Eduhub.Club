import { useEffect, useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

/**
 * Name a paper preset before saving or renaming it.
 */
export function SavePaperModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  title = 'Save paper',
  confirmLabel = 'Save',
  defaultName = '',
  onSave,
}) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (!isOpen) return;
    setName(defaultName);
  }, [isOpen, defaultName]);

  const trimmed = name.trim();
  const submit = () => {
    if (!trimmed) return;
    onSave?.(trimmed);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
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
          <ModalPrimaryButton theme={theme} disabled={!trimmed} onClick={submit}>
            {confirmLabel}
          </ModalPrimaryButton>
        </div>
      }
    >
      <form
        className="p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`} htmlFor="paper-preset-name">
          Preset name
        </label>
        <input
          id="paper-preset-name"
          className={`edu-control mt-2 w-full rounded-xl border-[1.5px] px-4 py-3 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="3rd grade handwriting"
          autoFocus
        />
      </form>
    </Modal>
  );
}
