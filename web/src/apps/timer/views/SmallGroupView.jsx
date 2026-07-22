import { useEffect, useState } from 'react';
import { Archive, Edit, Layers, Plus, Timer as TimerIcon } from 'lucide-react';
import { EmptyState } from '../../../shared/EmptyState';
import { ButtonRow } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TimerCard } from '../components/TimerCard';
import { GroupSetupModal } from '../components/GroupSetupModal';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { appFabClass } from '../../../shared/layout';

export function SmallGroupView({
  isDarkMode,
  theme,
  isLeft,
  onSaveRotation,
  initialGroups,
  initialMinutes,
  onConsumedRotation,
}) {
  const [groups, setGroups] = useState(() => initialGroups ?? []);
  const [groupMinutes, setGroupMinutes] = useState(initialMinutes ?? 10);

  useEffect(() => {
    if (!initialGroups?.length) return;
    setGroups(initialGroups);
    if (typeof initialMinutes === 'number') setGroupMinutes(initialMinutes);
    onConsumedRotation?.();
  }, [initialGroups, initialMinutes, onConsumedRotation]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditTimeOpen, setIsEditTimeOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const toolBtn = toolBtnClass(isDarkMode);

  const handleSave = () => {
    if (!groups.length) return;
    onSaveRotation(groups, groupMinutes);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
  };

  const hasGroups = groups.length > 0;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 mt-2">
      {hasGroups ? (
        <ButtonRow>
          <button type="button" onClick={handleSave} className={toolBtn}>
            <Archive size={16} strokeWidth={2.5} />
            {justSaved ? 'Saved!' : 'Save to Saved Timers'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditTimeOpen(true)}
            className={toolBtn}
          >
            <Edit size={16} strokeWidth={2.5} />
            Edit Time
          </button>
        </ButtonRow>
      ) : null}

      {hasGroups ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24 overflow-y-auto">
          {groups.map((groupName) => (
            <TimerCard
              key={`${groupName}-${groupMinutes}`}
              title={groupName}
              initialMinutes={groupMinutes}
              isDarkMode={isDarkMode}
              theme={theme}
              digitalOnly
            />
          ))}
        </div>
      ) : (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No small groups yet. Tap + to name your groups and start timers."
          illustration={<Layers size={40} className={theme.colorOnSurfaceVariant} />}
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
        onSave={(newGroups) => {
          setGroups(newGroups);
          setIsGroupModalOpen(false);
        }}
        isDarkMode={isDarkMode}
        theme={theme}
        initialGroups={groups}
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
