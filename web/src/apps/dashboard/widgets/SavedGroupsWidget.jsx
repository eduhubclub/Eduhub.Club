import { useEffect, useMemo, useState } from 'react';
import { Archive, MoreVertical, Printer, Save, Users } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { useGroupsWorkshop } from '../../../data/groups/GroupsContext';
import { EmptyState } from '../../../shared/EmptyState';
import { PageBackLink } from '../../../shared/PageBackLink';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { GroupCard } from '../../groups/GroupCard';
import { GroupsPrintSheet } from '../../groups/GroupsPrintSheet';
import { AppPageShell } from '../../../shared/AppPageShell';
import { APP_GRID_CARD, appFabStackClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import {
  defaultGroupNames,
  resolveGroupName,
} from '../../groups/groupUtils';

/**
 * Dashboard teaching widget — Saved Groups.
 */
export function SavedGroupsWidget({ isDarkMode, theme, isLeft }) {
  const { selectedClass } = useClasses();
  const {
    savedGroupings,
    generatedGroups,
    setGeneratedGroups,
    generatedGroupNames,
    setGeneratedGroupNames,
    toggleSavedGroupingArchived,
    updateSavedGrouping,
  } = useGroupsWorkshop();

  const [viewingId, setViewingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [draggedStudent, setDraggedStudent] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');

  const classSaved = useMemo(
    () =>
      savedGroupings.filter(
        (saved) =>
          !saved.isArchived &&
          (!selectedClass?.id || saved.classId === selectedClass.id)
      ),
    [savedGroupings, selectedClass?.id]
  );

  const subjectOptions = useMemo(() => {
    const names = new Set();
    for (const saved of classSaved) {
      const subject = (saved.subject || '').trim();
      if (subject) names.add(subject);
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [classSaved]);

  const visibleSaved = useMemo(() => {
    const filtered =
      subjectFilter === 'All'
        ? classSaved
        : classSaved.filter((saved) => (saved.subject || '').trim() === subjectFilter);
    return [...filtered].sort((a, b) => {
      const sa = (a.subject || '').trim();
      const sb = (b.subject || '').trim();
      if (sa && sb && sa !== sb) return sa.localeCompare(sb);
      if (sa && !sb) return -1;
      if (!sa && sb) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [classSaved, subjectFilter]);

  useEffect(() => {
    if (!subjectOptions.includes(subjectFilter)) setSubjectFilter('All');
  }, [subjectOptions, subjectFilter]);

  const viewing = useMemo(
    () => (viewingId ? savedGroupings.find((s) => s.id === viewingId) : null),
    [savedGroupings, viewingId]
  );

  useEffect(() => {
    setViewingId(null);
    setOpenMenuId(null);
    setDraggedStudent(null);
  }, [selectedClass?.id]);

  useEffect(() => {
    if (!viewingId) return;
    updateSavedGrouping(viewingId, {
      groups: generatedGroups,
      groupNames: generatedGroupNames,
    });
  }, [generatedGroups, generatedGroupNames, viewingId, updateSavedGrouping]);

  const openSaved = (saved) => {
    setGeneratedGroups(saved.groups);
    setGeneratedGroupNames(
      saved.groupNames?.length === saved.groups.length
        ? saved.groupNames
        : defaultGroupNames(saved.groups.length)
    );
    setViewingId(saved.id);
    setOpenMenuId(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedStudent) return;
    const { student, sourceIndex } = draggedStudent;
    if (sourceIndex === targetIndex) {
      setDraggedStudent(null);
      return;
    }
    const newGroups = generatedGroups.map((g) => [...g]);
    if (sourceIndex >= 0) {
      newGroups[sourceIndex] = newGroups[sourceIndex].filter((s) => s.id !== student.id);
    }
    if (targetIndex >= 0) {
      newGroups[targetIndex] = [...newGroups[targetIndex], student];
    }
    setGeneratedGroups(newGroups);
    setDraggedStudent(null);
  };

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to view saved groups."
        isDarkMode={isDarkMode}
        illustration={<Save size={36} className="text-slate-400" />}
      />
    );
  }

  return (
    <>
      {viewing ? (
        <GroupsPrintSheet
          title={viewing.name}
          className={selectedClass?.name || ''}
          groups={generatedGroups}
          groupNames={generatedGroupNames}
          theme={theme}
        />
      ) : null}

      <AppPageShell variant="scroll" className="relative w-full min-h-[60vh] print:hidden">
        {viewing ? (
          <PageBackLink
            label="Back to Saved Groups"
            isDarkMode={isDarkMode}
            onClick={() => {
              setViewingId(null);
              setGeneratedGroups([]);
              setGeneratedGroupNames([]);
            }}
          />
        ) : null}

        <PageHeader
          title={viewing ? viewing.name : 'Saved Groups'}
          description={
            viewing
              ? 'Drag students between groups to adjust this saved arrangement.'
              : 'Reopen groupings you saved for this class.'
          }
          isDarkMode={isDarkMode}
        />

        {!viewing ? (
          classSaved.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-slate-400 opacity-70">
              <Archive size={64} className="mb-4" />
              <h2 className={TYPE.titleLg}>No Saved Groups</h2>
              <p className={`${TYPE.bodyMd} mt-1`}>
                Save a grouping from Group Generator to see it here.
              </p>
            </div>
          ) : (
            <>
              {subjectOptions.length > 1 ? (
                <div className="flex flex-wrap gap-2 mb-5">
                  {subjectOptions.map((subject) => {
                    const active = subjectFilter === subject;
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setSubjectFilter(subject)}
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
              {visibleSaved.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-10 text-slate-400 opacity-70">
                  <h2 className={TYPE.titleMd}>No groups for this subject</h2>
                  <p className={`${TYPE.bodyMd} mt-1`}>Try another subject filter.</p>
                </div>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSaved.map((saved) => (
                <div
                  key={saved.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openSaved(saved)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openSaved(saved);
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
                          setOpenMenuId(openMenuId === saved.id ? null : saved.id);
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
                      {openMenuId === saved.id ? (
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
                                toggleSavedGroupingArchived(saved.id);
                                setOpenMenuId(null);
                              }}
                              className={`w-full text-left px-3 py-2 ${TYPE.titleSm} rounded-lg flex items-center transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-slate-700 text-slate-300'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Archive size={16} className="mr-2" />
                              Archive
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
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
        ) : generatedGroups.length === 0 ? (
          <EmptyState
            message="This saved grouping has no groups."
            isDarkMode={isDarkMode}
            illustration={<Users size={36} className="text-slate-400" />}
          />
        ) : (
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
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onDragStart={(_e, student, sourceIndex) =>
                  setDraggedStudent({ student, sourceIndex })
                }
              />
            ))}
          </div>
        )}

        {viewing && generatedGroups.length > 0 ? (
          <div className={appFabStackClass(isLeft)}>
            <button
              type="button"
              onClick={() => window.print()}
              title="Print Groups"
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:-translate-y-0.5 ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Printer size={24} strokeWidth={2.5} />
            </button>
          </div>
        ) : null}
      </AppPageShell>
    </>
  );
}
