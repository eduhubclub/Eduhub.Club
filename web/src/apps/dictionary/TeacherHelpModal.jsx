import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';
import { normalizeLookup } from '../../data/dictionary/spellingBank';

/**
 * Teacher types the intended word so the class dictionary can learn a kid spelling.
 */
export function TeacherHelpModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  kidSpelling,
  onTeach,
}) {
  const [correct, setCorrect] = useState('');
  const inputRef = useRef(null);
  const attempt = normalizeLookup(kidSpelling);

  useEffect(() => {
    if (!isOpen) return;
    setCorrect('');
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [isOpen, kidSpelling]);

  const word = normalizeLookup(correct);
  const submit = () => {
    if (!word) return;
    onTeach?.(attempt, word);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Ask a teacher"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} disabled={!word} onClick={submit}>
            Save spelling
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
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          A student typed this. Type the word they meant — we’ll remember it on this
          device.
        </p>
        <p
          className={`mt-3 ${TYPE.displaySm} normal-case tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {attempt || '…'}
        </p>
        <label
          className={`block mt-5 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
          htmlFor="dictionary-teacher-word"
        >
          Correct word
        </label>
        <input
          ref={inputRef}
          id="dictionary-teacher-word"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
          placeholder="Type the real spelling…"
          className={`edu-control mt-2 w-full rounded-xl border-[1.5px] px-4 py-3 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
        />
      </form>
    </Modal>
  );
}
