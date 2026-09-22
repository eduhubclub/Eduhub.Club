import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { loadTeacherClasses } from '../../../data/access/studentAccessApi';
import {
  formatActiveTime,
  listClassSessions,
} from '../../../data/eduType/eduTypeApi';
import { getClassic } from '../classics/catalog';

function contentLabel(kind, id) {
  if (kind === 'classic') {
    const book = getClassic(id);
    return book ? book.title : id;
  }
  return `Practice · ${String(id || '').slice(0, 8)}`;
}

/**
 * Teacher class summary of recent typing sessions (WPM / time / accuracy).
 */
export function ClassStatsView({ theme, isDarkMode }) {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadTeacherClasses()
      .then(async (list) => {
        if (cancelled) return;
        setClasses(list);
        const id = list[0]?.id || '';
        setClassId(id);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load classes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!classId) {
      setSessions([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const rows = await listClassSessions(classId, { limit: 50 });
        if (cancelled) return;
        setSessions(rows);

        // Optional names from class_members via supabase in studentAccessApi shape
        try {
          const { loadClassAccess } = await import('../../../data/access/studentAccessApi');
          const access = await loadClassAccess(classId);
          const map = {};
          for (const m of access.members || []) {
            map[m.student_id || m.studentId] = m.display_name || m.displayName;
          }
          if (!cancelled) setMembers(map);
        } catch {
          if (!cancelled) setMembers({});
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load sessions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const fieldClass = `edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const rows = useMemo(() => sessions, [sessions]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader
        title="Class Stats"
        description="Recent typing sessions — WPM, time, and accuracy for this class."
        isDarkMode={isDarkMode}
      />

      {classes.length > 0 ? (
        <label className={`flex max-w-md flex-col gap-1 ${TYPE.labelMd}`}>
          <span className={theme.colorOnSurfaceVariant}>Class</span>
          <select
            className={fieldClass}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? <p className={`${TYPE.bodySm} text-red-600`}>{error}</p> : null}

      {loading ? (
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>Loading…</p>
      ) : !rows.length ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No typing sessions yet for this class."
        />
      ) : (
        <ul className="flex max-w-3xl flex-col gap-2">
          {rows.map((s) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <div className="min-w-0">
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {members[s.studentId] || 'Student'}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {contentLabel(s.contentKind, s.contentId)}
                </p>
              </div>
              <div className={`text-right ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                <p>
                  <span className={`font-semibold ${theme.colorOnSurface}`}>
                    {Math.round(s.wpm) || 0}
                  </span>{' '}
                  WPM · {formatActiveTime(s.activeMs)} · {Math.round((s.accuracy || 0) * 100)}%
                </p>
                <p>
                  {s.startedAt
                    ? new Date(s.startedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
