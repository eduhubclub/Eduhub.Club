import { useEffect, useState } from 'react';
import { Layers, Timer as TimerIcon, Users } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { minutesFromDuration } from '../timerUtils';

const MODE_OPTIONS = [
  { id: 'custom', label: 'Custom', icon: Layers },
  { id: 'saved', label: 'Saved groups', icon: Users },
];

/**
 * Setup small-group timers — pick groups, then set shared time.
 */
export function GroupSetupModal({
  isOpen,
  onClose,
  onComplete,
  isDarkMode,
  theme,
  initialGroups = [],
  savedGroupings = [],
  activeSavedId = null,
}) {
  const hasSaved = savedGroupings.length > 0;
  const [step, setStep] = useState('groups');
  const [mode, setMode] = useState('custom');
  const [selectedSavedId, setSelectedSavedId] = useState(activeSavedId);
  const [count, setCount] = useState(initialGroups.length || 4);
  const [names, setNames] = useState(initialGroups);
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [pendingGroups, setPendingGroups] = useState([]);
  const [pendingSavedId, setPendingSavedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const startCount = initialGroups.length || 4;
    setStep('groups');
    setCount(startCount);
    setNames(
      initialGroups.length
        ? [...initialGroups]
        : ['Group 1', 'Group 2', 'Group 3', 'Group 4'],
    );
    setSelectedSavedId(activeSavedId);
    setMode(hasSaved && activeSavedId != null ? 'saved' : 'custom');
    setMin('');
    setSec('');
    setPendingGroups([]);
    setPendingSavedId(null);
  }, [isOpen, initialGroups, activeSavedId, hasSaved]);

  const handleCountChange = (e) => {
    let val = parseInt(e.target.value, 10) || 1;
    if (val > 12) val = 12;
    setCount(val);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < val) next.push(`Group ${next.length + 1}`);
      return next.slice(0, val);
    });
  };

  const handleNameChange = (index, val) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const selectedSaved = savedGroupings.find((s) => s.id === selectedSavedId);
  const canContinueSaved = Boolean(selectedSaved);
  const canContinueCustom = names.some((n) => String(n).trim());
  const hasDuration = Boolean(min || sec);

  const goToTimeStep = (groupNames, savedId = null) => {
    setPendingGroups(groupNames);
    setPendingSavedId(savedId);
    setStep('time');
  };

  const applySetup = () => {
    const total = minutesFromDuration(min, sec);
    if (total <= 0) return;
    if (pendingSavedId == null && !pendingGroups.length) return;
    onComplete?.({
      groups: pendingGroups,
      minutes: total,
      savedId: pendingSavedId,
    });
  };

  const fieldClass = `w-full px-4 py-2.5 rounded-xl border ${TYPE.bodyMd} outline-none transition-all shadow-sm ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  const listIdle = isDarkMode
    ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const inputClass = `w-full px-4 py-3 rounded-xl border text-xl font-black outline-none transition-all shadow-sm ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-500`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:border-slate-400`
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'time' ? 'Set Group Time' : 'Setup Small Groups'}
      theme={theme}
      isDarkMode={isDarkMode}
      maxWidth="max-w-sm"
      headerStart={
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
        >
          {step === 'time' ? <TimerIcon size={18} /> : <Layers size={18} />}
        </div>
      }
      footer={
        step === 'groups' ? (
          <div className="flex w-full items-center justify-end gap-2">
            {mode === 'saved' && hasSaved ? (
              <ModalPrimaryButton
                theme={theme}
                disabled={!canContinueSaved}
                onClick={() => {
                  if (!selectedSaved) return;
                  goToTimeStep([], selectedSaved.id);
                }}
              >
                Continue
              </ModalPrimaryButton>
            ) : (
              <ModalPrimaryButton
                theme={theme}
                disabled={!canContinueCustom}
                onClick={() =>
                  goToTimeStep(names.map((n) => String(n).trim() || 'Group'))
                }
              >
                Continue
              </ModalPrimaryButton>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep('groups')}
              className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} transition-colors ${
                isDarkMode
                  ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface}`
                  : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
              }`}
            >
              Back
            </button>
            <ModalPrimaryButton
              theme={theme}
              disabled={!hasDuration}
              onClick={applySetup}
            >
              Apply
            </ModalPrimaryButton>
          </div>
        )
      }
    >
      <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
        {step === 'groups' ? (
          <>
            {hasSaved ? (
              <div className="flex justify-center">
                <SegmentControl
                  isDarkMode={isDarkMode}
                  theme={theme}
                  value={mode}
                  onChange={setMode}
                  options={MODE_OPTIONS}
                />
              </div>
            ) : null}

            {mode === 'saved' && hasSaved ? (
              <div className="space-y-2">
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  Choose a saved grouping from Edu.Groups for this class.
                </p>
                <div
                  className="flex flex-col gap-2"
                  role="radiogroup"
                  aria-label="Saved groups"
                >
                  {savedGroupings.map((saved) => {
                    const selected = selectedSavedId === saved.id;
                    return (
                      <button
                        key={saved.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedSavedId(saved.id)}
                        className={`edu-control w-full text-left rounded-xl border-[1.5px] px-4 py-3 transition-colors ${
                          selected
                            ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer} border-transparent`
                            : listIdle
                        }`}
                      >
                        <p className={`${TYPE.titleSm} truncate`}>{saved.name}</p>
                        <p
                          className={`mt-0.5 ${TYPE.bodySm} ${
                            selected ? 'opacity-80' : theme.colorOnSurfaceVariant
                          }`}
                        >
                          {saved.groups?.length ?? 0} groups
                          {saved.subject ? ` · ${saved.subject}` : ''}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {!hasSaved ? (
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    No saved groupings for this class yet. Name groups here, or
                    save one in Edu.Groups.
                  </p>
                ) : null}
                <div>
                  <label
                    className={`block ${TYPE.labelMicro} mb-2 ${theme.colorOnSurfaceVariant}`}
                  >
                    Number of groups (max 12)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={count}
                    onChange={handleCountChange}
                    className={`${fieldClass} ${TYPE.titleMd} py-3`}
                  />
                </div>
                <div className="space-y-3">
                  <label
                    className={`block ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
                  >
                    Group names
                  </label>
                  {names.map((name, index) => {
                    const defaultName = `Group ${index + 1}`;
                    return (
                      <input
                        key={index}
                        type="text"
                        value={name}
                        placeholder={defaultName}
                        onFocus={() => {
                          if (name === defaultName) {
                            handleNameChange(index, '');
                          }
                        }}
                        onBlur={() => {
                          if (!String(name).trim()) {
                            handleNameChange(index, defaultName);
                          }
                        }}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        className={fieldClass}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              How long should each group timer run?
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  className={`block ${TYPE.labelMicro} mb-2 ${theme.colorOnSurfaceVariant}`}
                >
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label
                  className={`block ${TYPE.labelMicro} mb-2 ${theme.colorOnSurfaceVariant}`}
                >
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={sec}
                  onChange={(e) => setSec(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
