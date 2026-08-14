import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Play, Plus, Square, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { APP_PAGE_SHELL } from '../shared/layout';
import { TYPE } from '../shared/typography';
import { useDemoData } from '../data/settings/DemoDataContext';
import { useAppThemePreferences } from '../data/settings/AppThemePreferencesContext';
import {
  ACCESSIBLE_FONTS,
  TEXT_SIZES,
  useAccessibilityPreferences,
} from '../data/settings/AccessibilityPreferencesContext';
import {
  CUSTOM_ALARM_ACCEPT,
  DEFAULT_ALARM_DURATION_SEC,
  DEFAULT_ALARM_VOLUME,
  MAX_ALARM_DURATION_SEC,
  MAX_ALARM_VOLUME,
  MIN_ALARM_DURATION_SEC,
  MIN_ALARM_VOLUME,
  PENDING_ALARM_ID,
  useAlarmSoundPreferences,
} from '../data/settings/AlarmSoundPreferencesContext';
import { PRIMARY_KEYS, primaryPalettes, SHELL_BACKGROUNDS } from '../shared/theme';
import { WidgetCatalogPicker } from '../apps/dashboard/widgets/WidgetCatalogPicker';
import { useRandomizerPoolSettings } from '../data/randomizer/RandomizerPoolContext';
import { useBankAccess } from '../data/bank/BankAccessContext';
import { useClasses } from '../data/classes/ClassContext';
import {
  readBehaviorSyncToBank,
  writeBehaviorSyncToBank,
  readBehaviorShowNeedsWork,
  writeBehaviorShowNeedsWork,
} from '../apps/behavior/BehaviorContext';
import {
  JOBS_SYNC_EVENT,
  readJobsSyncToBank,
  writeJobsSyncToBank,
} from '../apps/jobs/JobsContext';
import {
  readSchoolStartTime,
  writeSchoolStartTime,
} from '../data/attendance/schoolStartTime';
import {
  DATE_VIEW_OPTIONS,
  formatAttendanceDateLabel,
  readDateView,
  writeDateView,
} from '../data/attendance/dateView';
import { dateKey } from '../data/attendance/attendanceModel';
import {
  readStoreSettings,
  writeStoreSettings,
  STORE_SETTINGS_UPDATED_EVENT,
} from '../data/store/storeSettings';
import { CalendarSettingsCards } from '../apps/calendar/CalendarSettingsCards';
import { DictionarySettingsCards } from '../apps/dictionary/DictionarySettingsCards';

function SettingsCard({ title, description, isDarkMode, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-2xl border-[1.5px] overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
      }`}
    >
      <div
        className={`px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-start gap-3 ${
          open ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}` : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h2>
          {description ? (
            <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          onClick={() => setOpen((v) => !v)}
          className={`shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.25}
            className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
      </div>

      {open ? children : null}
    </section>
  );
}

/**
 * Settings page — shown in the main content area (same shell as apps).
 * App color edits apply only to the app you opened Settings from.
 */
export function SettingsPage({
  theme,
  isDarkMode,
  currentApp,
  pinnedWidgetIds = [],
  onPinWidget,
  onUnpinWidget,
}) {
  const { showDemoData, setShowDemoData } = useDemoData();
  const { getAppPrimary, setAppPrimary, shellBackgroundId, setShellBackgroundId } =
    useAppThemePreferences();
  const {
    fontId,
    textSizeId,
    reduceMotion,
    highContrast,
    largeControls,
    underlineLinks,
    setFontId,
    setTextSizeId,
    setReduceMotion,
    setHighContrast,
    setLargeControls,
    setUnderlineLinks,
  } = useAccessibilityPreferences();
  const { syncActivePools, setSyncActivePools } = useRandomizerPoolSettings();
  const { selectedClass } = useClasses();
  const { isBankOpen, setBankOpen } = useBankAccess();
  const bankOpenForSelected = isBankOpen(selectedClass?.id);
  const {
    soundId,
    setSoundId,
    classicSounds,
    pendingCustom,
    hasPending,
    stageCustomAlarm,
    clearPendingCustom,
    addPendingToClassic,
    removeAddedSound,
    playPreview,
    stopPreview,
    previewingId,
    durationSec,
    setDurationSec,
    volume,
    setVolume,
  } = useAlarmSoundPreferences();
  const alarmFileRef = useRef(null);
  const [alarmUploadError, setAlarmUploadError] = useState(null);

  const durationProgress =
    ((durationSec - MIN_ALARM_DURATION_SEC) /
      (MAX_ALARM_DURATION_SEC - MIN_ALARM_DURATION_SEC)) *
    100;
  const defaultDurationProgress =
    ((DEFAULT_ALARM_DURATION_SEC - MIN_ALARM_DURATION_SEC) /
      (MAX_ALARM_DURATION_SEC - MIN_ALARM_DURATION_SEC)) *
    100;
  const isDefaultDuration = durationSec === DEFAULT_ALARM_DURATION_SEC;
  const durationThumbPx = 20;
  const durationThumbHalf = durationThumbPx / 2;

  const volumeProgress =
    ((volume - MIN_ALARM_VOLUME) / (MAX_ALARM_VOLUME - MIN_ALARM_VOLUME)) * 100;
  const defaultVolumeProgress =
    ((DEFAULT_ALARM_VOLUME - MIN_ALARM_VOLUME) /
      (MAX_ALARM_VOLUME - MIN_ALARM_VOLUME)) *
    100;
  const isDefaultVolume = volume === DEFAULT_ALARM_VOLUME;

  const togglePreview = (id) => {
    if (previewingId === id) {
      stopPreview();
      return;
    }
    if (id !== PENDING_ALARM_ID) setSoundId(id);
    playPreview(id);
  };

  const selectClassicSound = (id) => {
    if (id !== soundId) stopPreview();
    setSoundId(id);
  };

  const selected = currentApp ? getAppPrimary(currentApp.id) : null;
  const isDashboard = currentApp?.id === 'dashboard';
  const isRandomizer = currentApp?.id === 'randomizer';
  const isBank = currentApp?.id === 'bank';
  const isTimer = currentApp?.id === 'timer';
  const isBehavior = currentApp?.id === 'behavior';
  const isJobs = currentApp?.id === 'jobs';
  const isAttendance = currentApp?.id === 'attendance';
  const isStore = currentApp?.id === 'store';
  const isCalendar = currentApp?.id === 'calendar';
  const isDictionary = currentApp?.id === 'dictionary';
  const [behaviorSyncToBank, setBehaviorSyncToBank] = useState(readBehaviorSyncToBank);
  const [behaviorShowNeedsWork, setBehaviorShowNeedsWork] = useState(
    readBehaviorShowNeedsWork,
  );
  const [jobsSyncToBank, setJobsSyncToBank] = useState(readJobsSyncToBank);
  const [schoolStartTime, setSchoolStartTime] = useState(
    () => readSchoolStartTime() || '',
  );
  const [dateView, setDateView] = useState(readDateView);
  const [storeSettings, setStoreSettings] = useState(readStoreSettings);

  useEffect(() => {
    const onStore = (e) => {
      setStoreSettings(
        e?.detail?.settings
          ? e.detail.settings
          : readStoreSettings(),
      );
    };
    window.addEventListener(STORE_SETTINGS_UPDATED_EVENT, onStore);
    return () => window.removeEventListener(STORE_SETTINGS_UPDATED_EVENT, onStore);
  }, []);

  useEffect(() => {
    const onChange = (e) => {
      setJobsSyncToBank(
        typeof e?.detail?.syncToBank === 'boolean'
          ? e.detail.syncToBank
          : readJobsSyncToBank(),
      );
    };
    window.addEventListener(JOBS_SYNC_EVENT, onChange);
    return () => window.removeEventListener(JOBS_SYNC_EVENT, onChange);
  }, []);

  const segmentIdle = isDarkMode
    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
    : 'bg-slate-100 text-slate-500 hover:text-slate-800';

  const handleAlarmUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAlarmUploadError(null);
    try {
      await stageCustomAlarm(file);
    } catch (err) {
      setAlarmUploadError(err?.message || 'Could not upload that sound.');
    }
  };

  const handleAddPending = () => {
    setAlarmUploadError(null);
    try {
      addPendingToClassic();
    } catch (err) {
      setAlarmUploadError(err?.message || 'Could not add that sound.');
    }
  };

  const a11ySwitches = [
    {
      id: 'reduce-motion',
      label: 'Reduce motion',
      description:
        'Turns off looping decorations (header jiggle, timer swing, pulse). Teaching motion stays — card flips, coin toss, wheel spins. Your system reduce-motion setting is always honored; turn this on to force it.',
      checked: reduceMotion,
      onChange: setReduceMotion,
    },
    {
      id: 'high-contrast',
      label: 'Higher contrast',
      description: 'Stronger borders and darker muted text for clearer separation.',
      checked: highContrast,
      onChange: setHighContrast,
    },
    {
      id: 'large-controls',
      label: 'Larger controls',
      description: 'Increases minimum size for buttons and switches.',
      checked: largeControls,
      onChange: setLargeControls,
    },
    {
      id: 'underline-links',
      label: 'Underline links',
      description: 'Underlines links so color is never the only cue.',
      checked: underlineLinks,
      onChange: setUnderlineLinks,
    },
  ];

  return (
    <div className={APP_PAGE_SHELL}>
      <PageHeader
        title="Settings"
        description="Preferences for your Edu.Hub workspace."
        isDarkMode={isDarkMode}
      />

      <div className="flex flex-col gap-4 max-w-2xl">
        <SettingsCard
          title="Demo data"
          description="Sample class and students used while exploring the platform."
          isDarkMode={isDarkMode}
        >
          <div className="px-5 sm:px-6 py-5 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 pr-2">
                <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Show demo class & students
                </p>
                <p
                  className={`${TYPE.bodySm} mt-1 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Includes the Demo Class roster, sample profiles, and a rolling month of
                  attendance history (today stays open to practice). Turn this off for an empty
                  workspace — your own classes and students stay.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showDemoData}
                aria-label="Show demo class and students"
                onClick={() => setShowDemoData(!showDemoData)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                  showDemoData ? theme.colorPrimary : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    showDemoData ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </SettingsCard>

        {currentApp && selected ? (
          <SettingsCard
            title="App color"
            description={`Primary color for ${currentApp.name}. Other apps keep their own colors.`}
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentApp.name}
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    Primary: {selected}
                  </p>
                </div>
                <div
                  className="flex flex-wrap items-center gap-2"
                  role="radiogroup"
                  aria-label={`${currentApp.name} primary color`}
                >
                  {PRIMARY_KEYS.map((key) => {
                    const palette = primaryPalettes[key];
                    const isSelected = selected === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${currentApp.name}: ${key}`}
                        title={key}
                        onClick={() => setAppPrimary(currentApp.id, key)}
                        className={`w-8 h-8 rounded-full ${palette.colorPrimary} shrink-0 transition-transform ${
                          isSelected
                            ? isDarkMode
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                              : 'ring-2 ring-slate-800 ring-offset-2 ring-offset-white scale-105'
                            : 'hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </SettingsCard>
        ) : null}

        <SettingsCard
          title="Shell background"
          description="Canvas behind the sidebar and content. Simple nav spans Gray and Cream as we add more looks later."
          isDarkMode={isDarkMode}
        >
          <div className="px-5 sm:px-6 py-5 sm:py-6">
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Shell background"
            >
              {SHELL_BACKGROUNDS.map((bg) => {
                const isSelected = shellBackgroundId === bg.id;
                const swatch = isDarkMode ? bg.swatchDark : bg.swatchLight;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${bg.label}: ${bg.description}`}
                    title={bg.description}
                    onClick={() => setShellBackgroundId(bg.id)}
                    className={`edu-control inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
                      isSelected
                        ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                        : segmentIdle
                    }`}
                  >
                    <span
                      className={`h-5 w-5 shrink-0 rounded-md border ${
                        isDarkMode ? 'border-white/25' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: swatch }}
                      aria-hidden
                    />
                    {bg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </SettingsCard>

        {isDashboard ? (
          <SettingsCard
            title="Widgets"
            description="Teaching tools pinned to the Dashboard sidebar. Only applies in Dashboard."
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <WidgetCatalogPicker
                theme={theme}
                isDarkMode={isDarkMode}
                pinnedIds={pinnedWidgetIds}
                onPin={onPinWidget}
                onUnpin={onUnpinWidget}
                idPrefix="widget-settings"
              />
            </div>
          </SettingsCard>
        ) : null}

        {isRandomizer ? (
          <SettingsCard
            title="Active students"
            description="How removals apply across Randomizer tools. Only applies in Randomizer (and Dashboard widgets)."
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Sync active pools
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    When on, removing a student from Wheel of Names, Randomizer, Pick a Card, or
                    Pull a Name updates every tool the same way. When off, each tool keeps its own
                    active list.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={syncActivePools}
                  aria-label="Sync active student pools across randomizers"
                  onClick={() => setSyncActivePools(!syncActivePools)}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                    syncActivePools
                      ? theme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      syncActivePools ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </SettingsCard>
        ) : null}

        {isBank ? (
          <>
          <SettingsCard
            title="Student bank access"
            description="When closed, students cannot use the bank for this class. Teachers can still manage balances."
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {selectedClass?.name
                      ? `${selectedClass.name} bank`
                      : 'Class bank'}
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {bankOpenForSelected
                      ? 'Open — students can deposit, spend, and check balances.'
                      : 'Closed — student access is paused until you open it again.'}
                    {!selectedClass
                      ? ' Select a class in Bank to change this setting.'
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bankOpenForSelected}
                  aria-label={
                    bankOpenForSelected
                      ? 'Close student bank for this class'
                      : 'Open student bank for this class'
                  }
                  disabled={!selectedClass}
                  onClick={() =>
                    selectedClass &&
                    setBankOpen(selectedClass.id, !bankOpenForSelected)
                  }
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${
                    bankOpenForSelected
                      ? theme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      bankOpenForSelected ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Jobs sync"
            description="Link classroom jobs and salaries to Bank balances so Payday can run."
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Sync to Bank
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {jobsSyncToBank
                      ? 'On — job assignments sync to Bank and Payday is available.'
                      : 'Off — jobs stay in Jobs only; Payday is disabled.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={jobsSyncToBank}
                  aria-label="Sync Jobs to Bank"
                  onClick={() => {
                    const next = !jobsSyncToBank;
                    setJobsSyncToBank(writeJobsSyncToBank(next));
                  }}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                    jobsSyncToBank
                      ? theme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      jobsSyncToBank ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </SettingsCard>
          </>
        ) : null}

        {isJobs ? (
          <SettingsCard
            title="Bank sync"
            description="Link classroom jobs and salaries to Bank balances so Payday can run."
            isDarkMode={isDarkMode}
          >
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 pr-2">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Sync to Bank
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {jobsSyncToBank
                      ? 'On — job assignments sync to Bank and Payday is available.'
                      : 'Off — jobs stay in Jobs only; Payday is disabled.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={jobsSyncToBank}
                  aria-label="Sync Jobs to Bank"
                  onClick={() => {
                    const next = !jobsSyncToBank;
                    setJobsSyncToBank(writeJobsSyncToBank(next));
                  }}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                    jobsSyncToBank
                      ? theme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      jobsSyncToBank ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </SettingsCard>
        ) : null}

        {isAttendance ? (
          <>
            <SettingsCard
              title="Date view"
              description="How the date appears on Daily Attendance."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 pr-2">
                    <p
                      className={`${TYPE.titleSm} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Format
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Preview:{' '}
                      {formatAttendanceDateLabel(dateKey(), dateView)}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label="Attendance date view"
                  >
                    {DATE_VIEW_OPTIONS.map((opt) => {
                      const selected = dateView === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          title={opt.example}
                          onClick={() => setDateView(writeDateView(opt.id))}
                          className={`edu-control inline-flex flex-col items-start gap-0.5 px-3.5 py-2 rounded-xl text-left transition-colors ${
                            selected
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                              : segmentIdle
                          }`}
                        >
                          <span className={TYPE.labelLg}>{opt.label}</span>
                          <span
                            className={`${TYPE.labelMicro} ${
                              selected ? 'opacity-80' : 'opacity-70'
                            }`}
                          >
                            {opt.example}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="School start"
              description="After this time, unmarked students on today’s Daily attendance switch to Tardy."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 pr-2">
                    <p
                      className={`${TYPE.titleSm} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Start time
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {schoolStartTime
                        ? `On — unmarked students become Tardy at ${schoolStartTime}.`
                        : 'Off — leave empty to keep unmarked until you mark or submit.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={schoolStartTime}
                      onChange={(e) => {
                        const next = writeSchoolStartTime(e.target.value || null);
                        setSchoolStartTime(next || '');
                      }}
                      aria-label="School start time"
                      className={`edu-control h-10 rounded-xl border-[1.5px] px-3 ${TYPE.labelMd} ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-600 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {schoolStartTime ? (
                      <button
                        type="button"
                        onClick={() => {
                          writeSchoolStartTime(null);
                          setSchoolStartTime('');
                        }}
                        className={`edu-control h-10 rounded-xl px-3 ${TYPE.labelMd} ${
                          isDarkMode
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </SettingsCard>
          </>
        ) : null}

        {isStore ? (
          <>
            <SettingsCard
              title="Connections"
              description="Show the Store redeem surface inside Bank and/or Behavior, and choose which wallets can charge."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
                {[
                  {
                    key: 'connectBank',
                    label: 'Connect to Bank',
                    on: storeSettings.connectBank,
                    hint: storeSettings.connectBank
                      ? 'On — Store appears in Bank and can charge dollars.'
                      : 'Off — Bank will not show Store.',
                  },
                  {
                    key: 'connectBehavior',
                    label: 'Connect to Behavior',
                    on: storeSettings.connectBehavior,
                    hint: storeSettings.connectBehavior
                      ? 'On — Store appears in Behavior and can charge points.'
                      : 'Off — Behavior will not show Store.',
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 pr-2">
                      <p
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {row.label}
                      </p>
                      <p
                        className={`${TYPE.bodySm} mt-1 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {row.hint}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.on}
                      aria-label={row.label}
                      onClick={() =>
                        setStoreSettings(
                          writeStoreSettings({ [row.key]: !row.on }),
                        )
                      }
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                        row.on
                          ? theme.colorPrimary
                          : isDarkMode
                            ? 'bg-slate-700'
                            : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          row.on ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <p
                  className={`${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  If Behavior Sync to Bank is on, redemptions charge Bank only.
                  Otherwise only the connected wallet(s) apply — never both on
                  one purchase.
                </p>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Redeem modes"
              description="Teacher multi-select redeem is always available. Optional student self-serve and approvals."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
                {[
                  {
                    key: 'studentSelfServe',
                    label: 'Student self-serve',
                    on: storeSettings.studentSelfServe,
                    hint: storeSettings.studentSelfServe
                      ? 'On — students can redeem with their bank PIN.'
                      : 'Off — only teachers redeem for students.',
                  },
                  {
                    key: 'requireApproval',
                    label: 'Require teacher approval',
                    on: storeSettings.requireApproval,
                    hint: storeSettings.requireApproval
                      ? 'On — self-serve requests wait in Activity until approved.'
                      : 'Off — self-serve completes immediately when enabled.',
                  },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 pr-2">
                      <p
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {row.label}
                      </p>
                      <p
                        className={`${TYPE.bodySm} mt-1 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {row.hint}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.on}
                      aria-label={row.label}
                      onClick={() =>
                        setStoreSettings(
                          writeStoreSettings({ [row.key]: !row.on }),
                        )
                      }
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                        row.on
                          ? theme.colorPrimary
                          : isDarkMode
                            ? 'bg-slate-700'
                            : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          row.on ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </SettingsCard>
          </>
        ) : null}

        {isCalendar ? (
          <CalendarSettingsCards
            theme={theme}
            isDarkMode={isDarkMode}
            Card={SettingsCard}
          />
        ) : null}

        {isDictionary ? (
          <DictionarySettingsCards
            theme={theme}
            isDarkMode={isDarkMode}
            Card={SettingsCard}
          />
        ) : null}

        {isBehavior ? (
          <>
            <SettingsCard
              title="Feedback"
              description="Choose which behavior categories teachers can award."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 pr-2">
                    <p
                      className={`${TYPE.titleSm} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Needs work feedback
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {behaviorShowNeedsWork
                        ? 'On — Positive and Needs work are both available when awarding.'
                        : 'Off — only Positive behaviors appear on Award and Behaviors.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={behaviorShowNeedsWork}
                    aria-label="Show Needs work feedback"
                    onClick={() => {
                      const next = !behaviorShowNeedsWork;
                      setBehaviorShowNeedsWork(writeBehaviorShowNeedsWork(next));
                    }}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                      behaviorShowNeedsWork
                        ? theme.colorPrimary
                        : isDarkMode
                          ? 'bg-slate-700'
                          : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        behaviorShowNeedsWork ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              title="Bank sync"
              description="Optionally write Behavior awards into classroom Bank balances."
              isDarkMode={isDarkMode}
            >
              <div className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 pr-2">
                    <p
                      className={`${TYPE.titleSm} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Sync to Bank
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {behaviorSyncToBank
                        ? 'On — each award also updates class dollars (1 point = $1).'
                        : 'Off — points stay in Behavior only.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={behaviorSyncToBank}
                    aria-label="Sync Behavior awards to Bank"
                    onClick={() => {
                      const next = !behaviorSyncToBank;
                      setBehaviorSyncToBank(writeBehaviorSyncToBank(next));
                    }}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                      behaviorSyncToBank
                        ? theme.colorPrimary
                        : isDarkMode
                          ? 'bg-slate-700'
                          : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        behaviorSyncToBank ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </SettingsCard>
          </>
        ) : null}

        {isTimer ? (
        <SettingsCard
          title="Alarm sounds"
          description="Default chime when a Timer finishes. Override on any timer’s control row for one-time use."
          isDarkMode={isDarkMode}
        >
          <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Classic sounds
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Pick the classroom default. Override on a timer’s Alarm control for one-time use.
                  </p>
                </div>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  role="radiogroup"
                  aria-label="Classic alarm sound"
                >
                  {classicSounds.map((sound) => {
                    const isSelected = soundId === sound.id;
                    const isPreviewing = previewingId === sound.id;
                    const chipBtn = `shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-white/25 hover:bg-white/35'
                        : isDarkMode
                          ? 'bg-slate-900/60 hover:bg-slate-700'
                          : 'bg-white/80 hover:bg-white'
                    }`;
                    return (
                      <div
                        key={sound.id}
                        className={`edu-control flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
                          isSelected
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : segmentIdle
                        }`}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={sound.label}
                          onClick={() => selectClassicSound(sound.id)}
                          className={`flex-1 min-w-0 text-left truncate ${TYPE.labelLg}`}
                        >
                          {sound.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePreview(sound.id)}
                          className={chipBtn}
                          title={isPreviewing ? `Stop ${sound.label}` : `Preview ${sound.label}`}
                          aria-label={
                            isPreviewing ? `Stop ${sound.label}` : `Preview ${sound.label}`
                          }
                        >
                          {isPreviewing ? (
                            <Square size={12} strokeWidth={2.5} fill="currentColor" />
                          ) : (
                            <Play size={14} strokeWidth={2.5} className="ml-0.5" />
                          )}
                        </button>
                        {sound.isCustom ? (
                          <button
                            type="button"
                            onClick={() => removeAddedSound(sound.id)}
                            className={chipBtn}
                            title={`Remove ${sound.label}`}
                            aria-label={`Remove ${sound.label}`}
                          >
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Alarm duration
                    </p>
                    <p
                      className={`${TYPE.labelLg} tabular-nums ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {durationSec}s
                      {isDefaultDuration ? (
                        <span
                          className={`ml-1.5 font-normal ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          · default
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    How long the alarm plays when a timer finishes.
                  </p>
                </div>
                <div className="relative h-10 flex items-center">
                  <div
                    className={`absolute h-1.5 rounded-full overflow-visible ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                    style={{ left: durationThumbHalf, right: durationThumbHalf }}
                    aria-hidden
                  >
                    <div
                      className={`h-full rounded-full ${theme.colorPrimary}`}
                      style={{ width: `${durationProgress}%` }}
                    />
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-3.5 rounded-full ring-2 ${
                        isDarkMode
                          ? 'bg-slate-300 ring-slate-900'
                          : 'bg-slate-500 ring-white'
                      }`}
                      style={{ left: `${defaultDurationProgress}%` }}
                      title={`Default ${DEFAULT_ALARM_DURATION_SEC}s`}
                    />
                  </div>
                  <input
                    type="range"
                    min={MIN_ALARM_DURATION_SEC}
                    max={MAX_ALARM_DURATION_SEC}
                    step={1}
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="edu-control absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Alarm duration in seconds"
                    aria-valuemin={MIN_ALARM_DURATION_SEC}
                    aria-valuemax={MAX_ALARM_DURATION_SEC}
                    aria-valuenow={durationSec}
                    aria-valuetext={`${durationSec} seconds${
                      isDefaultDuration ? ', default' : ''
                    }`}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-sm border-2 pointer-events-none z-[5] ${theme.colorPrimary} ${
                      isDarkMode ? 'border-slate-900' : 'border-white'
                    }`}
                    style={{
                      left: `calc(${durationThumbHalf}px + (100% - ${durationThumbPx}px) * ${durationProgress / 100})`,
                    }}
                    aria-hidden
                  />
                </div>
                <div
                  className={`flex justify-between -mt-1 ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>{MIN_ALARM_DURATION_SEC}s</span>
                  <button
                    type="button"
                    onClick={() => setDurationSec(DEFAULT_ALARM_DURATION_SEC)}
                    className={`edu-control rounded-lg px-1.5 py-0.5 transition-colors ${
                      isDefaultDuration
                        ? isDarkMode
                          ? 'text-slate-300'
                          : 'text-slate-600'
                        : isDarkMode
                          ? 'hover:text-slate-300 hover:bg-slate-800'
                          : 'hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={`Reset to default ${DEFAULT_ALARM_DURATION_SEC}s`}
                  >
                    Default {DEFAULT_ALARM_DURATION_SEC}s
                  </button>
                  <span>{MAX_ALARM_DURATION_SEC}s</span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Alarm volume
                    </p>
                    <p
                      className={`${TYPE.labelLg} tabular-nums ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {volume}%
                      {isDefaultVolume ? (
                        <span
                          className={`ml-1.5 font-normal ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          · default
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    How loud the alarm plays for previews and finished timers.
                  </p>
                </div>
                <div className="relative h-10 flex items-center">
                  <div
                    className={`absolute h-1.5 rounded-full overflow-visible ${
                      isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                    style={{ left: durationThumbHalf, right: durationThumbHalf }}
                    aria-hidden
                  >
                    <div
                      className={`h-full rounded-full ${theme.colorPrimary}`}
                      style={{ width: `${volumeProgress}%` }}
                    />
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-3.5 rounded-full ring-2 ${
                        isDarkMode
                          ? 'bg-slate-300 ring-slate-900'
                          : 'bg-slate-500 ring-white'
                      }`}
                      style={{ left: `${defaultVolumeProgress}%` }}
                      title={`Default ${DEFAULT_ALARM_VOLUME}%`}
                    />
                  </div>
                  <input
                    type="range"
                    min={MIN_ALARM_VOLUME}
                    max={MAX_ALARM_VOLUME}
                    step={1}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="edu-control absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Alarm volume"
                    aria-valuemin={MIN_ALARM_VOLUME}
                    aria-valuemax={MAX_ALARM_VOLUME}
                    aria-valuenow={volume}
                    aria-valuetext={`${volume} percent${isDefaultVolume ? ', default' : ''}`}
                  />
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-sm border-2 pointer-events-none z-[5] ${theme.colorPrimary} ${
                      isDarkMode ? 'border-slate-900' : 'border-white'
                    }`}
                    style={{
                      left: `calc(${durationThumbHalf}px + (100% - ${durationThumbPx}px) * ${volumeProgress / 100})`,
                    }}
                    aria-hidden
                  />
                </div>
                <div
                  className={`flex justify-between -mt-1 ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>{MIN_ALARM_VOLUME}%</span>
                  <button
                    type="button"
                    onClick={() => setVolume(DEFAULT_ALARM_VOLUME)}
                    className={`edu-control rounded-lg px-1.5 py-0.5 transition-colors ${
                      isDefaultVolume
                        ? isDarkMode
                          ? 'text-slate-300'
                          : 'text-slate-600'
                        : isDarkMode
                          ? 'hover:text-slate-300 hover:bg-slate-800'
                          : 'hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={`Reset to default ${DEFAULT_ALARM_VOLUME}%`}
                  >
                    Default {DEFAULT_ALARM_VOLUME}%
                  </button>
                  <span>{MAX_ALARM_VOLUME}%</span>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Custom sound
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 truncate ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {hasPending
                      ? pendingCustom.name || 'Uploaded audio'
                      : 'Upload a sound, then Add it to Classic sounds.'}
                  </p>
                  {alarmUploadError ? (
                    <p className={`${TYPE.bodySm} mt-1 text-rose-500`}>{alarmUploadError}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    ref={alarmFileRef}
                    type="file"
                    accept={CUSTOM_ALARM_ACCEPT}
                    className="hidden"
                    onChange={handleAlarmUpload}
                  />
                  {hasPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => togglePreview(PENDING_ALARM_ID)}
                        className={`edu-control inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${segmentIdle}`}
                        title={
                          previewingId === PENDING_ALARM_ID
                            ? 'Stop uploaded sound'
                            : 'Preview uploaded sound'
                        }
                        aria-label={
                          previewingId === PENDING_ALARM_ID
                            ? 'Stop uploaded sound'
                            : 'Preview uploaded sound'
                        }
                      >
                        {previewingId === PENDING_ALARM_ID ? (
                          <>
                            <Square size={12} strokeWidth={2.5} fill="currentColor" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play size={14} strokeWidth={2.5} />
                            Preview
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={clearPendingCustom}
                        className={`edu-control inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${segmentIdle}`}
                        title="Delete uploaded sound"
                        aria-label="Delete uploaded sound"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPending}
                        className={`edu-control inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        Add
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alarmFileRef.current?.click()}
                      className={`edu-control inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${segmentIdle}`}
                    >
                      <Upload size={14} strokeWidth={2.5} />
                      Upload sound
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>
        ) : null}

        <SettingsCard
          title="Accessibility"
          description="Applies to every app in Edu.Hub — not just the one you're in now."
          isDarkMode={isDarkMode}
        >
          <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Accessible font
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    High-legibility typeface for all apps (Hub, Classes, Students, and the rest).
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="Accessible font"
                >
                  {ACCESSIBLE_FONTS.map((font) => {
                    const isSelected = fontId === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={font.description}
                        title={font.description}
                        onClick={() => setFontId(font.id)}
                        className={`edu-control px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
                          isSelected
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : segmentIdle
                        }`}
                        style={font.cssFamily ? { fontFamily: font.cssFamily } : undefined}
                      >
                        {font.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Text size
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Scales interface text everywhere. Default is 100%; large and extra large enlarge
                    rem-based sizes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Text size">
                  {TEXT_SIZES.map((size) => {
                    const isSelected = textSizeId === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setTextSizeId(size.id)}
                        className={`edu-control px-3.5 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
                          isSelected
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : segmentIdle
                        }`}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {a11ySwitches.map((item) => (
              <div key={item.id} className="px-5 sm:px-6 py-5 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 pr-2">
                    <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.checked}
                    aria-label={item.label}
                    onClick={() => item.onChange(!item.checked)}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                      item.checked
                        ? theme.colorPrimary
                        : isDarkMode
                          ? 'bg-slate-700'
                          : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        item.checked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
