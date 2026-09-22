import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Keyboard, Send, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD, APP_STATIC_BOARD, APP_STAGE_PAD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useClasses } from '../../../data/classes/ClassContext';
import {
  assignTextForToday,
  deleteTeacherText,
  formatActiveTime,
  listTeacherTexts,
} from '../../../data/eduType/eduTypeApi';
import { ProgressBar } from '../components/ProgressBar';
import { SpecialtyShortcutsHint } from '../typing/SpecialtyShortcutsHint';
import { TypingPassage, TypingStats } from '../typing/TypingPassage';
import { TypingKeyboard } from '../typing/TypingKeyboard';
import { useTypingKeyboardVisible } from '../hooks/useTypingKeyboardVisible';

/**
 * Teacher: browse saved passages, preview as a student, send for today, or delete.
 */
export function SavedView({ theme, isDarkMode }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const { showKeyboard, toggleKeyboard } = useTypingKeyboardVisible();
  const { classes: classStore, selectedClass } = useClasses();
  const activeClasses = useMemo(
    () => (classStore || []).filter((c) => !c.isArchived),
    [classStore],
  );
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [charIndex, setCharIndex] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    wpm: 0,
    activeMs: 0,
    accuracy: 1,
  });
  const [doneStats, setDoneStats] = useState(null);

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  async function refresh(cid = classId) {
    const list = await listTeacherTexts(cid || 'local');
    setItems(list);
  }

  useEffect(() => {
    const preferred = selectedClass?.id;
    if (preferred) {
      setClassId(preferred);
      return;
    }
    setClassId((prev) => prev || activeClasses[0]?.id || 'local');
  }, [selectedClass?.id, activeClasses]);

  useEffect(() => {
    refresh(classId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  function openPreview(item) {
    setPreview(item);
    setCharIndex(0);
    setDoneStats(null);
    setLiveMetrics({ wpm: 0, activeMs: 0, accuracy: 1 });
    setNote('');
  }

  function closePreview() {
    setPreview(null);
    setCharIndex(0);
    setDoneStats(null);
  }

  async function onSend(textId, textTitle) {
    const target = classId || 'local';
    setBusy(true);
    setError('');
    try {
      await assignTextForToday({ classId: target, textId });
      setNote(`“${textTitle}” is assigned for today. Open Today to practice.`);
    } catch (err) {
      setError(err.message || 'Could not assign for today.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(textId) {
    setBusy(true);
    try {
      await deleteTeacherText(textId);
      await refresh(classId || 'local');
      if (preview?.id === textId) closePreview();
    } finally {
      setBusy(false);
    }
  }

  if (preview) {
    const body = preview.body || '';
    const finished = Boolean(doneStats) || (body.length > 0 && charIndex >= body.length);

    return (
      <div
        className={`flex min-h-[28rem] flex-col gap-3 ${APP_STATIC_BOARD} ${APP_STAGE_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" className={toolBtn} onClick={closePreview}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Saved
          </button>
          <div className="min-w-0 flex-1">
            <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>{preview.title}</p>
            <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
              View as student · practice only (not saved to student progress)
            </p>
          </div>
          <TypingStats theme={theme} {...liveMetrics} />
        </div>

        <ProgressBar
          theme={theme}
          value={body.length ? Math.min(charIndex, body.length) / body.length : 0}
          label="Passage progress"
        />

        {finished ? (
          <div
            className={`rounded-xl border-[1.5px] p-4 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
          >
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Finished!</p>
            <TypingStats theme={theme} {...(doneStats || liveMetrics)} />
            <p className={`${TYPE.bodySm} mt-2 whitespace-pre-wrap ${theme.colorOnSurface}`}>
              {body}
            </p>
            <p className={`${TYPE.labelSm} mt-2 ${theme.colorOnSurfaceVariant}`}>
              Time {formatActiveTime(doneStats?.activeMs || liveMetrics.activeMs || 0)}
            </p>
            <button type="button" className={`${toolBtn} mt-3`} onClick={() => openPreview(preview)}>
              Type again
            </button>
          </div>
        ) : (
          <>
            <TypingPassage
              key={`preview-${preview.id}`}
              text={body}
              theme={theme}
              initialCharIndex={0}
              onProgress={({ charIndex: next }) => setCharIndex(next)}
              onMetrics={setLiveMetrics}
              onComplete={(stats) => {
                setDoneStats(stats);
                setCharIndex(body.length);
              }}
              className={`min-h-[10rem] flex-1 ${theme.colorSurfaceVariant} ${theme.colorOutline} border-[1.5px]`}
            />
            <SpecialtyShortcutsHint text={body} theme={theme} />
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                className={`${toolBtn} ${
                  showKeyboard ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                onClick={toggleKeyboard}
                aria-pressed={showKeyboard}
                aria-label={showKeyboard ? 'Hide keyboard' : 'Show keyboard'}
              >
                <Keyboard className="h-4 w-4" aria-hidden />
                Keyboard
              </button>
            </div>
            <TypingKeyboard theme={theme} visible={showKeyboard} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Saved"
        description="Passages you have saved for this class. Preview as a student, or send one for today."
        isDarkMode={isDarkMode}
      />

      {activeClasses.length > 0 ? (
        <label className={`flex max-w-md flex-col gap-1 ${TYPE.labelMd}`}>
          <span className={theme.colorOnSurfaceVariant}>Class</span>
          <select
            className={fieldClass}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {activeClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {note ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{note}</p>
      ) : null}
      {error ? <p className={`${TYPE.bodySm} text-red-600`}>{error}</p> : null}

      {!items.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No saved passages yet. Use Create to paste and save one."
        />
      ) : (
        <ul className="flex max-w-2xl flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex flex-col gap-2 p-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{item.title}</p>
                  <p
                    className={`${TYPE.bodySm} line-clamp-3 whitespace-pre-wrap ${theme.colorOnSurfaceVariant}`}
                  >
                    {item.body}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={toolBtn}
                    onClick={() => openPreview(item)}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View as student
                  </button>
                  <button
                    type="button"
                    className={toolBtn}
                    disabled={busy}
                    onClick={() => onSend(item.id, item.title)}
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Send for today
                  </button>
                  <button
                    type="button"
                    className={toolBtn}
                    disabled={busy}
                    onClick={() => onDelete(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
