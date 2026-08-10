import { useEffect, useMemo, useState } from 'react';
import { Archive, Edit, Layers, Pause, Play, Plus, RotateCcw, Timer as TimerIcon, X } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { useGroupsWorkshop } from '../../../data/groups/GroupsContext';
import {
  defaultGroupNames,
  resolveGroupName,
} from '../../groups/groupUtils';
import { EmptyState } from '../../../shared/EmptyState';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TimerCard } from '../components/TimerCard';
import { GroupSetupModal } from '../components/GroupSetupModal';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { appFabClass } from '../../../shared/layout';

/** Labels for Timer cards from a Groups-app saved grouping. */
function labelsFromSaved(saved) {
  if (!saved?.groups?.length) return [];
  const names =
    saved.groupNames?.length === saved.groups.length
      ? saved.groupNames
      : defaultGroupNames(saved.groups.length);
  return saved.groups.map((_, i) => resolveGroupName(names, i));
}

/**
 * Small Group timers — listens to Edu.Groups saved arrangements for the
 * current class so teachers can start group timers without retyping names.
 */
export function SmallGroupView({
  isDarkMode,
  theme,
  isLeft,
  onSaveRotation,
  initialGroups,
  initialMinutes,
  onConsumedRotation,
}) {
  const { selectedClass } = useClasses();
  const { savedGroupings } = useGroupsWorkshop();

  const [groups, setGroups] = useState(() => initialGroups ?? []);
  const [groupMinutes, setGroupMinutes] = useState(initialMinutes ?? 10);
  const [activeSavedId, setActiveSavedId] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditTimeOpen, setIsEditTimeOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [bulkCommand, setBulkCommand] = useState(null);
  const [isAllRunning, setIsAllRunning] = useState(false);

  const classId = selectedClass?.id;
  const classSaved = useMemo(
    () =>
      savedGroupings.filter(
        (saved) =>
          !saved.isArchived && (!classId || saved.classId === classId),
      ),
    [savedGroupings, classId],
  );

  const loadSaved = (saved) => {
    if (!saved) return;
    setGroups(labelsFromSaved(saved));
    setActiveSavedId(saved.id);
  };

  // Saved Timers → Small Group handoff takes priority.
  useEffect(() => {
    if (!initialGroups?.length) return;
    setGroups(initialGroups);
    setActiveSavedId(null);
    if (typeof initialMinutes === 'number') setGroupMinutes(initialMinutes);
    onConsumedRotation?.();
  }, [initialGroups, initialMinutes, onConsumedRotation]);

  // Switching classes clears the stage — don't auto-open a grouping.
  useEffect(() => {
    if (initialGroups?.length) return;
    setGroups([]);
    setActiveSavedId(null);
    setIsAllRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // If the active saved grouping is edited/removed in Groups, stay in sync.
  useEffect(() => {
    if (activeSavedId == null) return;
    const saved = classSaved.find((s) => s.id === activeSavedId);
    if (!saved) {
      setGroups([]);
      setActiveSavedId(null);
      return;
    }
    setGroups(labelsFromSaved(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSaved, activeSavedId]);

  const toolBtn = toolBtnClass(isDarkMode);
  const dangerBtn = `${toolBtn} text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40`;

  const handleSave = () => {
    if (!groups.length) return;
    onSaveRotation(groups, groupMinutes);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
  };

  const clearGroups = () => {
    setGroups([]);
    setActiveSavedId(null);
    setIsAllRunning(false);
  };

  const broadcast = (type) => {
    setBulkCommand({ type, actionId: Date.now() });
  };

  const hasGroups = groups.length > 0;
  const activeSaved = classSaved.find((s) => s.id === activeSavedId);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 mt-2">
      {hasGroups ? (
        <ButtonRow>
          <button
            type="button"
            onClick={() => {
              if (isAllRunning) {
                broadcast('PAUSE_ALL');
                setIsAllRunning(false);
              } else {
                broadcast('START_ALL');
                setIsAllRunning(true);
              }
            }}
            className={toolBtn}
            title={isAllRunning ? 'Pause All' : 'Start All'}
            aria-label={isAllRunning ? 'Pause All' : 'Start All'}
          >
            {isAllRunning ? (
              <Pause size={16} strokeWidth={2.5} />
            ) : (
              <Play size={16} strokeWidth={2.5} />
            )}
            <ButtonRowLabel>
              {isAllRunning ? 'Pause All' : 'Start All'}
            </ButtonRowLabel>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={toolBtn}
            title={justSaved ? 'Saved!' : 'Save Timer'}
            aria-label={justSaved ? 'Saved!' : 'Save Timer'}
          >
            <Archive size={16} strokeWidth={2.5} />
            <ButtonRowLabel>
              {justSaved ? 'Saved!' : 'Save Timer'}
            </ButtonRowLabel>
          </button>
          <button
            type="button"
            onClick={() => {
              broadcast('RESET_ALL');
              setIsAllRunning(false);
            }}
            className={toolBtn}
            title="Reset All"
            aria-label="Reset All"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Reset All</ButtonRowLabel>
          </button>
          <button
            type="button"
            onClick={() => setIsEditTimeOpen(true)}
            className={toolBtn}
            title="Edit Time"
            aria-label="Edit Time"
          >
            <Edit size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Edit Time</ButtonRowLabel>
          </button>
          <button
            type="button"
            onClick={clearGroups}
            className={dangerBtn}
            title="Clear Groups"
            aria-label="Clear Groups"
          >
            <X size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Clear Groups</ButtonRowLabel>
          </button>
        </ButtonRow>
      ) : null}

      {activeSaved && hasGroups ? (
        <p
          className={`mb-3 text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          From Edu.Groups —{' '}
          <span className="font-semibold">{activeSaved.name}</span>
          {activeSaved.subject ? ` · ${activeSaved.subject}` : ''}
        </p>
      ) : null}

      {hasGroups ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-1 pb-24">
          {groups.map((groupName) => (
            <TimerCard
              key={`${groupName}-${groupMinutes}-${activeSavedId ?? 'custom'}`}
              title={groupName}
              initialMinutes={groupMinutes}
              isDarkMode={isDarkMode}
              theme={theme}
              digitalOnly
              bulkCommand={bulkCommand}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            classSaved.length === 0
              ? 'No saved groups for this class yet. Tap + to name groups here, or save a grouping in Edu.Groups.'
              : 'Tap + to choose a saved grouping or name groups manually.'
          }
          illustration={
            <Layers size={40} className={theme.colorOnSurfaceVariant} />
          }
          className="flex-1"
        />
      )}

      <button
        type="button"
        onClick={() => setIsGroupModalOpen(true)}
        className={`${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        title="Setup small groups"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <GroupSetupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onComplete={({ groups: nextGroups, minutes, savedId }) => {
          if (savedId != null) {
            const saved = classSaved.find((s) => s.id === savedId);
            if (saved) loadSaved(saved);
          } else {
            setGroups(nextGroups);
            setActiveSavedId(null);
          }
          if (typeof minutes === 'number' && minutes > 0) {
            setGroupMinutes(minutes);
          }
          setIsAllRunning(false);
          setIsGroupModalOpen(false);
        }}
        isDarkMode={isDarkMode}
        theme={theme}
        initialGroups={groups}
        savedGroupings={classSaved}
        activeSavedId={activeSavedId}
      />

      <TimerSetupModal
        isOpen={isEditTimeOpen}
        onClose={() => setIsEditTimeOpen(false)}
        onStart={(min, sec) => {
          const m = parseInt(min, 10) || 0;
          const s = parseInt(sec, 10) || 0;
          const total = m + s / 60;
          if (total > 0) setGroupMinutes(total);
          setIsEditTimeOpen(false);
        }}
        isDarkMode={isDarkMode}
        theme={theme}
        title="Edit Group Time"
        icon={TimerIcon}
        startLabel="Apply"
      />
    </div>
  );
}
