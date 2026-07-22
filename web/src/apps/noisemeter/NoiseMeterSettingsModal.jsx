import { useEffect, useRef, useState } from 'react';
import { Play, Settings2, Trash2, Upload } from 'lucide-react';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';
import {
  ALERT_SOUND_PRESETS,
  CUSTOM_SOUND_ACCEPT,
  MAX_CUSTOM_SOUND_BYTES,
  createDefaultAlertSound,
  normalizeAlertSound,
  previewAlertSound,
  readFileAsDataUrl,
} from './alertSounds';
import {
  ALERT_MARGIN,
  MAX_PROFILE_COUNT,
  MIN_PROFILE_COUNT,
} from './calibrationConstants';
import { getAlertThreshold, resizeProfiles } from './calibrationStorage';
import { NoiseMeterCalibrationModal } from './NoiseMeterCalibrationModal';

function cloneProfiles(profiles) {
  return profiles.map((profile) => ({ ...profile }));
}

/**
 * Configure how many activity profiles exist and calibrate each one.
 */
export function NoiseMeterSettingsModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  state,
  onApply,
  hasPermission,
  currentDbRef,
  onSaveCalibration,
  onResetAlertCrossings,
}) {
  const [tempCount, setTempCount] = useState(state.profileCount);
  const [tempProfiles, setTempProfiles] = useState(() => cloneProfiles(state.profiles));
  const [tempAlertSound, setTempAlertSound] = useState(() =>
    normalizeAlertSound(state.alertSound),
  );
  const [calibratingProfileId, setCalibratingProfileId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setTempCount(state.profileCount);
    setTempProfiles(cloneProfiles(state.profiles));
    setTempAlertSound(normalizeAlertSound(state.alertSound));
    setCalibratingProfileId(null);
    setUploadError(null);
  }, [isOpen, state.profileCount, state.profiles, state.alertSound]);

  const calibratingProfile = tempProfiles.find(
    (profile) => profile.id === calibratingProfileId,
  );

  const handleCountChange = (nextCount) => {
    setTempCount(nextCount);
    setTempProfiles((prev) => resizeProfiles(prev, nextCount));
  };

  const handleNameChange = (profileId, name) => {
    setTempProfiles((prev) =>
      prev.map((profile) =>
        profile.id === profileId ? { ...profile, name } : profile,
      ),
    );
  };

  const handleCalibrationComplete = (targetLevel) => {
    if (!calibratingProfileId) return;
    setTempProfiles((prev) =>
      prev.map((profile) =>
        profile.id === calibratingProfileId
          ? {
              ...profile,
              targetLevel,
              calibratedAt: Date.now(),
            }
          : profile,
      ),
    );
    onSaveCalibration(calibratingProfileId, targetLevel);
    setCalibratingProfileId(null);
  };

  const selectPreset = (id) => {
    setUploadError(null);
    setTempAlertSound((prev) => ({
      ...prev,
      id,
      // Keep custom file around if they switch away and back.
    }));
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setUploadError('Please choose an audio file (MP3, WAV, OGG, or M4A).');
      return;
    }
    if (file.size > MAX_CUSTOM_SOUND_BYTES) {
      setUploadError('Keep uploads under 400 KB so they save on this device.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUploadError(null);
      setTempAlertSound({
        id: 'custom',
        customName: file.name,
        customDataUrl: dataUrl,
      });
    } catch {
      setUploadError('Could not read that audio file. Try another format.');
    }
  };

  const clearCustomSound = () => {
    setUploadError(null);
    setTempAlertSound(createDefaultAlertSound());
  };

  const handlePreview = async (sound = tempAlertSound) => {
    if (isPreviewing || sound.id === 'mute') return;
    setIsPreviewing(true);
    try {
      await previewAlertSound(sound);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = () => {
    onApply({
      profileCount: tempCount,
      profiles: tempProfiles,
      activeProfileId: state.activeProfileId,
      alertSound: tempAlertSound,
    });
    onClose();
  };

  const bodyText = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const card = isDarkMode
    ? 'bg-slate-800 border-slate-600'
    : 'bg-white border-slate-300';
  const inputClass = `w-full rounded-xl border-2 px-3 py-2 ${TYPE.titleSm} outline-none transition-colors ${
    isDarkMode
      ? 'bg-slate-900 border-slate-600 text-white focus:border-amber-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-amber-400'
  }`;
  const secondaryBtn = `inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl ${TYPE.labelMd} transition-colors ${
    isDarkMode
      ? 'bg-slate-900 text-slate-200 hover:bg-slate-700 border border-slate-600'
      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
  }`;

  const isCustomSelected = tempAlertSound.id === 'custom';
  const hasCustomFile = Boolean(tempAlertSound.customDataUrl);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Noise Meter Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        maxWidth="max-w-2xl"
        zIndex="z-[250]"
        footer={
          <div className="w-full flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={handleApply}>
              Apply Changes
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="px-6 py-5 sm:px-7 sm:py-6 space-y-6">
          <section>
            <h3 className={`${TYPE.labelMicro} text-slate-500 mb-3`}>
              Activity profiles
            </h3>
            <p className={`${TYPE.bodyMd} mb-4 ${bodyText}`}>
              How many calibrations do you need? Each profile gets its own target
              volume — for example Choice Time, Work Time, or Testing.
            </p>
            <div
              className={`inline-flex p-1 rounded-xl ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}
              role="group"
              aria-label="Number of activity profiles"
            >
              {Array.from(
                { length: MAX_PROFILE_COUNT - MIN_PROFILE_COUNT + 1 },
                (_, index) => {
                  const count = MIN_PROFILE_COUNT + index;
                  const isActive = tempCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleCountChange(count)}
                      className={`w-10 h-9 rounded-lg ${TYPE.titleSm} transition-colors ${
                        isActive
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary} shadow-sm`
                          : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {count}
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className={`${TYPE.labelMicro} text-slate-500`}>
              Calibrate each activity
            </h3>
            {tempProfiles.map((profile, index) => {
              const alertAt = getAlertThreshold(profile);
              const isCalibrated = profile.targetLevel != null;

              return (
                <div
                  key={profile.id}
                  className={`rounded-xl border p-5 ${card}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`profile-name-${profile.id}`}
                        className={`block ${TYPE.labelMicro} mb-1.5 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Profile {index + 1}
                      </label>
                      <input
                        id={`profile-name-${profile.id}`}
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          handleNameChange(profile.id, e.target.value)
                        }
                        maxLength={32}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalibratingProfileId(profile.id)}
                      className={`shrink-0 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl ${TYPE.labelMd} transition-colors lg:min-w-[9.5rem] ${
                        isDarkMode
                          ? 'bg-slate-900 text-slate-200 hover:bg-slate-700 border border-slate-600'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Settings2 size={14} strokeWidth={2.5} />
                      {isCalibrated ? 'Recalibrate' : 'Calibrate'}
                    </button>
                  </div>
                  <p className={`mt-3 ${TYPE.bodyMd} ${bodyText}`}>
                    {isCalibrated ? (
                      <>
                        Target{' '}
                        <span className="font-bold">{profile.targetLevel}</span>
                        {' · '}
                        Alert above{' '}
                        <span className="font-bold text-rose-500">{alertAt}</span>
                        {' '}
                        <span className="opacity-70">(+{ALERT_MARGIN})</span>
                      </>
                    ) : (
                      'Not calibrated yet — uses default alert until you calibrate.'
                    )}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            <h3 className={`${TYPE.labelMicro} text-slate-500`}>
              Alert tracker
            </h3>
            <div className={`rounded-xl border p-5 ${card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`${TYPE.labelMicro} text-slate-500 mb-1`}>
                    Times over alert
                  </p>
                  <p
                    className={`text-4xl font-black tabular-nums leading-none ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {state.alertCrossings ?? 0}
                  </p>
                  <p className={`mt-2 ${TYPE.bodyMd} ${bodyText}`}>
                    Counts each time the room stays above the alert line long
                    enough to trigger.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onResetAlertCrossings?.()}
                  disabled={!state.alertCrossings}
                  className={`${secondaryBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Reset count
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className={`${TYPE.labelMicro} text-slate-500 mb-1`}>
                Alert sound
              </h3>
              <p className={`${TYPE.bodyMd} ${bodyText}`}>
                Choose a built-in tone or upload a short classroom jingle.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALERT_SOUND_PRESETS.map((preset) => {
                const isActive = tempAlertSound.id === preset.id;
                const canPreview = preset.id !== 'mute';
                return (
                  <div
                    key={preset.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isActive
                        ? `${theme.colorPrimaryContainer} border-transparent`
                        : isDarkMode
                          ? 'bg-slate-800 border-slate-600'
                          : 'bg-white border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => selectPreset(preset.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p
                          className={`${TYPE.titleSm} ${
                            isActive
                              ? theme.colorOnPrimaryContainer
                              : isDarkMode
                                ? 'text-white'
                                : 'text-slate-900'
                          }`}
                        >
                          {preset.label}
                        </p>
                        <p
                          className={`mt-0.5 ${TYPE.bodySm} ${
                            isActive
                              ? theme.colorOnPrimaryContainer
                              : bodyText
                          }`}
                        >
                          {preset.description}
                        </p>
                      </button>
                      {canPreview ? (
                        <button
                          type="button"
                          onClick={() =>
                            handlePreview({
                              id: preset.id,
                              customName: null,
                              customDataUrl: null,
                            })
                          }
                          disabled={isPreviewing}
                          className={`shrink-0 w-9 h-9 rounded-xl inline-flex items-center justify-center transition-colors disabled:opacity-50 ${
                            isActive
                              ? 'bg-white/30 hover:bg-white/40'
                              : isDarkMode
                                ? 'bg-slate-900 text-slate-200 hover:bg-slate-700 border border-slate-600'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}
                          title={`Preview ${preset.label}`}
                          aria-label={`Preview ${preset.label}`}
                        >
                          <Play size={14} strokeWidth={2.5} className="ml-0.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`rounded-xl border p-4 ${card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`${TYPE.labelMicro} text-slate-500 mb-1`}>
                    Custom upload
                  </p>
                  <p className={`${TYPE.bodyMd} truncate ${bodyText}`}>
                    {hasCustomFile
                      ? tempAlertSound.customName || 'Uploaded audio'
                      : 'MP3, WAV, OGG, or M4A · under 400 KB'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={CUSTOM_SOUND_ACCEPT}
                    className="hidden"
                    onChange={handleUpload}
                  />
                  {hasCustomFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview({
                          id: 'custom',
                          customName: tempAlertSound.customName,
                          customDataUrl: tempAlertSound.customDataUrl,
                        })
                      }
                      disabled={isPreviewing}
                      className={`${secondaryBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Preview uploaded sound"
                      aria-label="Preview uploaded sound"
                    >
                      <Play size={14} strokeWidth={2.5} />
                      Preview
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={secondaryBtn}
                  >
                    <Upload size={14} strokeWidth={2.5} />
                    {hasCustomFile ? 'Replace' : 'Upload'}
                  </button>
                  {hasCustomFile ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomSelected) {
                          clearCustomSound();
                        } else {
                          setTempAlertSound((prev) => ({
                            ...prev,
                            id: 'custom',
                          }));
                        }
                      }}
                      className={secondaryBtn}
                    >
                      {isCustomSelected ? (
                        <>
                          <Trash2 size={14} strokeWidth={2.5} />
                          Remove
                        </>
                      ) : (
                        'Use upload'
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
              {isCustomSelected && hasCustomFile ? (
                <p className={`mt-3 ${TYPE.labelMd} ${bodyText}`}>
                  Using your uploaded sound for alerts.
                </p>
              ) : null}
              {uploadError ? (
                <p className={`mt-3 ${TYPE.labelMd} text-rose-500`}>{uploadError}</p>
              ) : null}
            </div>
          </section>
        </div>
      </Modal>

      <NoiseMeterCalibrationModal
        isOpen={Boolean(calibratingProfile)}
        onClose={() => setCalibratingProfileId(null)}
        theme={theme}
        isDarkMode={isDarkMode}
        profileName={calibratingProfile?.name ?? 'Activity'}
        hasPermission={hasPermission}
        currentDbRef={currentDbRef}
        onComplete={handleCalibrationComplete}
      />
    </>
  );
}
