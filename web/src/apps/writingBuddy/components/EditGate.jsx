import { useEffect, useState } from 'react';
import {
  editChecklist,
  replaceSpan,
  tokenizeWords,
} from '../../../data/writingBuddy/editHeuristics';
import {
  fetchSuggestions,
  quickSuggestions,
} from '../../../data/dictionary/suggest';
import { AppBoard } from '../../../shared/AppBoard';
import { TYPE } from '../../../shared/typography';
import { WriteChrome, WriteNavRow } from './WriteChrome';

/**
 * Between-piece / final revise gate: checklist + tap-a-word spell help.
 */
export function EditGate({
  theme,
  buddyName,
  portraitId,
  portraitImage = '',
  prompt = 'Nice writing! Let’s check your words.',
  text,
  onChangeText,
  onContinue,
  onBack,
  continueLabel = 'Continue',
}) {
  const checklist = editChecklist(text);
  const tokens = tokenizeWords(text);
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [capitalOk, setCapitalOk] = useState(false);
  const [endOk, setEndOk] = useState(false);

  useEffect(() => {
    setSelected(null);
    setSuggestions([]);
    setAnswered(false);
    setCapitalOk(checklist.capital);
    setEndOk(checklist.endMark);
  }, [text, checklist.capital, checklist.endMark]);

  useEffect(() => {
    if (!selected) {
      setSuggestions([]);
      return;
    }
    const quick = quickSuggestions(selected.word);
    setSuggestions(quick);
    let cancelled = false;
    setLoading(true);
    fetchSuggestions(selected.word)
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  function applySuggestion(word) {
    if (!selected) return;
    const next = replaceSpan(text, selected.start, selected.end, word);
    onChangeText?.(next);
    setSelected(null);
  }

  const canContinue = checklist.hasText && answered;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <WriteChrome
        theme={theme}
        portraitId={portraitId}
        portraitImage={portraitImage}
        buddyName={buddyName}
        bubble={prompt}
      />

      <WriteNavRow
        theme={theme}
        onBack={onBack}
        onNext={onContinue}
        nextDisabled={!canContinue}
        nextLabel={continueLabel}
      >
      <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
        <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Tap a word for spelling help</p>
        <div
          className={`mt-2 flex flex-wrap gap-1.5 rounded-xl border-[1.5px] p-3 ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline}`}
        >
          {tokens.length === 0 ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>Nothing to check yet.</p>
          ) : (
            tokens.map((tok) => {
              const on = selected?.start === tok.start && selected?.end === tok.end;
              return (
                <button
                  key={`${tok.start}-${tok.word}`}
                  type="button"
                  className={`edu-control rounded-lg px-2 py-1 ${TYPE.bodyMd} ${
                    on
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline} border-[1.5px]`
                  }`}
                  onClick={() => setSelected(tok)}
                >
                  {tok.word}
                </button>
              );
            })
          )}
        </div>

        {selected ? (
          <div className="mt-3">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
              Suggestions for “{selected.word}”
              {loading ? '…' : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.length === 0 && !loading ? (
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  No suggestions yet — try another spelling.
                </p>
              ) : (
                suggestions.map((word) => (
                  <button
                    key={word}
                    type="button"
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                    onClick={() => applySuggestion(word)}
                  >
                    {word}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        <p className={`${TYPE.labelMd} mt-5 ${theme.colorOnSurface}`}>Quick checks</p>
        <div className="mt-2 flex flex-col gap-2">
          <CheckChip
            theme={theme}
            pressed={capitalOk}
            onClick={() => setCapitalOk((v) => !v)}
            label={
              checklist.capital
                ? 'Starts with a capital — looks good'
                : 'I fixed the capital letter (or it’s okay)'
            }
            hint={!checklist.capital}
          />
          <CheckChip
            theme={theme}
            pressed={endOk}
            onClick={() => setEndOk((v) => !v)}
            label={
              checklist.endMark
                ? 'Ends with . ! or ? — looks good'
                : 'I added an end mark (or it’s okay)'
            }
            hint={!checklist.endMark}
          />
          <CheckChip
            theme={theme}
            pressed={answered}
            onClick={() => setAnswered((v) => !v)}
            label="This answers the buddy’s question"
          />
        </div>

        <label className={`mt-5 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
          Edit if you need to
          <textarea
            className={`mt-2 min-h-28 w-full resize-y rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            value={text}
            spellCheck
            onChange={(e) => onChangeText?.(e.target.value)}
          />
        </label>
      </AppBoard>
      </WriteNavRow>
    </div>
  );
}

function CheckChip({ theme, pressed, onClick, label, hint }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 text-left ${TYPE.labelMd} ${
        pressed
          ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
          : hint
            ? `${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
            : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
      }`}
    >
      {pressed ? '✓ ' : '○ '}
      {label}
    </button>
  );
}
