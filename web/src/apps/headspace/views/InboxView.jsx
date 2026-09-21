import { useEffect, useMemo, useState } from 'react';
import {
  cancelRequest,
  createRequest,
  getRequest,
  HEADSPACE_UPDATED_EVENT,
  listRequests,
  listSharedEntries,
} from '../../../data/headspace/headspaceStorage';
import { moodLabel } from '../../../data/headspace/moods';
import { studentDisplayName } from '../../../data/students/displayName';
import { AppBoard } from '../../../shared/AppBoard';
import { PageHeader } from '../../../shared/PageHeader';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { StudentPicker } from '../StudentPicker';

/**
 * Teacher inbox: shared letters + request / cancel check-ins.
 */
export function InboxView({
  theme,
  isDarkMode,
  classId,
  roster = [],
  classLabel,
}) {
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState(() =>
    roster[0] ? String(roster[0].id) : '',
  );
  const [openEntry, setOpenEntry] = useState(null);
  const [note, setNote] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener(HEADSPACE_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(HEADSPACE_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    if (!roster.length) {
      setSelectedId('');
      return;
    }
    if (!roster.some((s) => String(s.id) === String(selectedId))) {
      setSelectedId(String(roster[0].id));
    }
  }, [roster, selectedId]);

  const byId = useMemo(() => {
    const map = {};
    for (const s of roster) map[String(s.id)] = s;
    return map;
  }, [roster]);

  void tick;
  const shared = listSharedEntries(classId);
  const pending = listRequests(classId, 'pending');
  const selectedRequest = selectedId ? getRequest(classId, selectedId) : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Inbox"
        description={
          classLabel
            ? `Shared Pet Rock letters and check-in requests — ${classLabel}.`
            : 'Shared Pet Rock letters and check-in requests.'
        }
        isDarkMode={isDarkMode}
      />

      <StudentPicker
        roster={roster}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
        label="Request a check-in from"
      />

      {selectedId ? (
        <AppBoard mode="grid" pad="board" theme={theme}>
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            {studentDisplayName(byId[selectedId] || { id: selectedId })}
          </p>
          {selectedRequest?.status === 'pending' ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Request pending
                {selectedRequest.note ? ` — ${selectedRequest.note}` : ''}.
              </p>
              <button
                type="button"
                className={toolBtn}
                onClick={() => {
                  cancelRequest(classId, selectedId);
                  setTick((n) => n + 1);
                }}
              >
                Cancel request
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className={`block min-w-0 flex-1 ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                Optional note
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={120}
                  className={`edu-control mt-1 w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                  placeholder="How are you today?"
                />
              </label>
              <button
                type="button"
                className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                onClick={() => {
                  createRequest(classId, selectedId, note);
                  setNote('');
                  setTick((n) => n + 1);
                }}
              >
                Request entry
              </button>
            </div>
          )}
        </AppBoard>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            Pending requests ({pending.length})
          </p>
          {pending.length === 0 ? (
            <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
              No open requests.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {pending.map(({ studentId, request }) => (
                <li
                  key={request.id}
                  className={`rounded-xl border-[1.5px] p-3 ${theme.colorSurface} ${theme.colorOutline}`}
                >
                  <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                    {studentDisplayName(byId[studentId] || { id: studentId })}
                  </p>
                  {request.note ? (
                    <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                      {request.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AppBoard>

        <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
            Shared letters ({shared.length})
          </p>
          {shared.length === 0 ? (
            <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
              Students haven’t sent any letters yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {shared.map(({ studentId, entry }) => (
                <li key={`${studentId}-${entry.id}`}>
                  <button
                    type="button"
                    onClick={() => setOpenEntry({ studentId, entry })}
                    className={`edu-control w-full rounded-xl border-[1.5px] p-3 text-left ${theme.colorSurface} ${theme.colorOutline}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                        {studentDisplayName(byId[studentId] || { id: studentId })}
                      </span>
                      <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                        {entry.dateISO} · {moodLabel(entry.mood) || entry.mood}
                      </span>
                    </div>
                    <p
                      className={`${TYPE.bodySm} mt-1 line-clamp-2 ${theme.colorOnSurfaceVariant}`}
                    >
                      {entry.body}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AppBoard>
      </div>

      {openEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="headspace-entry-title"
            className={`w-full max-w-lg rounded-2xl border-[1.5px] p-5 ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <h2
              id="headspace-entry-title"
              className={`${TYPE.titleSm} ${theme.colorOnSurface}`}
            >
              {studentDisplayName(
                byId[openEntry.studentId] || { id: openEntry.studentId },
              )}
            </h2>
            <p className={`${TYPE.labelSm} mt-1 ${theme.colorOnSurfaceVariant}`}>
              {openEntry.entry.dateISO} ·{' '}
              {moodLabel(openEntry.entry.mood) || openEntry.entry.mood}
            </p>
            <p className={`${TYPE.bodyMd} mt-3 whitespace-pre-wrap ${theme.colorOnSurface}`}>
              {openEntry.entry.body}
            </p>
            <button
              type="button"
              className={`edu-control mt-4 rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={() => setOpenEntry(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
