import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { isFinished, speakScript } from '../../../data/tests/model';
import { speakItem, stopSpeaking } from '../../../data/tests/speak';
import { saveProgress, submitAttempt } from '../../../data/tests/storage';
import { AppPageShell } from '../../../shared/AppPageShell';
import { TYPE } from '../../../shared/typography';

function draftFromAttempt(attempt) {
  const draft = {};
  for (const [itemId, stored] of Object.entries(attempt?.answers || {})) {
    if (stored?.value && typeof stored.value === 'object') draft[itemId] = stored.value;
    else draft[itemId] = stored && typeof stored === 'object' ? stored : {};
  }
  return draft;
}

function isVisited(item, answer) {
  if (!answer) return false;
  if (item?.type === 'short_write' || item?.type === 'long_write') return 'text' in answer;
  return hasAnswer(item, answer);
}

function firstOpenIndex(items, draft) {
  const index = items.findIndex((item) => !isVisited(item, draft[item.id]));
  return index === -1 ? 0 : index;
}

function hasAnswer(item, answer) {
  if (!item) return false;
  if (item.type === 'short_write' || item.type === 'long_write') return true;
  if (item.type === 'number') return String(answer?.number || '').trim().length > 0;
  if (item.type === 'choose_one') return Boolean(answer?.choiceId);
  return true;
}

export function PlayerView({
  theme,
  assessment,
  assignment,
  studentId,
  actorId,
  attempt,
  onExit,
}) {
  const items = assessment.items || [];
  const [draft, setDraft] = useState(() => draftFromAttempt(attempt));
  const [index, setIndex] = useState(() =>
    attempt && isFinished(attempt) ? items.length : firstOpenIndex(items, draftFromAttempt(attempt)),
  );
  const [result, setResult] = useState(() => (attempt && isFinished(attempt) ? attempt : null));
  const [busy, setBusy] = useState(false);
  const item = items[index];

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    stopSpeaking();
  }, [item?.id]);

  const script = useMemo(() => (item ? speakScript(item) : ''), [item]);

  function remember(nextDraft) {
    setDraft(nextDraft);
    saveProgress({
      assignment,
      studentId,
      actorId,
      answers: nextDraft,
    }).catch(() => {});
  }

  function setAnswer(value) {
    remember({ ...draft, [item.id]: value });
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    stopSpeaking();
    try {
      const saved = await submitAttempt({
        assessment,
        assignment,
        studentId,
        actorId,
        answers: draft,
      });
      setResult(saved);
      setIndex(items.length);
    } finally {
      setBusy(false);
    }
  }

  function goNext() {
    if (!hasAnswer(item, draft[item.id])) return;
    stopSpeaking();
    if (index >= items.length - 1) {
      finish();
      return;
    }
    setIndex(index + 1);
  }

  if (!items.length) {
    return (
      <AppPageShell variant="stage">
        <p className={`p-4 ${TYPE.bodyMd}`}>This test has no questions.</p>
      </AppPageShell>
    );
  }

  if (result || index >= items.length) {
    const needsWriting = result?.status === 'needs_grading';
    return (
      <AppPageShell variant="stage">
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-4 text-center">
          <p className={TYPE.displaySm}>You are done.</p>
          {result?.status === 'graded' || result?.status === 'closed' ? (
            <p className={TYPE.displayMd}>
              {result.pointsEarned}/{result.pointsPossible}
            </p>
          ) : null}
          <p className={`${TYPE.bodyMd} max-w-md ${theme.colorOnSurfaceVariant}`}>
            {needsWriting
              ? 'Your teacher will read what you wrote.'
              : 'Your score is saved in the grade book.'}
          </p>
          <button
            type="button"
            onClick={onExit}
            className={`edu-control rounded-xl px-5 py-3 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Back to tests
          </button>
        </div>
      </AppPageShell>
    );
  }

  const answer = draft[item.id] || {};
  const ready = hasAnswer(item, answer);

  return (
    <AppPageShell variant="stage">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onExit();
            }}
            className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          >
            Back
          </button>
          <p className={`min-w-0 flex-1 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            {index + 1} of {items.length}
          </p>
          <button
            type="button"
            onClick={() => speakItem(item)}
            className={`edu-control inline-flex items-center gap-2 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            aria-label={script ? `Hear it. ${script}` : 'Hear it'}
          >
            <Volume2 size={18} aria-hidden="true" />
            Hear it
          </button>
        </div>

        <h2 className={`shrink-0 overflow-y-auto ${TYPE.titleLg}`}>{item.prompt}</h2>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {item.type === 'choose_one' ? (
            <div className="flex flex-col gap-3">
              {(item.choices || []).map((choice) => {
                const selected = answer.choiceId === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswer({ choiceId: choice.id })}
                    className={`edu-control min-h-16 rounded-2xl border-[1.5px] px-4 py-4 text-left ${TYPE.titleMd} ${
                      selected
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {item.type === 'number' ? (
            <NumberPad
              theme={theme}
              value={answer.number || ''}
              onChange={(number) => setAnswer({ number })}
            />
          ) : null}

          {item.type === 'short_write' || item.type === 'long_write' ? (
            <textarea
              value={answer.text || ''}
              onChange={(event) => setAnswer({ text: event.target.value })}
              rows={5}
              className={`edu-control min-h-32 w-full rounded-2xl border-[1.5px] px-4 py-3 ${TYPE.titleMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              placeholder="Write here"
            />
          ) : null}

          {item.type !== 'choose_one' &&
          item.type !== 'number' &&
          item.type !== 'short_write' &&
          item.type !== 'long_write' ? (
            <p className={TYPE.bodyMd}>This question opens when that answer type is on the student screen.</p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!ready || busy}
          onClick={goNext}
          className={`edu-control shrink-0 rounded-2xl px-4 py-4 ${TYPE.titleMd} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-50`}
        >
          {index >= items.length - 1 ? 'Done' : 'Next'}
        </button>
      </div>
    </AppPageShell>
  );
}

function NumberPad({ theme, value, onChange }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  function press(key) {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.' && value.includes('.')) return;
    if (value.length >= 12) return;
    onChange(`${value}${key}`);
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <p className={`${TYPE.displayMd} ${theme.colorOnSurface}`} aria-live="polite">
        {value || '—'}
      </p>
      <div className="grid flex-1 grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className={`edu-control min-h-14 rounded-2xl border-[1.5px] ${TYPE.displaySm} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
            aria-label={key === '⌫' ? 'Delete' : key}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
