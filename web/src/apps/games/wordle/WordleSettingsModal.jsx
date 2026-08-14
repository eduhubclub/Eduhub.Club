import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import {
  WORD_LENGTHS,
  WORD_LISTS,
  ALL_WORDS_LIST_ID,
  listCountAtLength,
  normalizeListIds,
  normalizePuzzleWord,
  wordsForLength,
} from './wordBank';

/**
 * Wordle settings — word length (2–8) and which classroom lists to include.
 */
export function WordleSettingsModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  wordLength,
  listIds,
  dailyWord = '',
  onApply,
}) {
  const [tempLength, setTempLength] = useState(wordLength);
  const [tempLists, setTempLists] = useState(() => normalizeListIds(listIds));
  const [tempDaily, setTempDaily] = useState(dailyWord);

  useEffect(() => {
    if (!isOpen) return;
    setTempLength(wordLength);
    setTempLists(normalizeListIds(listIds));
    setTempDaily(dailyWord);
  }, [isOpen, wordLength, listIds, dailyWord]);

  const enabledLists = normalizeListIds(tempLists);
  const count = wordsForLength(tempLength, enabledLists).length;
  const dailyNormalized = normalizePuzzleWord(tempDaily);
  const typedLetters = tempDaily.replace(/[^a-z]/gi, '');
  const dailyError = typedLetters.length > 0 && !dailyNormalized;

  const toggleList = (id) => {
    setTempLists((prev) => {
      const on = prev.includes(id);
      if (on) {
        const next = prev.filter((item) => item !== id);
        return next.length ? next : prev;
      }
      return [...prev, id];
    });
  };

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
            disabled={(count === 0 && !dailyNormalized) || dailyError}
            onClick={() => {
              onApply(tempLength, enabledLists, dailyNormalized);
              onClose();
            }}
          >
            Apply
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="p-6 space-y-6">
        <div>
          <p
            className={`${TYPE.titleSm} mb-1 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Word lists
          </p>
          <p
            className={`${TYPE.bodySm} mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Choose which lists puzzles can come from. Keep at least one on.
          </p>
          <div className="flex flex-col gap-2">
            {WORD_LISTS.map((list) => {
              const active = enabledLists.includes(list.id);
              const listCount = listCountAtLength(list.id, tempLength);
              const extra =
                list.id === ALL_WORDS_LIST_ID
                  ? `${listCount.toLocaleString()} valid guesses at ${tempLength} letters.`
                  : `${listCount} at ${tempLength} letters.`;
              const checkboxId = `wordle-list-${list.id}`;
              return (
                <label
                  key={list.id}
                  htmlFor={checkboxId}
                  className={`edu-control flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3 py-2.5 transition-colors ${
                    isDarkMode
                      ? `${theme.colorSurface} border-slate-600 hover:bg-slate-800`
                      : `${theme.colorSurface} ${theme.colorOutline} hover:bg-slate-50`
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`${TYPE.titleSm} block ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {list.name}
                    </span>
                    <span
                      className={`block mt-0.5 ${TYPE.bodySm} ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {list.description} {extra}
                    </span>
                  </span>
                  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleList(list.id)}
                      className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 ${
                        active
                          ? `${theme.colorPrimary} border-transparent ${theme.colorOnPrimary}`
                          : isDarkMode
                            ? 'border-slate-500 bg-slate-900'
                            : 'border-slate-300 bg-white'
                      }`}
                      aria-hidden
                    >
                      {active ? <Check size={12} strokeWidth={3.5} /> : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

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
            Choose how many letters each puzzle has.
          </p>
          <div className="flex flex-wrap gap-2">
            {WORD_LENGTHS.map((n) => {
              const active = tempLength === n;
              const available = wordsForLength(n, enabledLists).length;
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

        <div>
          <p
            className={`${TYPE.titleSm} mb-1 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Word of the day
          </p>
          <p
            className={`${TYPE.bodySm} mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Type a specific word for students to solve today. Leave blank to pick
            randomly from the lists.
          </p>
          <input
            id="wordle-daily-word"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            value={tempDaily}
            onChange={(e) => setTempDaily(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            placeholder="e.g. heart"
            className={`edu-control w-full rounded-xl border-[1.5px] px-4 py-3 uppercase tracking-wide ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          />
          <p
            className={`${TYPE.bodySm} mt-2 ${
              dailyError
                ? 'text-rose-500'
                : isDarkMode
                  ? 'text-slate-500'
                  : 'text-slate-400'
            }`}
          >
            {dailyError
              ? 'Use 2–8 letters.'
              : dailyNormalized
                ? `${dailyNormalized.length} letters — length will match this word.`
                : 'Clears tomorrow. New word still picks a random practice puzzle.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
