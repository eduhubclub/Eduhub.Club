import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAuth } from '../../../data/auth/AuthContext';
import { useClasses } from '../../../data/classes/ClassContext';
import {
  assignTextForToday,
  createTeacherText,
} from '../../../data/eduType/eduTypeApi';

/**
 * Teacher: paste a passage, save it, and optionally assign it for today.
 */
export function CreateView({ theme, isDarkMode }) {
  const { session } = useAuth();
  const { classes, selectedClass } = useClasses();
  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  useEffect(() => {
    const preferred = selectedClass?.id;
    if (preferred) {
      setClassId(preferred);
      return;
    }
    if (!classId || classId === 'local') {
      setClassId(activeClasses[0]?.id || 'local');
    }
  }, [selectedClass?.id, activeClasses]);

  async function savePassage({ assignToday }) {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError('Add a title and text before saving.');
      return;
    }
    setBusy(true);
    setError('');
    setNote('');
    try {
      const targetClassId = classId || selectedClass?.id || 'local';
      const row = await createTeacherText({
        classId: targetClassId,
        teacherId: session?.userId || 'local',
        title: trimmedTitle,
        body: trimmedBody,
      });
      if (assignToday) {
        await assignTextForToday({ classId: row.classId || targetClassId, textId: row.id });
        setNote(`Saved and assigned “${row.title}” for today. Open Today to practice.`);
      } else {
        setNote(`Saved “${row.title}”. Open Saved to send it for today later.`);
      }
      setTitle('');
      setBody('');
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Create"
        description="Paste text for students to type. Save for today to put it on the Today board."
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
      ) : (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          No class selected yet — this will save on this device. Add a class from the Classes tab
          when you are ready for cloud roster practice.
        </p>
      )}

      {note ? (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{note}</p>
      ) : null}
      {error ? <p className={`${TYPE.bodySm} text-red-600`}>{error}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          savePassage({ assignToday: true });
        }}
        className={`flex max-w-2xl flex-col gap-3 p-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Title</span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning warm-up"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Text</span>
          <textarea
            className={`${fieldClass} min-h-[10rem]`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Paste the passage students should type…"
            required
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Save for today
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => savePassage({ assignToday: false })}
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface} border-[1.5px]`}
          >
            Save only
          </button>
        </div>
      </form>
    </div>
  );
}
