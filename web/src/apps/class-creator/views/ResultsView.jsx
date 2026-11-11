import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Printer,
  Share2,
} from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { isLocalDemoSession } from '../../../auth/demoAccount';
import { useClasses } from '../../../data/classes/ClassContext';
import { SHARED_DEMO_CLASS_ID } from '../../../data/classes/classVisibility';
import {
  classSectionCode,
  gradesForBand,
} from '../../../data/class-creator/classCreatorModel';
import { buildDemoTeacherResults } from '../../../data/class-creator/demoTeacherResults';
import { archiveActiveRun } from '../../../data/class-creator/classCreatorStorage';
import { GradeRosterGrid } from '../GradeRosterGrid';
import { ratingSwatchStyle } from '../ratingSwatch';
import { ClassCreatorPrintSheet } from '../ClassCreatorPrintSheet';
import { downloadDraftPdf, downloadDraftPng } from '../exportDraft';

function feedbackAuthorKey(session, selectedClass) {
  const user = session?.userId || session?.email || 'teacher';
  const cls = selectedClass?.id || 'class';
  return `${user}::${cls}`;
}

/**
 * Shared draft results — admin exports + share; teachers review + feedback.
 * Demo teachers get a mock next-year draft from their current class ratings.
 */
export function ResultsView({
  theme,
  isDarkMode,
  run,
  upsertActiveRun,
  refresh,
  isTeacherView = false,
  selectedClass = null,
  session = null,
}) {
  const { classes } = useClasses();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [archiveMessage, setArchiveMessage] = useState('');
  const [demoFeedbackSavedAt, setDemoFeedbackSavedAt] = useState('');

  const demoClass = useMemo(() => {
    if (selectedClass?.studentList?.length) return selectedClass;
    return (
      (classes || []).find((cls) => String(cls.id) === SHARED_DEMO_CLASS_ID) ||
      (classes || []).find((cls) => !cls.isArchived && cls.studentList?.length) ||
      null
    );
  }, [selectedClass, classes]);

  const demoPreview = useMemo(() => {
    if (!isTeacherView || !isLocalDemoSession(session)) return null;
    if (run?.sharedWithTeachers) return null;
    return buildDemoTeacherResults(demoClass, { yearLabel: run?.yearLabel || 'Next year' });
  }, [isTeacherView, session, run, demoClass]);

  const displayRun = demoPreview || run;
  const isDemoPreview = Boolean(demoPreview);

  const authorKey = feedbackAuthorKey(session, demoClass || selectedClass);
  const existing = !isDemoPreview ? run?.teacherFeedback?.[authorKey] : null;
  const [draftFeedback, setDraftFeedback] = useState(existing?.body || '');

  useEffect(() => {
    if (!isDemoPreview) setDraftFeedback(existing?.body || '');
  }, [existing?.body, authorKey, isDemoPreview]);

  const feedbackList = useMemo(() => {
    const rows = Object.values(run?.teacherFeedback || {});
    return rows
      .filter((row) => row.body)
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }, [run]);

  const resultCards = useMemo(() => {
    if (!displayRun) return [];
    const band = gradesForBand(displayRun.gradeBand || 'k5');
    const byGrade = new Map();
    for (const grade of band) byGrade.set(grade, []);

    for (const teacher of displayRun.destinationTeachers || []) {
      const grade = teacher.destinationGrade || 'Unassigned grade';
      if (!byGrade.has(grade)) byGrade.set(grade, []);
      byGrade.get(grade).push(teacher);
    }

    const ordered = [];
    const emitGrade = (grade, teachers) => {
      const orderIds = displayRun.staffOrderByGrade?.[grade] || [];
      const sorted = [...teachers].sort((a, b) => {
        const ai = orderIds.indexOf(a.id);
        const bi = orderIds.indexOf(b.id);
        if (ai >= 0 || bi >= 0) {
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        }
        return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
          sensitivity: 'base',
        });
      });
      const rooms = sorted.map((teacher, teacherIndex) => {
        const ids = displayRun.draftClasses?.[teacher.id] || [];
        const override = String(displayRun.staffSectionCodes?.[teacher.id] || '')
          .trim()
          .toUpperCase();
        const code = override || classSectionCode(grade, teacherIndex);
        return {
          classId: teacher.id,
          className: code || grade,
          teacherName: teacher.name || 'Teacher',
          students: ids
            .map((id) => displayRun.students?.[id] || { id, name: id })
            .sort((a, b) =>
              String(a.lastName || a.name || '').localeCompare(
                String(b.lastName || b.name || ''),
                undefined,
                { sensitivity: 'base' },
              ),
            ),
        };
      });
      if (rooms.length) ordered.push({ grade, rooms });
    };

    for (const grade of band) {
      emitGrade(grade, byGrade.get(grade) || []);
      byGrade.delete(grade);
    }
    for (const [grade, teachers] of byGrade) {
      emitGrade(grade, teachers);
    }
    return ordered;
  }, [displayRun]);

  const hasDraft = Object.values(displayRun?.draftClasses || {}).some((list) => list.length);

  if (isTeacherView && !run?.sharedWithTeachers && !demoPreview) {
    if (!demoClass?.studentList?.length) {
      return (
        <EmptyState
          message="Select your class to preview next-year results, or wait for admin to share a draft."
          isDarkMode={isDarkMode}
        />
      );
    }
    return (
      <EmptyState
        message="Results are not shared yet — your admin will open this draft when it is ready for feedback."
        isDarkMode={isDarkMode}
      />
    );
  }

  if (!displayRun) {
    return (
      <EmptyState
        message={
          isTeacherView
            ? 'Waiting on admin — a placement run has not started yet.'
            : 'Start a placement run first — Results appear after you place students.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  if (!hasDraft) {
    return (
      <EmptyState
        message={
          isTeacherView
            ? 'No draft classes to review yet.'
            : 'No draft to share yet — Run placement on the Place tab, adjust as needed, then share here.'
        }
        isDarkMode={isDarkMode}
      />
    );
  }

  const onPng = async () => {
    setError('');
    setBusy('png');
    try {
      await downloadDraftPng(displayRun);
    } catch (err) {
      setError(err?.message || 'PNG export failed.');
    } finally {
      setBusy('');
    }
  };

  const onPdf = async () => {
    setError('');
    setBusy('pdf');
    try {
      await downloadDraftPdf(displayRun);
    } catch (err) {
      setError(err?.message || 'PDF export failed.');
    } finally {
      setBusy('');
    }
  };

  const toggleShare = () => {
    if (!run || !upsertActiveRun) return;
    upsertActiveRun({ sharedWithTeachers: !run.sharedWithTeachers });
  };

  const onArchive = () => {
    setError('');
    setArchiveMessage('');
    const result = archiveActiveRun();
    if (!result.ok) {
      setError(result.error || 'Could not archive.');
      return;
    }
    refresh?.();
    setArchiveMessage('Saved to Archive. Open the Archive tab to browse this placement.');
  };

  const saveFeedback = () => {
    const body = draftFeedback.trim();
    if (isDemoPreview) {
      setDemoFeedbackSavedAt(body ? new Date().toISOString() : '');
      return;
    }
    if (!run || !upsertActiveRun) return;
    const teacherFeedback = { ...(run.teacherFeedback || {}) };
    if (!body) {
      delete teacherFeedback[authorKey];
    } else {
      teacherFeedback[authorKey] = {
        authorKey,
        authorId: String(session?.userId || ''),
        authorName: String(session?.displayName || 'Teacher'),
        className: String((demoClass || selectedClass)?.name || ''),
        body,
        updatedAt: new Date().toISOString(),
      };
    }
    upsertActiveRun({ teacherFeedback });
  };

  return (
    <div className="space-y-4 print:hidden">
      <AppBoard mode="scroll" pad="board" theme={theme}>
        <h2 className={`${TYPE.titleSm} mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {isDemoPreview
            ? 'Demo preview · next-year draft'
            : isTeacherView
              ? 'Shared draft results'
              : 'Draft results'}
        </h2>
        <p className={`mb-4 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {isDemoPreview
            ? `Mock ratings from ${demoClass?.name || 'your class'} (${displayRun.sourceGrade}) sorted into ${displayRun.destinationGrade}. Try feedback below — a live shared draft will replace this when admin shares.`
            : isTeacherView
              ? 'Review next-year class lists and leave feedback for admin. Exports stay with leadership.'
              : 'Share this draft with teachers for review and feedback. Download PNG/PDF to email coaches, counselors, and families when ready.'}
        </p>

        {!isTeacherView ? (
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control ${
                run.sharedWithTeachers
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : ''
              }`}
              onClick={toggleShare}
            >
              <Share2 className="w-4 h-4" />
              {run.sharedWithTeachers ? 'Shared with teachers' : 'Share with teachers'}
            </button>
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={onPng}
              disabled={Boolean(busy)}
            >
              <ImageIcon className="w-4 h-4" />
              {busy === 'png' ? 'Saving…' : 'Download PNG'}
            </button>
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control`}
              onClick={onPdf}
              disabled={Boolean(busy)}
            >
              <Download className="w-4 h-4" />
              {busy === 'pdf' ? 'Saving…' : 'Download PDF'}
            </button>
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control`}
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control`}
              onClick={onArchive}
              disabled={Boolean(busy)}
            >
              <Archive className="w-4 h-4" />
              {run?.status === 'final' ? 'Update archive' : 'Archive placements'}
            </button>
          </div>
        ) : null}

        {!isTeacherView && run?.sharedWithTeachers ? (
          <p className={`mb-2 ${TYPE.bodySm} ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Teachers can open Results and leave feedback.
          </p>
        ) : null}

        {archiveMessage ? (
          <p className={`mb-2 ${TYPE.bodySm} ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
            {archiveMessage}
          </p>
        ) : null}

        {error ? <p className={`mt-2 ${TYPE.bodySm} text-rose-600`}>{error}</p> : null}
      </AppBoard>

      {isDemoPreview ? (
        <AppBoard mode="scroll" pad="board" theme={theme}>
          <h3 className={`${TYPE.titleSm} mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Mock ratings used
          </h3>
          <p className={`mb-3 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Overall · Behavior · Teacher time (1–4). These stand in until teachers finish the live
            grid.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {displayRun.cohortStudentIds.map((id) => {
              const student = displayRun.students[id];
              const rating = displayRun.ratings[id] || {};
              return (
                <li
                  key={id}
                  className={`px-3 py-2 rounded-xl border ${theme.colorOutline} ${
                    isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'
                  }`}
                >
                  <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {student?.name || id}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {['overall_academics', 'behavior', 'teacher_time'].map((col) => {
                      const style = ratingSwatchStyle(displayRun.schema, rating[col], col);
                      if (!style) return null;
                      const short =
                        col === 'overall_academics' ? 'OA' : col === 'behavior' ? 'Beh' : 'TT';
                      return (
                        <span
                          key={col}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ backgroundColor: style.backgroundColor, color: style.color }}
                          title={style.label}
                        >
                          {short} {rating[col]}
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </AppBoard>
      ) : null}

      <GradeRosterGrid
        theme={theme}
        isDarkMode={isDarkMode}
        schema={displayRun.schema}
        ratings={displayRun.ratings || {}}
        ratingYearLabel="Current"
        gradeColors={displayRun.gradeColors || {}}
        gradeShapes={displayRun.gradeShapes || {}}
        cards={resultCards}
        emptyMessage="No placed classes yet — run Place to build next-year lists."
      />

      <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {isTeacherView ? 'Your feedback' : 'Teacher feedback'}
          </h2>
        </div>

        {isTeacherView ? (
          <div className="space-y-3">
            <textarea
              className={`edu-control w-full min-h-[6rem] px-3 py-2.5 rounded-xl border text-sm ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-600 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
              value={draftFeedback}
              onChange={(e) => setDraftFeedback(e.target.value)}
              placeholder="Notes for admin about these draft lists…"
            />
            <button
              type="button"
              className={`${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={saveFeedback}
            >
              Save feedback
            </button>
            {isDemoPreview ? (
              <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                {demoFeedbackSavedAt
                  ? `Saved ${new Date(demoFeedbackSavedAt).toLocaleString()} · demo only until admin shares.`
                  : 'Demo feedback stays on this device until a shared draft is available.'}
              </p>
            ) : existing?.updatedAt ? (
              <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Last saved {new Date(existing.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        ) : feedbackList.length === 0 ? (
          <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            {run?.sharedWithTeachers
              ? 'No teacher feedback yet.'
              : 'Share with teachers to collect feedback here.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {feedbackList.map((row) => (
              <li
                key={row.authorKey}
                className={`rounded-xl border px-3 py-2.5 ${theme.colorOutline} ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'
                }`}
              >
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {row.authorName}
                  {row.className ? (
                    <span
                      className={`ml-2 font-normal ${TYPE.bodySm} ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {row.className}
                    </span>
                  ) : null}
                </p>
                <p
                  className={`mt-1 whitespace-pre-wrap ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {row.body}
                </p>
                {row.updatedAt ? (
                  <p
                    className={`mt-1 ${TYPE.bodySm} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-500'
                    }`}
                  >
                    {new Date(row.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AppBoard>

      {!isTeacherView ? <ClassCreatorPrintSheet run={displayRun} /> : null}
    </div>
  );
}
