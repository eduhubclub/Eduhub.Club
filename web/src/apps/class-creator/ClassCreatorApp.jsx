import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { AppPageShell } from '../../shared/AppPageShell';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { PageHeader } from '../../shared/PageHeader';
import { TYPE } from '../../shared/typography';
import { useAuth } from '../../data/auth/AuthContext';
import { isLocalDemoSession } from '../../auth/demoAccount';
import { useClasses } from '../../data/classes/ClassContext';
import { SHARED_DEMO_CLASS_ID } from '../../data/classes/classVisibility';
import { deletePlacementArchive } from '../../data/class-creator/classCreatorStorage';
import { displayPlacementYearLabel } from '../../data/class-creator/classCreatorModel';
import { useClassCreatorStore } from '../../data/class-creator/useClassCreatorStore';
import { useDistrictOrg } from '../../data/district/useDistrictOrg';
import { schoolsForClassCreatorSession } from '../../data/class-creator/placementSchools';
import { DashboardView } from './views/DashboardView';
import { SetupView } from './views/SetupView';
import { RatingsView } from './views/RatingsView';
import { PlaceView } from './views/PlaceView';
import { ResultsView } from './views/ResultsView';
import { ArchiveView, DEMO_ARCHIVE_DISMISSED_KEY } from './views/ArchiveView';

const TEACHER_TABS = new Set(['Dashboard', 'Survey Preview', 'Results']);

const SETUP_CHECKLIST = [
  'Confirm the school year title',
  'Review grade levels and teacher sections (KA, KB, …)',
  'Include or exclude next-year rooms',
  'Check the rating system before surveys go out',
];

/**
 * Class Creator shell — admins get full placement loop;
 * teachers rate their class and review/feedback on shared Results.
 */
export function ClassCreatorApp({
  activeTab,
  isDarkMode,
  theme,
  schoolId: contextSchoolId,
  onSetActiveTab,
}) {
  const { session } = useAuth();
  const { org } = useDistrictOrg();
  const { selectedClass, classes } = useClasses();
  const {
    store,
    run,
    refresh,
    createPlacementRun,
    setActiveRunId,
    upsertActiveRun,
  } = useClassCreatorStore();
  const [archiveId, setArchiveId] = useState('');
  const [archiveEditing, setArchiveEditing] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [teacherFilterOptions, setTeacherFilterOptions] = useState([
    { id: 'all', label: 'All teachers' },
  ]);

  const isTeacherView = session?.role === 'teacher';
  const tab =
    isTeacherView && !TEACHER_TABS.has(activeTab) ? 'Survey Preview' : activeTab;

  useEffect(() => {
    if (tab !== 'Archive') setArchiveEditing(false);
  }, [tab]);

  const teacherClass = useMemo(() => {
    if (selectedClass?.studentList?.length) return selectedClass;
    if (!isTeacherView || !isLocalDemoSession(session)) return selectedClass;
    return (
      (classes || []).find((cls) => String(cls.id) === SHARED_DEMO_CLASS_ID) ||
      (classes || []).find((cls) => !cls.isArchived && cls.studentList?.length) ||
      selectedClass
    );
  }, [selectedClass, classes, isTeacherView, session]);

  const selectableSchools = useMemo(
    () => schoolsForClassCreatorSession(session, org, contextSchoolId),
    [session, org, contextSchoolId],
  );

  const selectedSchoolId = useMemo(() => {
    if (
      run?.schoolId &&
      selectableSchools.some((school) => school.id === run.schoolId)
    ) {
      return run.schoolId;
    }
    if (
      contextSchoolId &&
      selectableSchools.some((school) => school.id === contextSchoolId)
    ) {
      return contextSchoolId;
    }
    return selectableSchools[0]?.id || '';
  }, [run?.schoolId, selectableSchools, contextSchoolId]);

  const selectedSchool =
    selectableSchools.find((school) => school.id === selectedSchoolId) || null;

  /** Ensure active run matches the selected school (create or switch). */
  useEffect(() => {
    if (isTeacherView || !selectedSchoolId || !selectedSchool) return;
    if (run?.schoolId === selectedSchoolId) return;

    const existing = (store.runs || []).find(
      (row) => row.schoolId === selectedSchoolId,
    );
    if (existing) {
      setActiveRunId(existing.id);
      return;
    }

    createPlacementRun({
      schoolId: selectedSchoolId,
      schoolName: selectedSchool.name || '',
      yearLabel: displayPlacementYearLabel(run?.yearLabel),
      gradeBand: run?.gradeBand || 'k5',
      schema: run?.schema,
      priorityOrder: run?.priorityOrder,
    });
  }, [
    isTeacherView,
    selectedSchoolId,
    selectedSchool,
    run,
    store.runs,
    setActiveRunId,
    createPlacementRun,
  ]);

  const selectSchool = (nextId) => {
    const school = selectableSchools.find((row) => row.id === nextId);
    if (!school) return;
    const existing = (store.runs || []).find((row) => row.schoolId === nextId);
    if (existing) {
      setActiveRunId(existing.id);
      return;
    }
    createPlacementRun({
      schoolId: nextId,
      schoolName: school.name || '',
      yearLabel: displayPlacementYearLabel(run?.yearLabel),
      gradeBand: run?.gradeBand || 'k5',
      schema: run?.schema,
      priorityOrder: run?.priorityOrder,
    });
  };

  const archives = useMemo(() => {
    const rows = [...(store?.archives || [])];
    rows.sort((a, b) => String(b.archivedAt || '').localeCompare(String(a.archivedAt || '')));
    return rows;
  }, [store]);

  const selectedArchiveId =
    archives.find((row) => row.id === archiveId)?.id || archives[0]?.id || '';
  const selectedArchive =
    archives.find((row) => row.id === selectedArchiveId) || null;

  const deleteSelectedArchive = () => {
    if (!selectedArchiveId) return;
    const label = selectedArchive?.yearLabel || 'this year';
    if (!window.confirm(`Delete the archived placement list for ${label}?`)) return;
    deletePlacementArchive(selectedArchiveId);
    if (String(selectedArchiveId).startsWith('archive-mock-')) {
      try {
        localStorage.setItem(DEMO_ARCHIVE_DISMISSED_KEY, '1');
      } catch {
        /* ignore */
      }
    }
    setArchiveId('');
    setArchiveEditing(false);
    refresh();
  };

  const schoolSelect =
    !isTeacherView && selectableSchools.length ? (
      selectableSchools.length === 1 ? (
        <p
          className={`px-3 py-2 rounded-xl border text-sm ${
            isDarkMode
              ? 'border-slate-600 text-slate-200'
              : 'border-slate-300 text-slate-800 bg-white'
          }`}
        >
          {selectableSchools[0].name}
        </p>
      ) : (
        <label className="block min-w-[10rem] max-w-xs">
          <span className="sr-only">School</span>
          <select
            className={`edu-control w-full px-3 py-2 rounded-xl border text-sm ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
            value={selectedSchoolId}
            onChange={(e) => selectSchool(e.target.value)}
            aria-label="School"
          >
            {selectableSchools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </label>
      )
    ) : null;

  const getStartedAction =
    !isTeacherView && tab === 'Dashboard' ? (
      <button
        type="button"
        className={`edu-control inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
        onClick={() => setGetStartedOpen(true)}
      >
        Get Started
      </button>
    ) : null;

  const teacherFilterSelect =
    !isTeacherView && tab === 'Survey Preview' && teacherFilterOptions.length > 1 ? (
      <label className="block min-w-[10rem] max-w-xs">
        <span className="sr-only">Teacher</span>
        <select
          id="cc-ratings-teacher"
          className={`edu-control w-full px-3 py-2 rounded-xl border text-sm ${
            isDarkMode
              ? 'bg-slate-800 border-slate-600 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
          value={
            teacherFilterOptions.some((opt) => opt.id === teacherFilter)
              ? teacherFilter
              : 'all'
          }
          onChange={(e) => setTeacherFilter(e.target.value)}
          aria-label="Teacher"
        >
          {teacherFilterOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const goToSetup = () => {
    setGetStartedOpen(false);
    onSetActiveTab?.('Setup');
  };

  const archiveActions =
    tab === 'Archive' && archives.length ? (
      <div className="flex flex-wrap items-center gap-2">
        <label className="block min-w-[10rem] max-w-xs">
          <span className="sr-only">Year</span>
          <select
            className={`edu-control w-full px-3 py-2 rounded-xl border text-sm ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
            value={selectedArchiveId}
            onChange={(e) => setArchiveId(e.target.value)}
            aria-label="Archived year"
          >
            {archives.map((row) => (
              <option key={row.id} value={row.id}>
                {row.yearLabel}
                {row.schoolName ? ` · ${row.schoolName}` : ''}
              </option>
            ))}
          </select>
        </label>
        {archiveEditing ? (
          <>
            <button
              type="button"
              className={`edu-control inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${TYPE.labelLg} text-white bg-rose-600 hover:bg-rose-700`}
              onClick={deleteSelectedArchive}
            >
              <Trash2 size={16} strokeWidth={2.5} />
              Delete year
            </button>
            <button
              type="button"
              className={`edu-control inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border ${TYPE.labelLg} ${
                isDarkMode
                  ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => setArchiveEditing(false)}
            >
              <Check size={16} strokeWidth={2.5} />
              Done
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`edu-control inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
            onClick={() => setArchiveEditing(true)}
          >
            <Pencil size={16} strokeWidth={2.5} />
            Edit
          </button>
        )}
      </div>
    ) : null;

  const common = {
    theme,
    isDarkMode,
    store,
    run,
    refresh,
    createPlacementRun,
    upsertActiveRun,
    isTeacherView,
    selectedClass: teacherClass,
    session,
    selectableSchools,
    selectedSchoolId,
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title={tab === 'Setup' ? 'Class Creator Set Up' : tab || 'Class Creator'}
        isDarkMode={isDarkMode}
        actions={
          schoolSelect || archiveActions || getStartedAction || teacherFilterSelect ? (
            <div className="flex flex-wrap items-center gap-2">
              {schoolSelect}
              {teacherFilterSelect}
              {getStartedAction}
              {archiveActions}
            </div>
          ) : null
        }
      />
      {tab === 'Dashboard' ? <DashboardView {...common} /> : null}
      {!isTeacherView && tab === 'Setup' ? <SetupView {...common} /> : null}
      {tab === 'Survey Preview' ? (
        <RatingsView
          {...common}
          teacherFilter={teacherFilter}
          onTeacherFilterChange={setTeacherFilter}
          onTeacherFilterOptionsChange={setTeacherFilterOptions}
        />
      ) : null}
      {!isTeacherView && tab === 'Place' ? <PlaceView {...common} /> : null}
      {tab === 'Results' ? <ResultsView {...common} /> : null}
      {!isTeacherView && tab === 'Archive' ? (
        <ArchiveView
          {...common}
          selectedArchiveId={selectedArchiveId}
          onSelectedArchiveIdChange={setArchiveId}
        />
      ) : null}

      <Modal
        isOpen={getStartedOpen}
        title="Check your settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setGetStartedOpen(false)}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setGetStartedOpen(false)}
              className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={goToSetup}>
              Continue to Setup
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-5 sm:p-6 space-y-4">
          <p
            className={`${TYPE.bodyMd} ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Before teachers rate students, review Setup so rooms, sections, and the
            rating system match this year’s plan.
          </p>
          <ul className="space-y-2.5">
            {SETUP_CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${theme.colorPrimaryContainer}`}
                >
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    className={theme.colorOnPrimaryContainer}
                  />
                </span>
                <span
                  className={`${TYPE.bodyMd} leading-snug ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </AppPageShell>
  );
}
