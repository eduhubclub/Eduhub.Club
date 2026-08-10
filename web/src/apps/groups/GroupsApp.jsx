import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Ban,
  Check,
  Layers,
  MoreVertical,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { filterHereToday } from '../../data/attendance/todayPresence';
import { useGroupsWorkshop } from '../../data/groups/GroupsContext';
import { PageHeader } from '../../shared/PageHeader';
import { PageBackLink } from '../../shared/PageBackLink';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { APP_EMPTY_SLOT, APP_GRID_CARD, appFabStackClass } from '../../shared/layout';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { GroupsPrintSheet } from './GroupsPrintSheet';
import { GroupCard } from './GroupCard';
import { useAnnounce } from '../../shared/LiveAnnouncer';
import {
  CUSTOM_SUBJECT_VALUE,
  GROUP_SUBJECT_OPTIONS,
  defaultGroupName,
  defaultGroupNames,
  resolveGroupName,
} from './groupUtils';
import { TYPE } from '../../shared/typography';
import { studentDisplayName } from '../../data/students/displayName';

function FieldLabel({ children, isDarkMode }) {
  return (
    <label
      className={`block ${TYPE.labelMicro} mb-1.5 ${
        isDarkMode ? 'text-slate-500' : 'text-slate-400'
      }`}
    >
      {children}
    </label>
  );
}

function modalInputClass(isDarkMode, theme) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${theme.ring} ${
    isDarkMode
      ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-600 focus:border-slate-600'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-300 focus:bg-white'
  }`;
}

function FabStack({ isLeft, children }) {
  return <div className={appFabStackClass(isLeft)}>{children}</div>;
}

function SecondaryFab({ isDarkMode, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:-translate-y-0.5 ${
        isDarkMode
          ? 'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function PrimaryFab({ theme, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:-translate-y-0.5 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
    >
      {children}
    </button>
  );
}

/**
 * Edu.Groups — sort, build, pair, and save student groupings from class rosters.
 */
export function GroupsApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  onSetActiveTab,
}) {
  const announce = useAnnounce();
  const { classes, selectedClass, selectClass } = useClasses();
  const {
    savedGroupings,
    pairingPreferences,
    savePairingPreferences,
    generatedGroups,
    setGeneratedGroups,
    generatedGroupNames,
    setGeneratedGroupNames,
    currentGroupSize,
    setCurrentGroupSize,
    generateGroups,
    saveGrouping,
    toggleSavedGroupingArchived,
    updateSavedGrouping,
  } = useGroupsWorkshop();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes]
  );

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass]
  );

  const workingRoster = useMemo(
    () => filterHereToday(roster, selectedClass?.id),
    [roster, selectedClass?.id],
  );

  const outTodayCount = Math.max(0, roster.length - workingRoster.length);

  const [viewingSavedGroupingId, setViewingSavedGroupingId] = useState(null);
  /** Ensures quick-generate from Saved Groups shows Group Generator even if shell tab sync is delayed. */
  const [forceSorterView, setForceSorterView] = useState(false);
  const prevActiveTabRef = useRef(activeTab);
  const [builderGroups, setBuilderGroups] = useState([]);
  const [builderGroupNames, setBuilderGroupNames] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [draggedStudent, setDraggedStudent] = useState(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSize, setCustomSize] = useState('');

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveGroupName, setSaveGroupName] = useState('');
  const [saveSubjectChoice, setSaveSubjectChoice] = useState('');
  const [saveSubjectCustom, setSaveSubjectCustom] = useState('');
  const [saveGroupLabels, setSaveGroupLabels] = useState([]);
  const [openSavedCardMenu, setOpenSavedCardMenu] = useState(null);
  const [savedSubjectFilter, setSavedSubjectFilter] = useState('All');

  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [selectedStudentForPairing, setSelectedStudentForPairing] = useState(null);
  const [localTogether, setLocalTogether] = useState([]);
  const [localSeparate, setLocalSeparate] = useState([]);

  // Reset local Groups UI when the selected class changes (shared workshop
  // generated groups are cleared in GroupsProvider).
  const prevClassIdRef = useRef(selectedClass?.id);
  const builderGroupsRef = useRef(builderGroups);
  builderGroupsRef.current = builderGroups;

  useEffect(() => {
    const roster = selectedClass?.studentList || [];
    if (prevClassIdRef.current !== selectedClass?.id) {
      prevClassIdRef.current = selectedClass?.id;
      setViewingSavedGroupingId(null);
      setForceSorterView(false);
      setOpenSavedCardMenu(null);
      setBuilderGroups([]);
      setBuilderGroupNames([]);
      setUnassignedStudents([...roster]);
      setDraggedStudent(null);
      return;
    }
    // Same class, roster edited — keep group placements; refresh objects; no duplicates.
    const byId = new Map(roster.map((s) => [s.id, s]));
    const nextGroups = builderGroupsRef.current.map((group) =>
      group.map((s) => byId.get(s.id)).filter(Boolean),
    );
    const assignedIds = new Set(nextGroups.flatMap((g) => g.map((s) => s.id)));
    setBuilderGroups(nextGroups);
    setUnassignedStudents(roster.filter((s) => !assignedIds.has(s.id)));
  }, [selectedClass?.id, selectedClass?.studentList]);

  // Drop forced sorter view once the shell tab catches up, or when the user
  // navigates away from Group Generator via the sidebar.
  useEffect(() => {
    const prev = prevActiveTabRef.current;
    prevActiveTabRef.current = activeTab;
    if (activeTab === 'Group Generator') {
      setForceSorterView(false);
    } else if (prev === 'Group Generator' && activeTab !== 'Group Generator') {
      setForceSorterView(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'Saved Groups' && activeTab !== 'Archive') {
      setViewingSavedGroupingId(null);
    }
    setOpenSavedCardMenu(null);
  }, [activeTab]);

  useEffect(() => {
    if (!viewingSavedGroupingId) return;
    updateSavedGrouping(viewingSavedGroupingId, {
      groups: generatedGroups,
      groupNames: generatedGroupNames,
    });
  }, [generatedGroups, generatedGroupNames, viewingSavedGroupingId, updateSavedGrouping]);

  const goToTab = (name) => {
    if (typeof onSetActiveTab === 'function') onSetActiveTab(name);
  };

  const showGroupSorter = activeTab === 'Group Generator' || forceSorterView;
  const showSavedGroups = activeTab === 'Saved Groups' && !forceSorterView;
  const showArchive = activeTab === 'Archive' && !forceSorterView;
  const showCreateGroups = activeTab === 'Create Groups' && !forceSorterView;
  const showPairings = activeTab === 'Pairings' && !forceSorterView;
  const isBrowsingSavedList = showSavedGroups || showArchive;
  const isEditingSavedGrouping = isBrowsingSavedList && viewingSavedGroupingId !== null;
  const viewingSavedGrouping = isEditingSavedGrouping
    ? savedGroupings.find((saved) => saved.id === viewingSavedGroupingId)
    : null;
  const listSavedGroupings = useMemo(
    () =>
      savedGroupings.filter((saved) =>
        showArchive ? saved.isArchived : !saved.isArchived
      ),
    [savedGroupings, showArchive]
  );
  const savedSubjectOptions = useMemo(() => {
    const names = new Set();
    for (const saved of listSavedGroupings) {
      const subject = (saved.subject || '').trim();
      if (subject) names.add(subject);
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [listSavedGroupings]);
  const visibleSavedGroupings = useMemo(() => {
    const filtered =
      savedSubjectFilter === 'All'
        ? listSavedGroupings
        : listSavedGroupings.filter(
            (saved) => (saved.subject || '').trim() === savedSubjectFilter
          );
    return [...filtered].sort((a, b) => {
      const sa = (a.subject || '').trim();
      const sb = (b.subject || '').trim();
      if (sa && sb && sa !== sb) return sa.localeCompare(sb);
      if (sa && !sb) return -1;
      if (!sa && sb) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [listSavedGroupings, savedSubjectFilter]);

  useEffect(() => {
    if (!savedSubjectOptions.includes(savedSubjectFilter)) {
      setSavedSubjectFilter('All');
    }
  }, [savedSubjectOptions, savedSubjectFilter]);
  const showGeneratedGroupsEditor =
    (showGroupSorter || isEditingSavedGrouping) && roster.length > 0;

  const viewTitle = forceSorterView
    ? 'Group Generator'
    : isEditingSavedGrouping && viewingSavedGrouping
      ? viewingSavedGrouping.name
      : showArchive
        ? 'Archived Groups'
        : activeTab || 'Groups';
  const tabDescription = !selectedClass
    ? 'Choose a class from the sidebar to get started.'
    : showCreateGroups
      ? 'Drag students into boxes to build groups by hand.'
      : showPairings
        ? 'Set who should work together or apart.'
        : isEditingSavedGrouping
          ? 'Drag students between groups to adjust this saved arrangement.'
          : showArchive
            ? 'View and restore archived group arrangements.'
            : showSavedGroups
              ? 'Reopen groupings you saved for this class.'
              : 'Generate quick groups, then drag students between them.';

  const printGroups = showCreateGroups ? builderGroups : generatedGroups;
  const printGroupNames = showCreateGroups ? builderGroupNames : generatedGroupNames;
  const printUnassigned = showCreateGroups ? unassignedStudents : [];
  const printTitle = showCreateGroups
    ? 'Group Builder'
    : isEditingSavedGrouping && viewingSavedGrouping
      ? viewingSavedGrouping.name
      : 'Quick Groups';

  const handlePrint = () => {
    if (!printGroups.length) return;
    window.print();
  };

  const resolveSaveSubject = () => {
    if (saveSubjectChoice === CUSTOM_SUBJECT_VALUE) {
      return saveSubjectCustom.trim();
    }
    return (saveSubjectChoice || '').trim();
  };

  const openSaveModal = () => {
    const groups = showCreateGroups ? builderGroups : generatedGroups;
    const names = showCreateGroups ? builderGroupNames : generatedGroupNames;
    setSaveGroupLabels(
      groups.map((_, i) => resolveGroupName(names, i))
    );
    setSaveGroupName('');
    setSaveSubjectChoice('');
    setSaveSubjectCustom('');
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
    setSaveGroupName('');
    setSaveSubjectChoice('');
    setSaveSubjectCustom('');
    setSaveGroupLabels([]);
  };

  const handleDragStart = (_e, student, sourceIndex) => {
    setDraggedStudent({ student, sourceIndex });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedStudent) return;

    const { student, sourceIndex } = draggedStudent;
    if (sourceIndex === targetIndex) {
      setDraggedStudent(null);
      return;
    }

    if (showCreateGroups) {
      let newUnassigned = [...unassignedStudents];
      let newGroups = builderGroups.map((g) => [...g]);

      if (sourceIndex === -1) {
        newUnassigned = newUnassigned.filter((s) => s.id !== student.id);
      } else {
        newGroups[sourceIndex] = newGroups[sourceIndex].filter((s) => s.id !== student.id);
      }

      if (targetIndex === -1) {
        newUnassigned.push(student);
      } else {
        newGroups[targetIndex] = [...newGroups[targetIndex], student];
      }

      setUnassignedStudents(newUnassigned);
      setBuilderGroups(newGroups);
    } else if (showGroupSorter || isEditingSavedGrouping) {
      const newGroups = generatedGroups.map((g) => [...g]);
      if (sourceIndex >= 0) {
        newGroups[sourceIndex] = newGroups[sourceIndex].filter((s) => s.id !== student.id);
      }
      if (targetIndex >= 0) {
        newGroups[targetIndex] = [...newGroups[targetIndex], student];
      }
      setGeneratedGroups(newGroups);
    }

    setDraggedStudent(null);
  };

  const handleCreateGroups = (size) => {
    const n = Number(size);
    if (!Number.isFinite(n) || n < 1) return;

    if (showCreateGroups) {
      setBuilderGroups(Array.from({ length: n }, () => []));
      setBuilderGroupNames(defaultGroupNames(n));
      setUnassignedStudents([...workingRoster]);
      announce(`Ready to fill ${n} groups`);
    } else {
      if (!workingRoster.length) return;
      const created = generateGroups(workingRoster, n);
      if (!created) return;
      setViewingSavedGroupingId(null);
      setForceSorterView(true);
      goToTab('Group Generator');
      announce(`Created ${created.length} groups`);
    }

    setIsGroupModalOpen(false);
    setShowCustomInput(false);
    setCustomSize('');
  };

  const handleRefreshGroups = () => {
    const inferredSize = generatedGroups.length
      ? Math.max(...generatedGroups.map((group) => group.length))
      : null;
    const size = currentGroupSize || inferredSize;

    if (size && size > 0) {
      handleCreateGroups(size);
      return;
    }

    setShowCustomInput(false);
    setCustomSize('');
    setIsGroupModalOpen(true);
  };

  const handleSaveGrouping = () => {
    if (!saveGroupName.trim()) return;
    const sourceGroups = showCreateGroups ? builderGroups : generatedGroups;
    const labels = sourceGroups.map((_, i) =>
      (saveGroupLabels[i] || '').trim() || defaultGroupName(i)
    );

    if (showCreateGroups) {
      setBuilderGroupNames(labels);
    } else {
      setGeneratedGroupNames(labels);
    }

    saveGrouping({
      name: saveGroupName.trim(),
      subject: resolveSaveSubject(),
      groups: sourceGroups,
      groupNames: labels,
      unassigned: showCreateGroups ? unassignedStudents : [],
      classId: selectedClass?.id,
    });
    closeSaveModal();
    setForceSorterView(false);
    setViewingSavedGroupingId(null);
    setSavedSubjectFilter('All');
    goToTab('Saved Groups');
  };

  const handleToggleSavedArchived = (id) => {
    toggleSavedGroupingArchived(id);
    setOpenSavedCardMenu(null);
    if (viewingSavedGroupingId === id) {
      setViewingSavedGroupingId(null);
      setGeneratedGroups([]);
      setGeneratedGroupNames([]);
    }
  };

  const handleOpenPairingModal = (student) => {
    setSelectedStudentForPairing(student);
    setLocalTogether(pairingPreferences[student.id]?.together || []);
    setLocalSeparate(pairingPreferences[student.id]?.separate || []);
    setIsPairingModalOpen(true);
  };

  const handleSavePairingPreferences = () => {
    if (selectedStudentForPairing) {
      const rosterIds = new Set(roster.map((s) => s.id));
      savePairingPreferences(
        selectedStudentForPairing.id,
        localTogether,
        localSeparate,
        rosterIds
      );
    }
    setIsPairingModalOpen(false);
    setSelectedStudentForPairing(null);
  };

  const toggleTogether = (id) => {
    if (localTogether.includes(id)) {
      setLocalTogether((prev) => prev.filter((i) => i !== id));
    } else {
      setLocalTogether((prev) => [...prev, id]);
      setLocalSeparate((prev) => prev.filter((i) => i !== id));
    }
  };

  const toggleSeparate = (id) => {
    if (localSeparate.includes(id)) {
      setLocalSeparate((prev) => prev.filter((i) => i !== id));
    } else {
      setLocalSeparate((prev) => [...prev, id]);
      setLocalTogether((prev) => prev.filter((i) => i !== id));
    }
  };

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Groups"
          description="Sort and build student groups from your class rosters."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
        />
      </AppPageShell>
    );
  }

  return (
    <>
      <GroupsPrintSheet
        title={printTitle}
        className={selectedClass?.name || ''}
        groups={printGroups}
        groupNames={printGroupNames}
        unassigned={printUnassigned}
        theme={theme}
      />

      <AppPageShell variant="scroll" className="print:hidden">
      {outTodayCount > 0 ? (
        <p
          className={`mb-3 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodySm} ${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`}
        >
          {outTodayCount} student{outTodayCount === 1 ? '' : 's'} marked out
          today in Attendance — new groups use students who are here.
        </p>
      ) : null}
      {isEditingSavedGrouping ? (
        <PageBackLink
          label={showArchive ? 'Back to Archive' : 'Back to Saved Groups'}
          isDarkMode={isDarkMode}
          onClick={() => {
            setViewingSavedGroupingId(null);
            setGeneratedGroups([]);
            setGeneratedGroupNames([]);
          }}
        />
      ) : null}
      <PageHeader
        title={viewTitle}
        description={tabDescription}
        isDarkMode={isDarkMode}
      />

      {!roster.length && activeTab !== 'Saved Groups' ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="This class has no students yet. Add students in Edu.Classes."
        />
      ) : null}

      {showPairings && roster.length > 0 ? (
        <div className={`${APP_GRID_CARD} overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}>
          {roster.map((student, index) => {
            const prefs = pairingPreferences[student.id];
            const hasPrefs =
              prefs && (prefs.together.length > 0 || prefs.separate.length > 0);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => handleOpenPairingModal(student)}
                className={`w-full flex items-center p-4 text-left transition-colors ${
                  index !== roster.length - 1
                    ? isDarkMode
                      ? 'border-b border-slate-700/50'
                      : 'border-b border-slate-50'
                    : ''
                } ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
              >
                <StudentAvatar
                  student={student}
                  theme={theme}
                  size="sm"
                  isDarkMode={isDarkMode}
                />
                <span
                  className={`font-semibold text-base flex-1 ml-4 ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {studentDisplayName(student)}
                </span>
                {hasPrefs ? (
                  <div className="flex gap-2 mr-1">
                    {prefs.together.length > 0 ? (
                      <span className={`${TYPE.labelMicro} bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md`}>
                        {prefs.together.length} Together
                      </span>
                    ) : null}
                    {prefs.separate.length > 0 ? (
                      <span className={`${TYPE.labelMicro} bg-rose-100 text-rose-700 px-2 py-1 rounded-md`}>
                        {prefs.separate.length} Apart
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {isBrowsingSavedList && !isEditingSavedGrouping ? (
        listSavedGroupings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-slate-400 opacity-70 print:hidden">
            <Archive size={64} className="mb-4" />
            <h2 className={TYPE.titleLg}>
              {showArchive ? 'No Archived Groups' : 'No Saved Groups'}
            </h2>
            <p className={`${TYPE.bodyMd} mt-1`}>
              {showArchive
                ? 'Archived group arrangements will show up here.'
                : 'Create and save a group arrangement to see it here.'}
            </p>
          </div>
        ) : (
          <>
            {savedSubjectOptions.length > 1 ? (
              <div className="flex flex-wrap gap-2 mb-5 print:hidden">
                {savedSubjectOptions.map((subject) => {
                  const active = savedSubjectFilter === subject;
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => setSavedSubjectFilter(subject)}
                      className={`px-3 py-1.5 rounded-xl ${TYPE.labelMd} transition-colors border ${
                        active
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                          : isDarkMode
                            ? 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {subject}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {visibleSavedGroupings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-10 text-slate-400 opacity-70 print:hidden">
                <h2 className={TYPE.titleMd}>No groups for this subject</h2>
                <p className={`${TYPE.bodyMd} mt-1`}>Try another subject filter, or save a new grouping.</p>
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleSavedGroupings.map((saved) => (
              <div
                key={saved.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setGeneratedGroups(saved.groups);
                  setGeneratedGroupNames(
                    saved.groupNames?.length === saved.groups.length
                      ? saved.groupNames
                      : defaultGroupNames(saved.groups.length)
                  );
                  setViewingSavedGroupingId(saved.id);
                  setCurrentGroupSize(null);
                  setOpenSavedCardMenu(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                className={`relative ${APP_GRID_CARD} p-5 text-left transition-all cursor-pointer ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className={`${TYPE.titleMd} min-w-0 ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {saved.name}
                  </h3>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSavedCardMenu(
                          openSavedCardMenu === saved.id ? null : saved.id
                        );
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      aria-label="Saved group options"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openSavedCardMenu === saved.id ? (
                      <div
                        className={`absolute right-0 top-full mt-1 w-40 z-50 rounded-xl shadow-lg border overflow-hidden ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-600'
                            : 'bg-white border-slate-300'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSavedArchived(saved.id);
                            }}
                            className={`w-full text-left px-3 py-2 ${TYPE.titleSm} rounded-lg flex items-center transition-colors ${
                              isDarkMode
                                ? 'hover:bg-slate-700 text-slate-300'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Archive size={16} className="mr-2" />
                            {saved.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <p
                  className={`${TYPE.bodyMd} mb-4 flex flex-wrap items-center gap-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span>{saved.groups.length} Groups</span>
                  {saved.subject ? (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg ${TYPE.labelMicro} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                    >
                      {saved.subject}
                    </span>
                  ) : null}
                </p>
                <div className="flex -space-x-2 overflow-hidden">
                  {saved.groups
                    .flat()
                    .slice(0, 8)
                    .map((student, i) => (
                      <div key={`${student.id}-${i}`} className="relative">
                        <StudentAvatar
                          student={student}
                          theme={theme}
                          size="sm"
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    ))}
                  {saved.groups.flat().length > 8 ? (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${TYPE.labelMd} border-2 ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-900 text-slate-400'
                          : 'bg-slate-100 border-white text-slate-500'
                      }`}
                    >
                      +{saved.groups.flat().length - 8}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )
      ) : null}

      {showGeneratedGroupsEditor ? (
        showGroupSorter && generatedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-slate-400 opacity-70 print:hidden">
            <Users size={64} className="mb-4" />
            <h2 className={TYPE.titleLg}>No Groups Generated</h2>
            <p className={`${TYPE.bodyMd} mt-1`}>Click the + button below to create quick student groups.</p>
          </div>
        ) : generatedGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedGroups.map((group, index) => (
              <GroupCard
                key={index}
                title={resolveGroupName(generatedGroupNames, index)}
                students={group}
                isDarkMode={isDarkMode}
                theme={theme}
                draggedStudent={draggedStudent}
                index={index}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        ) : null
      ) : null}

      {showCreateGroups && roster.length > 0 ? (
        <>
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, -1)}
            className={`mb-4 rounded-xl transition-colors print:hidden ${
              draggedStudent && draggedStudent.sourceIndex !== -1
                ? isDarkMode
                  ? 'bg-slate-800/40'
                  : 'bg-slate-100/80'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h3
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Unassigned Students
                </h3>
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                >
                  {unassignedStudents.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBuilderGroups((prev) => [...prev, []]);
                  setBuilderGroupNames((prev) => [...prev, defaultGroupName(prev.length)]);
                }}
                className={`flex items-center px-2.5 py-1 rounded-lg ${TYPE.labelMd} transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Plus size={14} className="mr-1" strokeWidth={3} /> Add Group
              </button>
            </div>
            <div className="flex flex-wrap content-start gap-1.5 max-h-[7.5rem] overflow-y-auto min-h-[2rem]">
              {unassignedStudents.length === 0 ? (
                <div className={`w-full flex items-center justify-center text-slate-400 italic ${TYPE.bodySm} py-2`}>
                  All students are assigned. Drag students here to remove them from a group.
                </div>
              ) : (
                unassignedStudents.map((student) => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, student, -1)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full cursor-grab active:cursor-grabbing border transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <StudentAvatar
                      student={student}
                      theme={theme}
                      size="xs"
                      isDarkMode={isDarkMode}
                    />
                    <span className={`${TYPE.labelMd} whitespace-nowrap`}>{studentDisplayName(student)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {builderGroups.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-12 text-slate-400 opacity-70 ${APP_EMPTY_SLOT} print:hidden ${
                isDarkMode ? 'border-slate-700' : 'border-slate-300'
              }`}
            >
              <Layers size={48} className="mb-4" />
              <p className={TYPE.titleSm}>
                Click &quot;Add Group&quot; or the + button to create group containers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {builderGroups.map((group, index) => (
                <GroupCard
                  key={index}
                  title={resolveGroupName(builderGroupNames, index)}
                  students={group}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  draggedStudent={draggedStudent}
                  index={index}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragStart={handleDragStart}
                  headerAction={
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors print:hidden"
                      onClick={() => {
                        const updated = [...builderGroups];
                        const removed = updated.splice(index, 1)[0] || [];
                        setBuilderGroups(updated);
                        setBuilderGroupNames((prev) => {
                          const next = [...prev];
                          next.splice(index, 1);
                          return next;
                        });
                        setUnassignedStudents((prev) => [...prev, ...removed]);
                      }}
                      aria-label={`Remove ${resolveGroupName(builderGroupNames, index)}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </>
      ) : null}

      {showGroupSorter ? (
        <FabStack isLeft={isLeft}>
          {generatedGroups.length > 0 ? (
            <>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={handlePrint}
                title="Print Groups"
              >
                <Printer size={24} strokeWidth={2.5} />
              </SecondaryFab>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={handleRefreshGroups}
                title="Reshuffle Groups"
              >
                <RefreshCw size={24} strokeWidth={2.5} />
              </SecondaryFab>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={openSaveModal}
                title="Save Groups"
              >
                <Save size={24} strokeWidth={2.5} />
              </SecondaryFab>
            </>
          ) : null}
          <PrimaryFab
            theme={theme}
            onClick={() => setIsGroupModalOpen(true)}
            title="Create New Group"
          >
            <Plus size={28} strokeWidth={2.5} />
          </PrimaryFab>
        </FabStack>
      ) : null}

      {showCreateGroups ? (
        <FabStack isLeft={isLeft}>
          {builderGroups.length > 0 ? (
            <>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={handlePrint}
                title="Print Groups"
              >
                <Printer size={24} strokeWidth={2.5} />
              </SecondaryFab>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={openSaveModal}
                title="Save Groups"
              >
                <Save size={24} strokeWidth={2.5} />
              </SecondaryFab>
            </>
          ) : null}
          <PrimaryFab
            theme={theme}
            onClick={() => setIsGroupModalOpen(true)}
            title="Setup Boxes"
          >
            <Plus size={28} strokeWidth={2.5} />
          </PrimaryFab>
        </FabStack>
      ) : null}

      {showSavedGroups ? (
        <FabStack isLeft={isLeft}>
          {isEditingSavedGrouping && generatedGroups.length > 0 ? (
            <SecondaryFab
              isDarkMode={isDarkMode}
              onClick={handlePrint}
              title="Print Groups"
            >
              <Printer size={24} strokeWidth={2.5} />
            </SecondaryFab>
          ) : null}
          {!isEditingSavedGrouping ? (
            <PrimaryFab
              theme={theme}
              onClick={() => setIsGroupModalOpen(true)}
              title="Add Saved Group"
            >
              <Plus size={28} strokeWidth={2.5} />
            </PrimaryFab>
          ) : null}
        </FabStack>
      ) : null}

      {showArchive && isEditingSavedGrouping && generatedGroups.length > 0 ? (
        <FabStack isLeft={isLeft}>
          <SecondaryFab
            isDarkMode={isDarkMode}
            onClick={handlePrint}
            title="Print Groups"
          >
            <Printer size={24} strokeWidth={2.5} />
          </SecondaryFab>
        </FabStack>
      ) : null}

      <Modal
        isOpen={isGroupModalOpen}
        title={activeTab === 'Create Groups' ? 'Add Empty Boxes' : 'Create Groups'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => {
          setIsGroupModalOpen(false);
          setShowCustomInput(false);
          setCustomSize('');
        }}
        maxWidth="max-w-sm"
      >
        <div className="p-6">
          <p className={`${TYPE.bodyMd} mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {activeTab === 'Create Groups'
              ? 'How many empty boxes do you need?'
              : 'How many students in each group?'}
          </p>

          {!showCustomInput ? (
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleCreateGroups(num)}
                  className={`py-4 rounded-xl font-bold text-xl transition-all border-2 border-transparent ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-200 hover:border-slate-600'
                      : 'bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className={`flex items-center justify-center py-4 rounded-xl transition-all border-2 border-transparent ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                    : 'bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                }`}
                title="Custom group size"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="number"
                min="2"
                placeholder="Enter size..."
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                autoFocus
                className={`w-full p-4 rounded-xl border-2 text-center font-bold text-xl outline-none transition-all focus:ring-2 ${theme.ring} ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white focus:border-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-300 focus:bg-white'
                }`}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className={`flex-1 py-3.5 rounded-xl ${TYPE.labelLg} transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateGroups(parseInt(customSize, 10))}
                  disabled={!customSize || Number.isNaN(parseInt(customSize, 10)) || parseInt(customSize, 10) < 2}
                  className={`flex-1 py-3.5 rounded-xl ${TYPE.labelLg} transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isSaveModalOpen}
        title="Save Groups"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={closeSaveModal}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={closeSaveModal}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              disabled={!saveGroupName.trim()}
              onClick={handleSaveGrouping}
            >
              Save
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <div className={`pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Grouping details
            </p>
            <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Name this set, pick a subject, and optionally label each group.
            </p>
          </div>

          <div>
            <FieldLabel isDarkMode={isDarkMode}>Grouping name</FieldLabel>
            <input
              type="text"
              placeholder="e.g. Science Project Groups"
              value={saveGroupName}
              onChange={(e) => setSaveGroupName(e.target.value)}
              autoFocus
              className={modalInputClass(isDarkMode, theme)}
            />
          </div>

          <div>
            <FieldLabel isDarkMode={isDarkMode}>Subject</FieldLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {GROUP_SUBJECT_OPTIONS.map((subject) => {
                const active = saveSubjectChoice === subject;
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => {
                      setSaveSubjectChoice(subject);
                      setSaveSubjectCustom('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors border ${
                      active
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                        : isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSaveSubjectChoice(CUSTOM_SUBJECT_VALUE)}
                className={`px-2.5 py-1.5 rounded-lg ${TYPE.labelMd} transition-colors border ${
                  saveSubjectChoice === CUSTOM_SUBJECT_VALUE
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Custom
              </button>
            </div>
            {saveSubjectChoice === CUSTOM_SUBJECT_VALUE ? (
              <input
                type="text"
                placeholder="e.g. Word Work, Guided Reading"
                value={saveSubjectCustom}
                onChange={(e) => setSaveSubjectCustom(e.target.value)}
                className={modalInputClass(isDarkMode, theme)}
              />
            ) : null}
          </div>

          {saveGroupLabels.length > 0 ? (
            <div>
              <FieldLabel isDarkMode={isDarkMode}>Name groups</FieldLabel>
              <div className="space-y-2">
                {saveGroupLabels.map((label, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${TYPE.labelMd} tabular-nums shrink-0 border ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-slate-300'
                          : 'bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={label}
                      placeholder={defaultGroupName(index)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSaveGroupLabels((prev) =>
                          prev.map((name, i) => (i === index ? value : name))
                        );
                      }}
                      className={`min-w-0 flex-1 ${modalInputClass(isDarkMode, theme).replace('w-full ', '')}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={isPairingModalOpen && Boolean(selectedStudentForPairing)}
        title="Pairing Preferences"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => {
          setIsPairingModalOpen(false);
          setSelectedStudentForPairing(null);
        }}
        maxWidth="max-w-lg"
        headerStart={
          selectedStudentForPairing ? (
            <StudentAvatar
              student={selectedStudentForPairing}
              theme={theme}
              size="sm"
              isDarkMode={isDarkMode}
            />
          ) : null
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsPairingModalOpen(false);
                setSelectedStudentForPairing(null);
              }}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePairingPreferences}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              Save Preferences
            </button>
          </>
        }
      >
        <div className="p-2">
          <p className={`px-3 pb-2 ${TYPE.bodyMd} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {selectedStudentForPairing?.name}
          </p>
          {roster
            .filter((s) => s.id !== selectedStudentForPairing?.id)
            .map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 my-1 rounded-xl transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StudentAvatar
                    student={student}
                    theme={theme}
                    size="sm"
                    isDarkMode={isDarkMode}
                  />
                  <span
                    className={`${TYPE.titleSm} truncate ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {studentDisplayName(student)}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleTogether(student.id)}
                    className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} flex items-center transition-colors border ${
                      localTogether.includes(student.id)
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'
                          : 'bg-white border-slate-300 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Check size={12} className="mr-1.5" strokeWidth={3} /> Pair
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSeparate(student.id)}
                    className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} flex items-center transition-colors border ${
                      localSeparate.includes(student.id)
                        ? 'bg-rose-500 border-rose-600 text-white shadow-sm'
                        : isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200'
                          : 'bg-white border-slate-300 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Ban size={12} className="mr-1.5" strokeWidth={3} /> Separate
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </AppPageShell>
    </>
  );
}
