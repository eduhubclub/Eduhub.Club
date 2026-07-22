import { useEffect, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import { wordsForLength } from './wordBank';

const LENGTHS = [2, 3, 4, 5, 6, 7, 8];

/**
 * Wordle settings — word length (2–8).
 */
export function WordleSettingsModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  wordLength,
  onApply,
}) {
  const [tempLength, setTempLength] = useState(wordLength);

  useEffect(() => {
    if (isOpen) setTempLength(wordLength);
  }, [isOpen, wordLength]);

  const count = wordsForLength(tempLength).length;

  return (
    <Modal
      isOpen={isOpen}
      title="Wordle settings"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <ModalPrimaryButton
            theme={theme}
            onClick={() => {
              onApply(tempLength);
              onClose();
            }}
          >
            Apply
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <div>
          <p
            className={`${TYPE.titleSm} mb-1 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Word length
          </p>
          <p
            className={`${TYPE.bodySm} mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Choose how many letters each puzzle has. Words come from Fry, Dolch,
            and heart / irregular lists.
          </p>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((n) => {
              const active = tempLength === n;
              const available = wordsForLength(n).length;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={available === 0}
                  onClick={() => setTempLength(n)}
                  className={`edu-control min-w-[2.75rem] h-11 px-3 rounded-xl ${TYPE.labelLg} border-[1.5px] transition-all ${
                    active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  } disabled:opacity-40`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p
            className={`${TYPE.bodySm} mt-3 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {count} words available at {tempLength} letters
          </p>
        </div>
      </div>
    </Modal>
  );
}
