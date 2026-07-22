import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
import { PRIMARY_KEYS, primaryPalettes } from '../shared/theme';
import { WidgetCatalogPicker } from '../apps/dashboard/widgets/WidgetCatalogPicker';
import { useRandomizerPoolSettings } from '../data/randomizer/RandomizerPoolContext';

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
  const { getAppPrimary, setAppPrimary } = useAppThemePreferences();
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

  const selected = currentApp ? getAppPrimary(currentApp.id) : null;
  const isDashboard = currentApp?.id === 'dashboard';
  const isRandomizer = currentApp?.id === 'randomizer';

  const segmentIdle = isDarkMode
    ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
    : 'bg-slate-100 text-slate-500 hover:text-slate-800';

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
                  Includes the Demo Class roster and sample profiles (Harper, Liam, and classmates).
                  Turn this off for an empty workspace — your own classes and students stay.
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
