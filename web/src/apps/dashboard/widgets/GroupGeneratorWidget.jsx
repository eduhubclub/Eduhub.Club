import { useEffect, useMemo, useState } from 'react';
import { Plus, Printer, RefreshCw, Save, Users } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { useGroupsWorkshop } from '../../../data/groups/GroupsContext';
import { EmptyState } from '../../../shared/EmptyState';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PageHeader } from '../../../shared/PageHeader';
import { GroupCard } from '../../groups/GroupCard';
import { GroupsPrintSheet } from '../../groups/GroupsPrintSheet';
import { AppPageShell } from '../../../shared/AppPageShell';
import {
  CUSTOM_SUBJECT_VALUE,
  GROUP_SUBJECT_OPTIONS,
  defaultGroupName,
  resolveGroupName,
} from '../../groups/groupUtils';
import { appFabStackClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

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
 * Dashboard teaching widget — Group Generator.
 */
export function GroupGeneratorWidget({ isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const { selectedClass } = useClasses();
  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass]
  );
  const {
    pairingPreferences,
    generatedGroups,
    setGeneratedGroups,
    generatedGroupNames,
    setGeneratedGroupNames,
    currentGroupSize,
    generateGroups,
    saveGrouping,
  } = useGroupsWorkshop();

  const [draggedStudent, setDraggedStudent] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSize, setCustomSize] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveGroupName, setSaveGroupName] = useState('');
  const [saveSubjectChoice, setSaveSubjectChoice] = useState('');
  const [saveSubjectCustom, setSaveSubjectCustom] = useState('');
  const [saveGroupLabels, setSaveGroupLabels] = useState([]);

  useEffect(() => {
    setDraggedStudent(null);
  }, [selectedClass?.id]);

  const handleCreateGroups = (size) => {
    const created = generateGroups(roster, size);
    if (!created) return;
    setIsGroupModalOpen(false);
    setShowCustomInput(false);
    setCustomSize('');
    announce(`Created ${created.length} groups`);
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

  const resolveSaveSubject = () => {
    if (saveSubjectChoice === CUSTOM_SUBJECT_VALUE) {
      return saveSubjectCustom.trim();
    }
    return (saveSubjectChoice || '').trim();
  };

  const openSaveModal = () => {
    setSaveGroupLabels(
      generatedGroups.map((_, i) => resolveGroupName(generatedGroupNames, i))
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

  const handleSaveGrouping = () => {
    if (!saveGroupName.trim()) return;
    const labels = generatedGroups.map((_, i) =>
      (saveGroupLabels[i] || '').trim() || defaultGroupName(i)
    );
    setGeneratedGroupNames(labels);
    saveGrouping({
      name: saveGroupName.trim(),
      subject: resolveSaveSubject(),
      groups: generatedGroups,
      groupNames: labels,
      unassigned: [],
      classId: selectedClass?.id,
    });
    closeSaveModal();
  };

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to generate groups."
        isDarkMode={isDarkMode}
        illustration={<Users size={36} className="text-slate-400" />}
      />
    );
  }

  if (!roster.length) {
    return (
      <EmptyState
        message="This class has no students yet. Add students in Edu.Classes."
        isDarkMode={isDarkMode}
        illustration={<Users size={36} className="text-slate-400" />}
      />
    );
  }

  return (
    <>
      <GroupsPrintSheet
        title="Quick Groups"
        className={selectedClass?.name || ''}
        groups={generatedGroups}
        groupNames={generatedGroupNames}
        theme={theme}
      />

      <AppPageShell variant="scroll" className="relative w-full min-h-[60vh] print:hidden">
        <PageHeader
          title="Group Generator"
          description="Generate quick groups, then drag students between them."
          isDarkMode={isDarkMode}
        />

        {generatedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-slate-400 opacity-70">
            <Users size={64} className="mb-4" />
            <h2 className={TYPE.titleLg}>No Groups Generated</h2>
            <p className={`${TYPE.bodyMd} mt-1`}>Click the + button below to create quick student groups.</p>
          </div>
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

        <FabStack isLeft={isLeft}>
          {generatedGroups.length > 0 ? (
            <>
              <SecondaryFab
                isDarkMode={isDarkMode}
                onClick={() => window.print()}
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
      </AppPageShell>

      <Modal
        isOpen={isGroupModalOpen}
        title="Create Groups"
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
            How many students in each group?
            {Object.keys(pairingPreferences).length ? (
              <span className={`block mt-1 ${TYPE.bodySm}`}>
                Pair and Separate preferences from Groups will be applied.
              </span>
            ) : null}
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
                      : 'bg-slate-50 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className={`py-4 rounded-xl ${TYPE.labelLg} transition-all border-2 border-transparent col-span-3 ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-200 hover:border-slate-600'
                    : 'bg-slate-50 text-slate-800 hover:border-slate-300'
                }`}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="number"
                min={1}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                placeholder="Students per group"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <ModalPrimaryButton
                theme={theme}
                onClick={() => handleCreateGroups(customSize)}
                disabled={!customSize}
              >
                Create
              </ModalPrimaryButton>
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums shrink-0 border ${
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
    </>
  );
}
