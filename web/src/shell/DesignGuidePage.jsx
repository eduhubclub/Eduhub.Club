import { useState } from 'react';
import { ChevronDown, Plus, RotateCcw, Settings2, Shuffle, User, Users } from 'lucide-react';
import { ButtonRow } from '../shared/ButtonRow';
import { PageHeader } from '../shared/PageHeader';
import { Modal } from '../shared/Modal';
import { ModalPrimaryButton } from '../shared/ModalPrimaryButton';
import { LogoHorizontal, LogoIcon2x2 } from '../shared/Logo';
import { StyleGuideCard } from '../shared/StyleGuideCard';
import { ShellInsetPreview } from '../shared/ShellInsetPreview';
import { ContentCardsPreview } from '../shared/ContentCardsPreview';
import { ContentCardStylesPreview } from '../shared/ContentCardStylesPreview';
import { BrandColorGuideSections } from '../apps/brand/BrandColorGuideSections';
import { ColorTestView } from '../apps/brand/ColorTestView';
import { ColorThemeRolesCard } from '../apps/brand/ColorThemeRolesCard';
import { colorThemeRolesFromPrimaryKey } from '../apps/brand/colorThemeRoles';
import { LogoTestView } from '../apps/brand/LogoTestView';
import {
  SHELL_MAIN_PADDING,
  SHELL_PADDING_PX,
  APP_MAX_WIDTH,
  APP_STAGE_SHELL,
  APP_SCROLL_SHELL,
  APP_PAGE_SHELL,
  APP_SCROLL_BOTTOM,
  APP_PAGE_BOTTOM,
  APP_STATIC_BOARD,
  APP_SCROLL_BOARD,
  APP_GRID_CARD,
  APP_BOARD_MAX_WIDTH,
  APP_BOARD_BODY_SCROLL,
  APP_NESTED_CARD,
  APP_EMPTY_SLOT,
} from '../shared/layout';
import {
  primaryPalettes,
  PRIMARY_KEYS,
  NAV_HEIGHT,
  MATERIAL_COLOR_ROLES,
  getTheme,
} from '../shared/theme';
import { toolBtnClass } from '../shared/toolBtn';
import { TYPE, TYPE_RESERVED, TYPE_SCALE } from '../shared/typography';
import {
  ACCESSIBLE_FONTS,
  TEXT_SIZES,
} from '../data/settings/AccessibilityPreferencesContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'branding', label: 'Branding' },
  { id: 'text', label: 'Text' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'app', label: 'App' },
  { id: 'colors', label: 'Colors' },
  { id: 'notes', label: 'Notes' },
];

const TAB_ID_BY_LABEL = Object.fromEntries(TABS.map((t) => [t.label, t.id]));

const OVERVIEW_SECTIONS = [
  {
    name: 'Branding',
    blurb: 'Logo marks, Logo Test / Color Test playgrounds, radius, and board chrome.',
  },
  {
    name: 'Text',
    blurb: 'Font stack, TYPE scale, weights, and text color roles.',
  },
  {
    name: 'Buttons',
    blurb: 'Primary, secondary, tool chips, and FAB.',
  },
  {
    name: 'Patterns',
    blurb: 'App Shell inset and App Layout — build in the real shell.',
  },
  {
    name: 'Cards',
    blurb: 'Types, M3 styles (outlined/filled), examples, and accessibility.',
  },
  {
    name: 'Modal',
    blurb: 'Dialog chrome — overlay, primary header, Cancel + ModalPrimaryButton.',
  },
  {
    name: 'Live View',
    blurb: 'Compose shell + components on a live canvas with Space debug.',
  },
  {
    name: 'Navigation',
    blurb: 'Sidebar link, panel, accordion, and popout patterns.',
  },
  {
    name: 'App',
    blurb: 'Page shells, boards, empty states, and settings modals.',
  },
  {
    name: 'Colors',
    blurb: 'WCAG contrast, Material color roles theme board, and primary palettes.',
  },
  {
    name: 'Notes',
    blurb: 'Handoff rules that keep mini-apps on the same system.',
  },
];

/**
 * Two intentional design modes. Classroom tools use App mode; brand/docs pages
 * (HubBrand today, FAQs and help later) stay Webpage mode on purpose.
 */
const DESIGN_MODES = [
  {
    name: 'App mode',
    feels: 'a classroom tool inside the shell',
    usedFor: 'Timer, Randomizer, Groups, Noise Meter, Classes — anything a teacher runs live.',
    look: 'theme.* roles · APP_* boards · TYPE.* · toolBtnClass / FAB / Modal',
  },
  {
    name: 'Webpage mode',
    feels: 'a brand site or doc inside the shell',
    usedFor: 'HubBrand today; FAQs, help, and policy pages later.',
    look: 'serif headings · stone/paper text · long-scroll article — no board chrome',
  },
];

const FONT_WEIGHTS = [
  { label: 'Regular', className: 'font-normal', use: 'Body, Label Small (back link)' },
  { label: 'Medium', className: 'font-medium', use: 'Label Micro eyebrows' },
  { label: 'Semibold', className: 'font-semibold', use: 'Title Small, Labels Large/Medium' },
  { label: 'Bold', className: 'font-bold', use: 'Title Large / Medium only' },
];

const TEXT_COLORS = [
  {
    label: 'On surface',
    light: 'text-slate-900',
    dark: 'text-white',
    note: 'Titles, primary labels · colorOnSurface',
  },
  {
    label: 'Muted',
    light: 'text-slate-500',
    dark: 'text-slate-400',
    note: 'Page descriptions · colorOnSurfaceVariant',
  },
  {
    label: 'Subtle',
    light: 'text-slate-400',
    dark: 'text-slate-500',
    note: 'Captions, card subtitles',
  },
  {
    label: 'Brand accent',
    light: 'theme.text',
    dark: 'theme.text',
    note: 'Header app name, links · from primary palette',
  },
];

const RADII = [
  {
    label: 'rounded-2xl',
    className: 'rounded-2xl',
    use: 'Static / scrolling boards & grid cards',
  },
  { label: 'rounded-xl', className: 'rounded-xl', use: 'Nested cards, empty slots, inputs, tool buttons' },
  { label: 'rounded-lg', className: 'rounded-lg', use: 'App tiles, small controls' },
  { label: 'rounded-full', className: 'rounded-full', use: 'FAB, avatars, switches' },
];

function GuideSection({ title, description, isDarkMode, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`${APP_GRID_CARD} overflow-hidden relative ${
        isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        onClick={() => setOpen((v) => !v)}
        className={`absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
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
      <div
        className={`px-5 sm:px-6 pt-5 sm:pt-6 pb-4 pr-14 sm:pr-16 ${
          open ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}` : ''
        }`}
      >
        <h2 className={`${TYPE.titleMd} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
        {description ? (
          <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </p>
        ) : null}
      </div>
      {open ? <div className="px-5 sm:px-6 py-5 sm:py-6">{children}</div> : null}
    </section>
  );
}

/**
 * Living style guide — shell chrome for handoff and visual consistency checks.
 * Section is driven by Edu.Design sidebar `activeTab` (nav item name).
 */
export function DesignGuidePage({ theme, isDarkMode, activeTab = 'Overview' }) {
  const guideTab = TAB_ID_BY_LABEL[activeTab] || 'overview';
  const [previewThemeKey, setPreviewThemeKey] = useState('Blue');
  const [demoSwitchOn, setDemoSwitchOn] = useState(true);
  const [demoSegment, setDemoSegment] = useState('1v1');
  const [demoSettingsOpen, setDemoSettingsOpen] = useState(false);
  const [demoTempSwitch, setDemoTempSwitch] = useState(true);
  const previewTheme = getTheme(previewThemeKey, isDarkMode);
  const surface = isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300';
  const teachingSurface = isDarkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';
  const nestedSurface = isDarkMode
    ? 'bg-slate-800/60 border-slate-600'
    : 'bg-slate-50 border-slate-200';
  const toolBtn = toolBtnClass(isDarkMode);
  const sectionLabel = TABS.find((t) => t.id === guideTab)?.label || 'AppGuide';

  return (
    <div className={APP_PAGE_SHELL}>
      <PageHeader
        title={sectionLabel}
        description="AppGuide — living style guide for all things Edu.Hub."
        isDarkMode={isDarkMode}
      />

      <div className="space-y-6">
        {guideTab === 'overview' ? (
          <>
            <GuideSection
              title="What is AppGuide?"
              isDarkMode={isDarkMode}
            >
              <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Use AppGuide to check logos, type, buttons, layout shells, card types, and color
                roles against the real AppShell. Prefer tokens from{' '}
                <code className="font-mono">shared/layout</code>,{' '}
                <code className="font-mono">shared/typography</code>, and{' '}
                <code className="font-mono">getTheme()</code> — don’t invent one-off sizes, borders,
                or paddings in mini-apps.
              </p>
            </GuideSection>

            <GuideSection
              title="Two design modes"
              description="Pick the mode before you build — mixing them is what makes screens drift."
              isDarkMode={isDarkMode}
            >
              <ul className="space-y-3">
                {DESIGN_MODES.map(({ name, feels, usedFor, look }) => (
                  <li key={name} className={`rounded-xl border px-3.5 py-3 ${nestedSurface}`}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {name}
                      </span>
                      <span
                        className={`${TYPE.bodySm} ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {feels}
                      </span>
                    </div>
                    <p
                      className={`${TYPE.bodySm} mt-1.5 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {usedFor}
                    </p>
                    <p
                      className={`${TYPE.bodySm} mt-1 font-mono ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {look}
                    </p>
                  </li>
                ))}
              </ul>
              <p
                className={`${TYPE.bodySm} mt-4 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                AppGuide documents <span className={TYPE.titleSm}>App</span> mode. Product identity
                and <span className={TYPE.titleSm}>Webpage</span> mode live in HubBrand.
              </p>
            </GuideSection>

            <GuideSection
              title="How to use it"
              description="Sidebar picks the section. Live surfaces open dedicated canvases."
              isDarkMode={isDarkMode}
            >
              <ul
                className={`${TYPE.bodyMd} space-y-2 list-disc pl-5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <li>
                  <span className={TYPE.titleSm}>Guide tabs</span> (Branding → Notes) render
                  collapsible reference cards in this page.
                </li>
                <li>
                  <span className={TYPE.titleSm}>Patterns</span> opens a secondary panel — App Shell
                  and App Layout build in the real shell.
                </li>
                <li>
                  <span className={TYPE.titleSm}>Cards</span> opens a secondary panel with{' '}
                  <span className={TYPE.titleSm}>Card Types</span>,{' '}
                  <span className={TYPE.titleSm}>Card Styles</span>, and{' '}
                  <span className={TYPE.titleSm}>Card Examples</span> accordions.{' '}
                  <span className={TYPE.titleSm}>Modal</span> is a separate live page for dialog
                  chrome.{' '}
                  <span className={TYPE.titleSm}>Live View</span> is a full-page canvas for composing
                  and debugging spacing.
                </li>
                <li>
                  Handoff rules live under <span className={TYPE.titleSm}>Notes</span>.
                </li>
              </ul>
            </GuideSection>

            <GuideSection
              title="Section map"
              description="Where each concern lives in the sidebar."
              isDarkMode={isDarkMode}
            >
              <ul className="space-y-2">
                {OVERVIEW_SECTIONS.map(({ name, blurb }) => (
                  <li
                    key={name}
                    className={`flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 rounded-xl border px-3.5 py-3 ${nestedSurface}`}
                  >
                    <span
                      className={`${TYPE.titleSm} shrink-0 sm:w-28 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {name}
                    </span>
                    <span
                      className={`${TYPE.bodySm} ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {blurb}
                    </span>
                  </li>
                ))}
              </ul>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'branding' ? (
          <>
            <GuideSection
              title="Brand"
              description="Logo marks used in the sidebar and product chrome."
              isDarkMode={isDarkMode}
            >
              <div className="flex flex-wrap items-center gap-8">
                <div className="space-y-2">
                  <p
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Horizontal
                  </p>
                  <div className={`h-14 px-4 rounded-xl border flex items-center ${surface}`}>
                    <LogoHorizontal className="h-8 w-auto" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Icon (rail)
                  </p>
                  <div
                    className={`h-14 w-14 rounded-xl border flex items-center justify-center ${surface}`}
                  >
                    <LogoIcon2x2 className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </GuideSection>

            <StyleGuideCard
              title="Logo"
              token="LogoHorizontal · LogoIcon2x2"
              description="Four glyphs in fixed Tailwind *-500 accents — brighter than app primary fills (mostly *-400). Import from shared/Logo. Chrome size matches Edu. text height (h-8)."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                { label: 'Circle', value: 'text-rose-500', note: 'Left glyph' },
                { label: 'Triangle', value: 'text-amber-500', note: 'Second glyph' },
                { label: 'Square', value: 'text-emerald-500', note: 'Third glyph' },
                { label: 'Spiral', value: 'text-sky-500', note: 'Right glyph' },
                {
                  label: 'Chrome size',
                  value: 'h-8',
                  note: 'Matches Edu. logotype height in the header',
                },
                {
                  label: 'vs primaries',
                  value: 'Logo = *-500',
                  note: 'colorPrimary fills are mostly *-400',
                },
              ]}
              doList={[
                'Keep official logo glyph colors — do not recolor with theme.colorPrimary.',
                'Use LogoHorizontal in the open sidebar; LogoIcon2x2 on the collapsed rail.',
                'Size chrome logos to h-8 so they match the Edu. text height.',
              ]}
              dontList={[
                'Theme the logo marks with app primary roles.',
                'Swap individual glyph hues without updating both logo variants.',
              ]}
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="space-y-2">
                  <p className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Horizontal
                  </p>
                  <div
                    className={`h-14 px-4 rounded-xl border flex items-center ${
                      isDarkMode ? 'border-slate-600 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <LogoHorizontal className="h-8 w-auto" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Icon
                  </p>
                  <div
                    className={`h-14 w-14 rounded-xl border flex items-center justify-center ${
                      isDarkMode ? 'border-slate-600 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <LogoIcon2x2 className="h-8 w-8" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { label: 'rose', className: 'bg-rose-500' },
                    { label: 'amber', className: 'bg-amber-500' },
                    { label: 'emerald', className: 'bg-emerald-500' },
                    { label: 'sky', className: 'bg-sky-500' },
                  ].map((swatch) => (
                    <div key={swatch.label} className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md ${swatch.className}`}
                        title={swatch.label}
                        aria-hidden
                      />
                      <span
                        className={`text-[11px] font-mono ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {swatch.label}-500
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </StyleGuideCard>

            <GuideSection
              title="Logo Test"
              description="Interactive playground for layout, Default / Outline / Textured styles, scribble variants, and padding overlays. Same tool as HubBrand → Logo Test."
              isDarkMode={isDarkMode}
            >
              <div
                className={`overflow-hidden rounded-2xl border ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <LogoTestView isDarkMode={isDarkMode} embedded />
              </div>
            </GuideSection>

            <GuideSection
              title="Color Test"
              description="Coolors-style palette generator with Edu.Hub component previews, a color picker, and export. Same tool as HubBrand → Color Test."
              isDarkMode={isDarkMode}
            >
              <div
                className={`overflow-hidden rounded-2xl border ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <ColorTestView isDarkMode={isDarkMode} embedded />
              </div>
            </GuideSection>

            <GuideSection
              title="Radius & chrome"
              description={`Header / sidebar height uses NAV_HEIGHT (${NAV_HEIGHT}). Boards and cards use border-[1.5px] with no shadow.`}
              isDarkMode={isDarkMode}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {RADII.map((r) => (
                  <div key={r.label} className="space-y-2">
                    <div
                      className={`h-16 border-2 ${r.className} ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-800'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    />
                    <p
                      className={`text-xs font-bold font-mono ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {r.label}
                    </p>
                    <p className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {r.use}
                    </p>
                  </div>
                ))}
              </div>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'text' ? (
          <>
            <GuideSection
              title="Font family"
              description="Shell uses Tailwind font-sans on the root layout. No custom webfont yet — system UI stack only."
              isDarkMode={isDarkMode}
            >
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <p
                  className={`text-2xl font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Aa Bb Cc — Edu.Hub
                </p>
                <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  The quick brown fox jumps over the lazy dog. 0123456789
                </p>
                <div className={`text-xs font-mono space-y-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <p>
                    Class: <code className="font-mono">font-sans</code>
                  </p>
                  <p>
                    Stack: ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji
                    (Tailwind default)
                  </p>
                  <p>
                    Tokens / class names: <code className="font-mono">font-mono</code>
                  </p>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              title="Type scale"
              description="Material 3–inspired roles from shared/typography.js. Use TYPE.displaySm / titleLg (etc.) — don’t invent one-off sizes. Headline stays reserved for marketing."
              isDarkMode={isDarkMode}
            >
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDarkMode ? 'border-slate-700' : 'border-slate-300'
                      }`}
                    >
                      {['Role', 'Token', 'Sample', 'Maps to', 'Classes'].map((h) => (
                        <th
                          key={h}
                          className={`pb-3 pr-4 ${TYPE.labelMicro} ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          } ${h === 'Sample' ? 'w-[28%]' : ''} ${
                            h === 'Classes' ? 'pr-0' : ''
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TYPE_SCALE.map((sample) => (
                      <tr
                        key={sample.role}
                        className={`border-b last:border-0 align-top ${
                          isDarkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}
                      >
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <span
                            className={`${TYPE.labelMd} ${
                              isDarkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {sample.family} {sample.size}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <code
                            className={`font-mono text-[11px] ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            TYPE.{sample.role}
                          </code>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`${sample.className} ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {sample.sample}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 pr-4 ${TYPE.bodySm} ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {sample.mapsTo}
                        </td>
                        <td className="py-3.5 pr-0">
                          <code
                            className={`font-mono text-[11px] break-all ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {sample.className}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className={`mt-5 rounded-xl border p-4 space-y-2 ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <p
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Reserved (not in chrome yet)
                </p>
                {TYPE_RESERVED.map((item) => (
                  <p
                    key={item.family}
                    className={`${TYPE.bodySm} ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <span className="font-semibold">{item.family}</span> — {item.note}
                  </p>
                ))}
              </div>
            </GuideSection>

            <GuideSection
              title="Weight & tracking"
              description="M3 keeps most Body Regular and Titles Semibold/Bold. Tracking is only for Label Micro eyebrows."
              isDarkMode={isDarkMode}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {FONT_WEIGHTS.map((w) => (
                  <div
                    key={w.label}
                    className={`rounded-xl border p-3 ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-300'
                    }`}
                  >
                    <p
                      className={`text-lg ${w.className} ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {w.label}
                    </p>
                    <p
                      className={`text-[11px] mt-1 font-mono ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {w.className}
                    </p>
                    <p className={`${TYPE.bodySm} mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {w.use}
                    </p>
                  </div>
                ))}
              </div>
              <ul
                className={`text-sm space-y-2 list-disc pl-5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <li>
                  <code className="font-mono">tracking-tight</code> — header product / app name
                </li>
                <li>
                  <code className="font-mono">tracking-wider</code> + uppercase — micro and section
                  labels only
                </li>
                <li>Do not invent mid-weights (medium / extrabold) unless matching an existing pattern</li>
              </ul>
            </GuideSection>

            <GuideSection
              title="Text color"
              description="Neutrals are slate; brand accent comes from the active app primary (theme.text)."
              isDarkMode={isDarkMode}
            >
              <div className="space-y-3">
                {TEXT_COLORS.map((c) => {
                  const colorClass =
                    c.light === 'theme.text'
                      ? previewTheme.text
                      : isDarkMode
                        ? c.dark
                        : c.light;
                  return (
                    <div
                      key={c.label}
                      className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 pb-3 border-b last:border-0 last:pb-0 ${
                        isDarkMode ? 'border-slate-700' : 'border-slate-200'
                      }`}
                    >
                      <p
                        className={`w-28 shrink-0 ${TYPE.labelMicro} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {c.label}
                      </p>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${colorClass}`}>Almost before we knew it</p>
                        <p
                          className={`text-[11px] mt-1 ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {c.note} ·{' '}
                          <code className="font-mono">
                            {isDarkMode ? c.dark : c.light}
                          </code>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GuideSection>

            <GuideSection
              title="Accessibility fonts"
              description="Optional high-legibility typefaces, text size, and presentation switches (reduce motion, higher contrast, larger controls, underline links) in Settings. Baseline shell a11y — skip link, landmarks, focus-visible, OS reduced-motion, live announcer — is always on."
              isDarkMode={isDarkMode}
            >
              <div className="space-y-3">
                {ACCESSIBLE_FONTS.map((font) => (
                  <div
                    key={font.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 pb-3 border-b last:border-0 last:pb-0 ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-200'
                    }`}
                  >
                    <p
                      className={`w-28 shrink-0 ${TYPE.labelMicro} ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {font.label}
                    </p>
                    <div className="min-w-0">
                      <p
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                        style={font.cssFamily ? { fontFamily: font.cssFamily } : undefined}
                      >
                        The quick brown fox jumps over the lazy dog.
                      </p>
                      <p
                        className={`${TYPE.bodySm} mt-1 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {font.description}
                        {font.id !== 'default' ? (
                          <>
                            {' '}
                            · Google Font ·{' '}
                            <code className="font-mono">id: {font.id}</code>
                          </>
                        ) : (
                          <>
                            {' '}
                            · <code className="font-mono">font-sans</code> / system stack
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={`mt-5 rounded-xl border p-4 space-y-3 ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <p
                  className={`${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Text size
                </p>
                <div className="space-y-2">
                  {TEXT_SIZES.map((size) => (
                    <div
                      key={size.id}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"
                    >
                      <p
                        className={`w-28 shrink-0 ${TYPE.labelMd} ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {size.label}
                      </p>
                      <p
                        className={`${TYPE.bodySm} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Root font size {size.rootPercent}% · scales rem-based UI everywhere
                      </p>
                    </div>
                  ))}
                </div>
                <p
                  className={`${TYPE.bodySm} pt-1 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Teachers pick these under Settings → Accessibility. Do not hard-code a
                  webfont on individual screens — keep product chrome on{' '}
                  <code className="font-mono">TYPE</code> roles and let the preference layer
                  swap the family. Presentation switches set{' '}
                  <code className="font-mono">data-edu-*</code> flags on{' '}
                  <code className="font-mono">html</code>; announce teaching outcomes with{' '}
                  <code className="font-mono">useAnnounce()</code>.
                </p>
              </div>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'buttons' ? (
          <GuideSection
            title="Buttons"
            description="Primary fills use colorPrimary + colorOnPrimary. Tool buttons and FABs are detailed under Patterns."
            isDarkMode={isDarkMode}
          >
            <div className="mb-5 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
              <p
                className={`text-xs font-semibold mb-2.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Theme color
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRIMARY_KEYS.map((key) => {
                  const t = primaryPalettes[key];
                  const selected = previewThemeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreviewThemeKey(key)}
                      title={key}
                      aria-label={`${key} primary`}
                      aria-pressed={selected}
                      className={`w-9 h-9 rounded-full ${t.colorPrimary} shrink-0 transition-transform ${
                        selected
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
            <div className="flex flex-wrap items-center gap-3">
              <ModalPrimaryButton theme={previewTheme}>Primary</ModalPrimaryButton>
              <ModalPrimaryButton theme={previewTheme} disabled>
                Disabled
              </ModalPrimaryButton>
              <button type="button" className={toolBtn}>
                <Settings2 size={16} strokeWidth={2.5} />
                Tool button
              </button>
              <button
                type="button"
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${previewTheme.colorPrimary} ${previewTheme.colorOnPrimary}`}
                aria-label="FAB example"
              >
                <Plus size={24} strokeWidth={2.5} />
              </button>
              <span className={`${TYPE.labelMd} ${previewTheme.text}`}>Theme text link</span>
            </div>
            <p className={`${TYPE.bodySm} mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Use <code className="font-mono">ModalPrimaryButton</code> for modal footers. Put
              Place primary FABs in the AppShell content column (opposite the sidebar) — see Patterns.
            </p>
          </GuideSection>
        ) : null}

        {guideTab === 'patterns' ? (
          <>
            <StyleGuideCard
              title="App shell padding"
              token="SHELL_MAIN_PADDING"
              description="Single source of truth for the AppShell main inset. Every app inherits this — do not add extra horizontal padding on the root view."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                { label: 'Token', value: SHELL_MAIN_PADDING, note: 'shared/layout.js' },
                { label: 'Mobile / tablet', value: `${SHELL_PADDING_PX.base}px`, note: 'p-4 (1rem)' },
                { label: 'Desktop (lg+)', value: `${SHELL_PADDING_PX.lg}px`, note: 'lg:p-6 (1.5rem)' },
                { label: 'Applied on', value: '<main>', note: 'AppShell.jsx only' },
              ]}
              doList={[
                'Let AppShell own all edge padding — apps fill the content area.',
                'Use AppPageShell variants for inner layout (stage / scroll / page).',
                'Import SHELL_MAIN_PADDING if you need to match the inset in a demo or widget.',
              ]}
              dontList={[
                'Add px-* on app root wrappers — it doubles the inset.',
                'Use p-4, p-5, or p-8 on the shell — stick to the token.',
                'Center app content with mx-auto unless a view explicitly needs it.',
              ]}
            >
              <ShellInsetPreview isDarkMode={isDarkMode} theme={previewTheme} />
            </StyleGuideCard>

            <StyleGuideCard
              title="Static boards"
              token="APP_STATIC_BOARD"
              description="A single board that fills the content height. Full width uses max-w-7xl. Medium (max-w-2xl) and small (max-w-md) stay height-locked but center a narrower card when a full-bleed board stretches the interaction."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                {
                  label: 'Full',
                  value: 'APP_STATIC_BOARD',
                  note: APP_BOARD_MAX_WIDTH,
                },
                {
                  label: 'Medium',
                  value: 'APP_STATIC_BOARD_MD',
                  note: 'max-w-2xl · centered',
                },
                {
                  label: 'Small',
                  value: 'APP_STATIC_BOARD_SM',
                  note: 'max-w-md · centered',
                },
                {
                  label: 'Board pad',
                  value: 'APP_BOARD_PAD',
                  note: 'p-5 sm:p-6 · default',
                },
                {
                  label: 'Stage pad',
                  value: 'APP_STAGE_PAD',
                  note: 'p-3 sm:p-5 · dense tools',
                },
                {
                  label: 'Chrome',
                  value: 'rounded-2xl border-[1.5px]',
                  note: 'No shadow — border only',
                },
                {
                  label: 'Layout',
                  value: 'h-full · overflow-hidden',
                  note: 'Fills content height · no board scroll',
                },
                {
                  label: 'Shell',
                  value: 'variant="stage"',
                  note: 'Static — AppShell main does not scroll',
                },
              ]}
              doList={[
                'Use full static for wide stages; medium/small for focused widgets.',
                'Use APP_BOARD_PAD inside boards; APP_STAGE_PAD for dense stage tools.',
                'Pair with AppPageShell variant="stage".',
                'Keep one static board per view.',
              ]}
              dontList={[
                'Let AppShell main scroll — the board should fit.',
                'Invent one-off max-w / max-h or p-* on stage cards.',
                'Use a grid of cards when you need one fill-height surface.',
              ]}
            />

            <StyleGuideCard
              title="Scrolling boards"
              token="APP_SCROLL_BOARD"
              description="Same chrome and max-width as a static board; height follows content. If the board stretches past the bottom of the screen, the regular AppShell scrollbar appears on the content edge — not on the card."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                {
                  label: 'Token',
                  value: APP_SCROLL_BOARD,
                  note: 'Same chrome as APP_STATIC_BOARD',
                },
                {
                  label: 'Max width',
                  value: APP_BOARD_MAX_WIDTH,
                  note: 'Centered with mx-auto',
                },
                {
                  label: 'Height',
                  value: 'content-driven',
                  note: 'No h-full lock',
                },
                {
                  label: 'Overflow',
                  value: 'AppShell edge',
                  note: 'Regular scrollbar — not on the card',
                },
              ]}
              doList={[
                'Use when a single board’s content may grow taller than the screen.',
                'Keep the same surface, border, and max-width as static boards.',
                'Let the AppShell content edge scroll — don’t put overflow-auto on the board or page shell.',
              ]}
              dontList={[
                'Lock height with h-full when content needs to extend.',
                'Put overflow-auto on the board or an inner max-w wrapper for this pattern.',
                'Invent a different radius or border weight than static boards.',
              ]}
            />

            <StyleGuideCard
              title="Internal scroll"
              token="APP_BOARD_BODY_SCROLL"
              description="Static board stays viewport-locked. An interior pane scrolls under a shrink-0 header — vertically for long content, horizontally for wide tables (type scale, data grids)."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                {
                  label: 'Shell',
                  value: 'APP_STATIC_BOARD',
                  note: 'h-full · overflow-hidden · stage',
                },
                {
                  label: 'Body',
                  value: APP_BOARD_BODY_SCROLL,
                  note: 'flex-1 min-h-0 overflow-auto',
                },
                {
                  label: 'Header',
                  value: 'shrink-0',
                  note: 'Title / filters stay put',
                },
                {
                  label: 'When',
                  value: 'tables · long lists',
                  note: 'Chrome must stay; content moves',
                },
              ]}
              doList={[
                'Keep AppShell main locked (stage) — scroll lives inside the board.',
                'Put APP_BOARD_BODY_SCROLL on the body under a shrink-0 header.',
                'Use overflow-auto so wide tables can scroll horizontally too.',
              ]}
              dontList={[
                'Scroll AppShell main for this pattern — that is Scrolling board.',
                'Put overflow-auto on the outer static board (clips the header).',
                'Invent a second board chrome for the scroll pane.',
              ]}
            />

            <StyleGuideCard
              title="Grid cards"
              token="APP_GRID_CARD"
              description="Content-sized cards in a dynamic grid (timers, clocks, groups). When creating a grid-card app, ask what the minimum cards-per-row should be before building the layout."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                { label: 'Token', value: APP_GRID_CARD, note: '+ colorSurface + colorOutline' },
                { label: 'Size', value: 'fits content', note: 'No forced fill-height' },
                { label: 'Grid', value: 'min cards / row', note: 'Confirm with product when creating the app' },
                { label: 'Nested card', value: APP_NESTED_CARD, note: 'Soft fill — not white' },
                { label: 'Empty slot', value: APP_EMPTY_SLOT, note: 'Waiting for action' },
                { label: 'Shell', value: 'variant="scroll"', note: 'Page scrolls with the grid' },
              ]}
              doList={[
                'Ask for the minimum cards-per-row before laying out a new grid app.',
                'Fill every grid card with theme.colorSurface + theme.colorOutline.',
                'Nest APP_NESTED_CARD panels inside a board or grid card — never invent a third radius.',
              ]}
              dontList={[
                'Guess a column count — confirm the minimum per row first.',
                'Use border-2 or rounded-3xl — stick to board chrome (border-[1.5px], no shadow).',
                'Stretch grid cards to fill the stage like a static board.',
              ]}
            >
              <ContentCardsPreview isDarkMode={isDarkMode} theme={previewTheme} />
            </StyleGuideCard>

            <StyleGuideCard
              title="Card styles (Material 3)"
              token="Outlined · Filled · Accessibility"
              description="Edu.Hub follows M3 card guidelines: one subject per card; outlined is the default (border, no shadow). Filled uses surface-variant for softer separation. Elevated is not used — we never invent drop shadows on boards. Live demos live under Cards → Card Styles."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                {
                  label: 'Outlined',
                  value: 'APP_GRID_CARD + colorSurface + colorOutline',
                  note: 'Default · M3 outlined',
                },
                {
                  label: 'Filled',
                  value: 'colorSurfaceVariant',
                  note: 'Softer · inside a host board',
                },
                {
                  label: 'Elevated',
                  value: 'Not used',
                  note: 'No card shadows in Edu.Hub',
                },
                {
                  label: 'Anatomy',
                  value: 'Headline → subhead → body → actions',
                  note: 'Cards → Content hierarchy',
                },
                {
                  label: 'A11y',
                  value: 'group + labelledby · edu-control',
                  note: 'Cards → Accessibility',
                },
                {
                  label: 'Headers',
                  value: 'Primary / container / white+border',
                  note: 'Cards → Cards With Headers',
                },
              ]}
              doList={[
                'Default to outlined grid/board chrome (border-[1.5px], no shadow).',
                'Pair every fill with matching on-* text roles for contrast.',
                'Put real buttons with edu-control inside interactive cards.',
                'Name card groups with a visible headline + aria-labelledby when needed.',
              ]}
              dontList={[
                'Use elevation/shadows to separate cards from the shell.',
                'Rely on color alone for selected or active card state.',
                'Make the whole card clickable without keyboard focus and a clear name.',
                'Put muted text on solid primary headers — use colorOnPrimary.',
              ]}
            />

            <StyleGuideCard
              title="Card layout types"
              token="Static · Scrolling · Internal · Grid"
              description="Typography and structure inside each layout token. Open Cards → Card Types for live previews in the real shell."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                {
                  label: 'Static board',
                  value: 'APP_STATIC_BOARD',
                  note: 'Full width · fill-height',
                },
                {
                  label: 'Static medium',
                  value: 'APP_STATIC_BOARD_MD',
                  note: 'max-w-2xl · centered',
                },
                {
                  label: 'Static small',
                  value: 'APP_STATIC_BOARD_SM',
                  note: 'max-w-md · centered',
                },
                {
                  label: 'Scrolling board',
                  value: 'APP_SCROLL_BOARD',
                  note: 'Same chrome · regular scrollbar if tall',
                },
                {
                  label: 'Internal scroll',
                  value: 'APP_BOARD_BODY_SCROLL',
                  note: 'Static shell · body scrolls',
                },
                {
                  label: 'Grid card',
                  value: 'APP_GRID_CARD',
                  note: 'Content-sized · set min / row',
                },
                {
                  label: 'Nested / Empty',
                  value: 'APP_NESTED_CARD / APP_EMPTY_SLOT',
                  note: 'Helpers inside boards',
                },
              ]}
              doList={[
                'Pick Static, Scrolling, Internal, or Grid before detailing content styles.',
                'Keep one title and one supporting line at the top of a board.',
                'Center empty-slot copy and keep it short and actionable.',
              ]}
              dontList={[
                'Stack multiple headlines inside a single card.',
                'Put dense metadata or stats in the first lines of a card.',
                'Fill empty slots with long paragraphs.',
              ]}
            >
              <ContentCardStylesPreview isDarkMode={isDarkMode} theme={previewTheme} />
            </StyleGuideCard>

            <StyleGuideCard
              title="App page shells"
              token="AppPageShell"
              description="Three variants for mini-app root views. Import from shared/AppPageShell — never copy the class strings."
              isDarkMode={isDarkMode}
              accentClass={previewTheme.text}
              specs={[
                { label: 'stage', value: 'variant="stage"', note: 'Static board · no shell scroll' },
                { label: 'scroll', value: 'variant="scroll"', note: `Lists + FAB · ${APP_SCROLL_BOTTOM}` },
                { label: 'page', value: 'variant="page"', note: `Static screens · ${APP_PAGE_BOTTOM}` },
                { label: 'Max width', value: APP_MAX_WIDTH, note: 'Left-aligned, no mx-auto' },
              ]}
              doList={[
                'Wrap every app root in <AppPageShell variant="…">.',
                'Pick stage for a static board (fits viewport, no shell scroll).',
                'Pick scroll for scrolling boards or grid-card layouts.',
              ]}
              dontList={[
                'Mix pb-10, pb-20, and pb-24 arbitrarily — use scroll or page variant.',
                'Add mx-auto on app wrappers.',
                'Nest max-w-7xl inside max-w-7xl.',
              ]}
            >
              <div className="space-y-3">
                {[
                  { label: 'stage', classes: APP_STAGE_SHELL },
                  { label: 'scroll', classes: APP_SCROLL_SHELL },
                  { label: 'page', classes: APP_PAGE_SHELL },
                ].map(({ label, classes }) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 ${
                      isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <p className={`${TYPE.labelMicro} mb-1 ${previewTheme.text}`}>
                      {label}
                    </p>
                    <code
                      className={`block text-[11px] font-mono leading-relaxed ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {classes}
                    </code>
                  </div>
                ))}
              </div>
              <code
                className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >{`import { AppPageShell } from '../../shared/AppPageShell';

export function MyApp({ activeTab, ... }) {
  return (
    <AppPageShell variant="scroll">
      {activeTab === 'Home' ? <HomeView /> : null}
    </AppPageShell>
  );
}`}</code>
            </StyleGuideCard>

            <GuideSection
              title="App layout shells"
              description="Outer page width is max-w-7xl. Pick the shell by whether the stage scrolls or locks to the viewport."
              isDarkMode={isDarkMode}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p
                    className={`${TYPE.labelMicro} mb-2 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Stage (no scroll)
                  </p>
                  <p className={`${TYPE.titleSm} mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Game / fill-height tools
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed mb-3 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {APP_STAGE_SHELL}
                  </code>
                  <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pick A Number, Coin Toss, Random Tiebreaker use{' '}
                    <code className="font-mono">APP_STATIC_BOARD_MD</code> (centered medium).
                    Wide stages use full <code className="font-mono">APP_STATIC_BOARD</code>.
                    Shell stays static — no AppShell main scroll.
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p
                    className={`${TYPE.labelMicro} mb-2 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Scroll + FAB clearance
                  </p>
                  <p className={`${TYPE.titleSm} mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Lists / tall boards
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed mb-3 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {APP_SCROLL_SHELL}
                  </code>
                  <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pick A Card, Student Showdown, Classes, Students. <code className="font-mono">pb-24</code>{' '}
                    keeps content above the fixed FAB.
                  </p>
                </div>
              </div>
              <p className={`${TYPE.bodySm} mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Dashboard teaching widgets must mirror these shells (
                <code className="font-mono">flex-1</code> + same overflow /{' '}
                <code className="font-mono">pb-24</code> rules) so widgets match the source app.
              </p>
            </GuideSection>

            <GuideSection
              title="Card surfaces"
              description="Static boards: APP_STATIC_BOARD (full), APP_STATIC_BOARD_MD, APP_STATIC_BOARD_SM. Scrolling boards use APP_SCROLL_BOARD. Internal scroll uses APP_STATIC_BOARD + APP_BOARD_BODY_SCROLL. Grid cards use APP_GRID_CARD. Nested panels use APP_NESTED_CARD."
              isDarkMode={isDarkMode}
            >
              <div
                className={`${APP_SCROLL_BOARD} p-5 ${teachingSurface}`}
              >
                <p
                  className={`text-sm font-black mb-3 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Scrolling board
                </p>
                <code
                  className={`block text-[11px] font-mono mb-4 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {APP_SCROLL_BOARD} · colorSurface · colorOutline
                </code>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className={`${APP_NESTED_CARD} p-4 ${nestedSurface}`}>
                    <p
                      className={`text-xs font-bold ${previewTheme.text}`}
                    >
                      Nested card
                    </p>
                    <code
                      className={`block text-[10px] font-mono mt-2 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {APP_NESTED_CARD}
                    </code>
                  </div>
                  <div
                    className={`h-16 ${APP_EMPTY_SLOT} flex items-center justify-center text-xs font-bold ${
                      isDarkMode
                        ? 'border-slate-600 text-slate-500'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    Empty slot
                  </div>
                </div>
              </div>
              <p className={`${TYPE.bodySm} mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Import tokens from <code className="font-mono">shared/layout.js</code>. Don&apos;t
                invent a third radius for teaching content.
              </p>
            </GuideSection>

            <GuideSection
              title="Toolbar (ButtonRow)"
              description="shared/ButtonRow — tool chips aligned end, under the page header or above a stage."
              isDarkMode={isDarkMode}
            >
              <ButtonRow>
                <button type="button" className={`${toolBtn} disabled:opacity-50`}>
                  <RotateCcw size={16} strokeWidth={2.5} />
                  Reset
                </button>
                <button type="button" className={toolBtn}>
                  <Settings2 size={16} strokeWidth={2.5} />
                  Settings
                </button>
              </ButtonRow>
              <code
                className={`block text-[11px] font-mono leading-relaxed ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {`h-9 px-3 rounded-xl text-xs font-bold · light: bg-white border-slate-300 · dark: bg-slate-800`}
                <br />
                Icons: Lucide size=16 strokeWidth=2.5
              </code>
            </GuideSection>

            <GuideSection
              title="Floating action button"
              description="Primary action for a tool. One per screen, fixed in the AppShell content column — bottom-right when the sidebar sits left, bottom-left when flipped."
              isDarkMode={isDarkMode}
            >
              <div
                className={`relative h-40 rounded-xl border overflow-hidden ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <p
                  className={`absolute top-3 left-3 ${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Stage preview
                </p>
                <button
                  type="button"
                  className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 ${previewTheme.colorPrimary} ${previewTheme.colorOnPrimary}`}
                  aria-label="FAB example"
                >
                  <Shuffle size={24} />
                </button>
              </div>
              <code
                className={`block text-[11px] font-mono leading-relaxed mt-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                appFabClass(isLeft) · colorPrimary / colorOnPrimary · icon size 24
              </code>
              <p className={`${TYPE.bodySm} mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Pair with scroll shell <code className="font-mono">pb-24</code>. Secondary surface
                FABs (white / slate border) are for stacks — keep the primary CTA filled.
                Always pass the app's <code className="font-mono">isLeft</code> prop into{' '}
                <code className="font-mono">appFabClass(isLeft)</code> so the FAB flips to the
                opposite bottom corner when the sidebar is flipped.
              </p>
            </GuideSection>

            <GuideSection
              title="Switch"
              description="Binary settings control. Use role=switch and aria-checked."
              isDarkMode={isDarkMode}
            >
              <div className="flex items-center justify-between gap-4 max-w-md">
                <div className="min-w-0">
                  <p
                    className={`${TYPE.titleSm} ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Show history
                  </p>
                  <p
                    className={`${TYPE.bodySm} mt-1 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Label + one short helper line
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={demoSwitchOn}
                  aria-label="Show history"
                  onClick={() => setDemoSwitchOn((v) => !v)}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                    demoSwitchOn
                      ? previewTheme.colorPrimary
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      demoSwitchOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </GuideSection>

            <GuideSection
              title="Sliding segmented control"
              description="Two-option mode toggle with a sliding primary thumb (e.g. 1 v 1 / Team)."
              isDarkMode={isDarkMode}
            >
              <div className="flex justify-end">
                <div
                  className={`relative grid grid-cols-2 p-1 rounded-xl ${
                    isDarkMode
                      ? 'bg-slate-800'
                      : 'bg-white border border-slate-300'
                  }`}
                  role="group"
                  aria-label="Mode"
                >
                  <span
                    aria-hidden
                    className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-out ${previewTheme.colorPrimary} ${
                      demoSegment === 'team' ? 'translate-x-full' : 'translate-x-0'
                    }`}
                  />
                  {[
                    { id: '1v1', label: '1 v 1', Icon: User },
                    { id: 'team', label: 'Team', Icon: Users },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={demoSegment === id}
                      onClick={() => setDemoSegment(id)}
                      className={`relative z-10 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg ${TYPE.labelMd} transition-colors ${
                        demoSegment === id
                          ? previewTheme.colorOnPrimary
                          : isDarkMode
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={16} strokeWidth={2.5} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className={`${TYPE.bodySm} mt-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Distinct from Settings chip groups (no sliding thumb — each chip fills when selected).
              </p>
            </GuideSection>

            <GuideSection
              title="Settings modal"
              description="Temp state while open; Apply commits. Cancel discards. Footer = Cancel + ModalPrimaryButton."
              isDarkMode={isDarkMode}
            >
              <button
                type="button"
                onClick={() => {
                  setDemoTempSwitch(demoSwitchOn);
                  setDemoSettingsOpen(true);
                }}
                className={toolBtn}
              >
                <Settings2 size={16} strokeWidth={2.5} />
                Open settings demo
              </button>
              <ul
                className={`text-xs mt-4 space-y-1.5 list-disc pl-5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <li>
                  <code className="font-mono">Modal</code> title &quot;Settings&quot;, usually{' '}
                  <code className="font-mono">max-w-sm</code>
                </li>
                <li>
                  Body <code className="font-mono">p-6</code> — switch rows or option grids with{' '}
                  <code className="font-mono">border-2</code> selected pills
                </li>
                <li>Cancel text button + Apply Changes primary</li>
              </ul>

              <Modal
                isOpen={demoSettingsOpen}
                title="Settings"
                theme={previewTheme}
                isDarkMode={isDarkMode}
                onClose={() => setDemoSettingsOpen(false)}
                maxWidth="max-w-sm"
                footer={
                  <>
                    <button
                      type="button"
                      onClick={() => setDemoSettingsOpen(false)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        isDarkMode
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Cancel
                    </button>
                    <ModalPrimaryButton
                      theme={previewTheme}
                      onClick={() => {
                        setDemoSwitchOn(demoTempSwitch);
                        setDemoSettingsOpen(false);
                      }}
                    >
                      Apply Changes
                    </ModalPrimaryButton>
                  </>
                }
              >
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Example option
                      </p>
                      <p
                        className={`${TYPE.bodySm} mt-1 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Changes apply only when you confirm
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={demoTempSwitch}
                      onClick={() => setDemoTempSwitch((v) => !v)}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                        demoTempSwitch
                          ? previewTheme.colorPrimary
                          : isDarkMode
                            ? 'bg-slate-700'
                            : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          demoTempSwitch ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Modal>
            </GuideSection>

            <GuideSection
              title="In-card empty"
              description="Muted placeholder inside a teaching card — not the dashed full-page EmptyState."
              isDarkMode={isDarkMode}
            >
              <div
                className={`${APP_GRID_CARD} flex flex-col items-center justify-center opacity-40 py-10 min-h-[160px] ${teachingSurface}`}
              >
                <Users size={48} className="mb-3" />
                <p className={`${TYPE.titleSm} text-center px-6`}>
                  Short prompt for the next action
                </p>
              </div>
              <p className={`${TYPE.bodySm} mt-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Use <code className="font-mono">EmptyState</code> for app-level gates (no class
                selected). Use in-card empty when the stage is ready but waiting on a FAB action.
              </p>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'navigation' ? (
          <>
            <GuideSection
              title="Sidebar nav items"
              description="Every app declares a nav[] array in its config.js. The shell renders these as sidebar items with four possible types."
              isDarkMode={isDarkMode}
            >
              <div className="space-y-4">
                {[
                  {
                    type: 'link',
                    desc: 'Direct view — clicking sets activeTab to item.name and renders the matching view.',
                    code: `{ id: 'wheel', name: 'Wheel of Names', icon: CircleDashed, type: 'link' }`,
                    example: 'Randomizer, NoiseMeter, Timer tabs',
                  },
                  {
                    type: 'panel',
                    desc: 'Opens a secondary sidebar panel. Use panelSource: "classes" to auto-populate from the class list, or provide static panelContent[].',
                    code: `{ id: 'classes', name: 'Classes', icon: Layers, type: 'panel',\n  panelTitle: 'Classes', panelSource: 'classes', panelContent: [] }`,
                    example: 'Classes panel in Randomizer, TieBreaker, Groups',
                  },
                  {
                    type: 'accordion',
                    desc: 'Expands inline sub-items when sidebar is open. Sub-items are strings that map to views.',
                    code: `{ id: 'tools', name: 'Tools', icon: Wrench, type: 'accordion',\n  subItems: ['Sub A', 'Sub B'] }`,
                    example: 'Hub "Quick Tools" section',
                  },
                  {
                    type: 'popout',
                    desc: 'Opens a floating action menu next to the nav item. Uses item.actions[] for entries.',
                    code: `{ id: 'more', name: 'More', icon: MoreVertical, type: 'popout',\n  actions: [{ name: 'Option', icon: Star }] }`,
                    example: 'Hub settings popout',
                  },
                ].map((item) => (
                  <div
                    key={item.type}
                    className={`rounded-xl border p-4 ${
                      isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-baseline gap-3 mb-2">
                      <span
                        className={`${TYPE.labelMicro} ${previewTheme.text}`}
                      >
                        {item.type}
                      </span>
                      <span
                        className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        {item.example}
                      </span>
                    </div>
                    <p
                      className={`${TYPE.bodyMd} mb-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {item.desc}
                    </p>
                    <code
                      className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {item.code}
                    </code>
                  </div>
                ))}
              </div>
            </GuideSection>

            <GuideSection
              title="Nav item anatomy"
              description="Active items fill with colorPrimary. Inactive items use colorOnSurfaceVariant with hover highlight."
              isDarkMode={isDarkMode}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Active
                  </p>
                  <div
                    className={`flex items-center gap-4 h-12 px-3 rounded-xl ${previewTheme.colorPrimary} ${previewTheme.colorOnPrimary}`}
                  >
                    <Shuffle size={20} strokeWidth={2.5} />
                    <span className={TYPE.titleSm}>Randomizer</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p
                    className={`${TYPE.labelMicro} ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Inactive
                  </p>
                  <div
                    className={`flex items-center gap-4 h-12 px-3 rounded-xl ${
                      isDarkMode
                        ? 'text-slate-400 bg-slate-800/50'
                        : 'text-slate-500 bg-slate-50'
                    }`}
                  >
                    <Settings2 size={20} strokeWidth={2} />
                    <span className={TYPE.titleSm}>Settings</span>
                  </div>
                </div>
              </div>
              <div className={`${TYPE.bodySm} mt-4 space-y-1.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <p>
                  Size: <code className="font-mono">h-12 rounded-xl</code> · Open sidebar: labels visible · Collapsed rail: icons + tooltip
                </p>
                <p>
                  Icons: Lucide <code className="font-mono">size=20</code>, active <code className="font-mono">strokeWidth=2.5</code>, inactive <code className="font-mono">strokeWidth=2</code>
                </p>
              </div>
            </GuideSection>

            <GuideSection
              title="Sidebar states"
              description="Desktop: collapsible between full (w-64) and rail (w-20). Mobile: off-canvas drawer, always shows labels."
              isDarkMode={isDarkMode}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Open (desktop)
                  </p>
                  <code className={`block text-[11px] font-mono leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    w-64 · Logo horizontal · Labels + chevrons visible
                  </code>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Collapsed (rail)
                  </p>
                  <code className={`block text-[11px] font-mono leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    w-20 · Logo 2×2 icon · Icons centered · Hover tooltip
                  </code>
                </div>
              </div>
              <ul
                className={`text-sm space-y-2 list-disc pl-5 mt-4 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <li>Bottom controls: Dark/Light toggle + Flip sidebar side</li>
                <li>Secondary panel opens next to sidebar for <code className="font-mono">type: &apos;panel&apos;</code> items (class picker, resources)</li>
                <li>Header height: <code className="font-mono">{NAV_HEIGHT}</code> — same for sidebar header and top bar</li>
              </ul>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'app' ? (
          <>
            <GuideSection
              title="Registering a new app"
              description="Every mini-app needs a config, a View component, and entries in index.js + launcher.js."
              isDarkMode={isDarkMode}
            >
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${previewTheme.text}`}>
                    1. config.js
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >{`export const myApp = {
  id: 'myapp',
  name: 'MyApp',
  themeKey: 'MyApp',     // maps to appThemes / primaryPalettes
  defaultView: 'Home',   // initial activeTab
  nav: [
    { id: 'home', name: 'Home', icon: Home, type: 'link' },
    // ...more nav items
  ],
  View: MyAppComponent,  // receives { activeTab, isDarkMode, theme }
};`}</code>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${previewTheme.text}`}>
                    2. apps/index.js
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >{`import { myApp } from './myapp/config';

export const apps = {
  // ...existing apps
  [myApp.id]: myApp,
};`}</code>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${previewTheme.text}`}>
                    3. apps/launcher.js
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >{`{
  id: 'myapp',
  name: 'MyApp',
  icon: Sparkle,
  color: 'bg-violet-500',        // launcher tile color
  description: 'What this app does.',
}`}</code>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <p className={`${TYPE.labelMicro} mb-2 ${previewTheme.text}`}>
                    4. shared/theme.js
                  </p>
                  <code
                    className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >{`// appThemes — add the default primary
MyApp: { ...primaryPalettes.Purple },

// appThemePrimaryKeys — add the default key
MyApp: 'Purple',`}</code>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              title="App config shape"
              description="The shell reads these fields from your config to drive the sidebar, header, and routing."
              isDarkMode={isDarkMode}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      <th className="py-2 pr-4 font-bold">Field</th>
                      <th className="py-2 pr-4 font-bold">Type</th>
                      <th className="py-2 font-bold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
                    }`}
                  >
                    {[
                      ['id', 'string', 'Unique key — used in apps{}, launcher, and URL routing'],
                      ['name', 'string', 'Display name in header: Edu.[name]'],
                      ['themeKey', 'string', 'Maps to appThemes in theme.js for the default primary'],
                      ['defaultView', 'string', 'Initial activeTab when entering the app'],
                      ['nav', 'NavItem[]', 'Sidebar items — link, panel, accordion, or popout types'],
                      ['View', 'Component', 'Root component — receives { activeTab, isDarkMode, theme }'],
                    ].map(([field, type, purpose]) => (
                      <tr key={field}>
                        <td className="py-2.5 pr-4 font-mono font-bold">{field}</td>
                        <td className="py-2.5 pr-4 font-mono text-[11px]">{type}</td>
                        <td className="py-2.5">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GuideSection>

            <GuideSection
              title="View component contract"
              description="Your root View component always receives these props from the shell."
              isDarkMode={isDarkMode}
            >
              <code
                className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >{`function MyApp({ activeTab, isDarkMode, theme }) {
  // activeTab: string — current sidebar nav item name
  // isDarkMode: boolean — light/dark mode
  // theme: object — from getTheme(), contains all Material role classes
  
  return (
    <AppPageShell variant="stage">
      {activeTab === 'Home' ? <HomeView ... /> : null}
      {activeTab === 'Settings' ? <SettingsView ... /> : null}
    </AppPageShell>
  );
}`}</code>
              <ul
                className={`text-sm space-y-2 list-disc pl-5 mt-4 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <li>Route views by matching <code className="font-mono">activeTab</code> to nav item names</li>
                <li>Wrap the root in <code className="font-mono">AppPageShell</code> — stage, scroll, or page variant</li>
                <li>Pass <code className="font-mono">theme</code> down — never call <code className="font-mono">getTheme()</code> inside child views</li>
                <li>If your app needs class data, use <code className="font-mono">useClasses()</code> from the shared context</li>
              </ul>
            </GuideSection>

            <GuideSection
              title="Dashboard widget (optional)"
              description="Apps can expose teaching widgets that pin to the Dashboard sidebar."
              isDarkMode={isDarkMode}
            >
              <div className="space-y-4">
                <code
                  className={`block text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >{`// widgets/MyWidget.jsx
export function MyWidget({ isDarkMode, theme }) {
  return (
    <div className="flex-1 h-full min-h-0 max-w-7xl overflow-hidden">
      <MyStage mode="..." isDarkMode={isDarkMode} theme={theme} />
    </div>
  );
}

// widgets/registry.js — add to the correct app group
{
  id: 'my-widget',
  name: 'My Widget',
  description: 'Short description for the widget catalog.',
  icon: Sparkle,
  available: true,
  Component: MyWidget,
}`}</code>
                <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Widgets must mirror the app&apos;s layout shell so they match the source app exactly.
                  Max pinned widgets: <code className="font-mono">MAX_DASHBOARD_WIDGETS (5)</code>.
                </p>
              </div>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'colors' ? (
          <>
            <GuideSection
              title="Color contrast & palettes"
              description="WCAG pairings for HubBrand primaries, leveled scales, and neutrals. Prototype in HubBrand → Color Test."
              isDarkMode={isDarkMode}
            >
              <BrandColorGuideSections isDarkMode={isDarkMode} />
            </GuideSection>

            <GuideSection
              title="Material color roles"
              description="Edu.Hub maps brand fills onto Material 3 role language (primary, on-primary, surface, error, …). Use role tokens so content stays readable on fills. Surfaces flip with light/dark mode. Reference: m3.material.io/styles/color/roles."
              isDarkMode={isDarkMode}
            >
              <div className="mb-6 pb-5 border-b border-dashed border-slate-200 dark:border-slate-700">
                <p
                  className={`text-xs font-semibold mb-2.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Theme color
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRIMARY_KEYS.map((key) => {
                    const t = primaryPalettes[key];
                    const selected = previewThemeKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPreviewThemeKey(key)}
                        title={key}
                        aria-label={`${key} primary`}
                        aria-pressed={selected}
                        className={`edu-control w-9 h-9 rounded-full ${t.colorPrimary} shrink-0 transition-transform ${
                          selected
                            ? isDarkMode
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                              : 'ring-2 ring-slate-800 ring-offset-2 ring-offset-white scale-105'
                            : 'hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>
                <p
                  className={`text-[11px] font-mono mt-3 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Previewing <span className={`font-bold ${previewTheme.text}`}>{previewThemeKey}</span>
                  {' · '}
                  {previewTheme.primary}
                </p>
              </div>

              <div className="mb-6">
                <ColorThemeRolesCard
                  themeRoles={colorThemeRolesFromPrimaryKey(
                    previewThemeKey,
                    isDarkMode,
                  )}
                  isDarkMode={isDarkMode}
                  description="Theme board for the selected primary — same layout as HubBrand → Color Test."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {MATERIAL_COLOR_ROLES.map((role) => {
                  const bg = previewTheme[role.bgKey];
                  const on = previewTheme[role.onKey];
                  return (
                    <div
                      key={role.id}
                      className={`rounded-xl overflow-hidden border ${
                        isDarkMode ? 'border-slate-600' : 'border-slate-300'
                      }`}
                    >
                      <div className={`h-20 px-4 flex flex-col justify-end pb-3 ${bg}`}>
                        <span className={`text-sm font-bold ${on}`}>{role.label}</span>
                        <span className={`text-[10px] font-mono opacity-80 ${on}`}>
                          {role.bgKey} / {role.onKey}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2.5 text-[11px] leading-snug ${
                          isDarkMode
                            ? 'bg-slate-900 text-slate-400'
                            : 'bg-white text-slate-500'
                        }`}
                      >
                        {role.note}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <p
                  className={`${TYPE.labelMicro} mb-3 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Live sample — primary on surface
                </p>
                <div
                  className={`rounded-xl border p-4 flex flex-wrap items-center gap-3 ${previewTheme.colorSurface} ${previewTheme.colorOutline}`}
                >
                  <button
                    type="button"
                    className={`edu-control px-4 py-2 rounded-xl text-sm font-bold ${previewTheme.colorPrimary} ${previewTheme.colorOnPrimary}`}
                  >
                    Primary button
                  </button>
                  <button
                    type="button"
                    className={`edu-control px-4 py-2 rounded-xl text-sm font-bold ${previewTheme.colorSecondary} ${previewTheme.colorOnSecondary}`}
                  >
                    Secondary
                  </button>
                  <button
                    type="button"
                    className={`edu-control px-4 py-2 rounded-xl text-sm font-bold ${previewTheme.colorError} ${previewTheme.colorOnError}`}
                  >
                    Error
                  </button>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${previewTheme.colorPrimaryContainer} ${previewTheme.colorOnPrimaryContainer}`}
                  >
                    Primary container
                  </span>
                  <span className={`text-sm font-semibold ${previewTheme.colorOnSurface}`}>
                    On surface
                  </span>
                  <span className={`text-sm ${previewTheme.colorOnSurfaceVariant}`}>
                    On surface variant
                  </span>
                </div>
              </div>
            </GuideSection>

            <GuideSection
              title="Legacy aliases"
              description="Existing screens still use these — they map onto Material roles. Prefer the color* keys in new work."
              isDarkMode={isDarkMode}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      <th className="py-2 pr-4 font-bold">Legacy</th>
                      <th className="py-2 pr-4 font-bold">Material role</th>
                      <th className="py-2 font-bold">Use</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
                    }`}
                  >
                    {[
                      ['bg', 'colorPrimary', 'Filled primary controls'],
                      ['text / border / ring', 'colorPrimary (+ outline)', 'Accents & strokes'],
                      ['activeBg', 'colorPrimaryContainer', 'Selected / soft fill'],
                      ['bgMuted', '(soft primary)', 'Disabled / muted primary'],
                      ['hoverBg', '—', 'Light hover wash'],
                    ].map(([legacy, role, use]) => (
                      <tr key={legacy}>
                        <td className="py-2.5 pr-4 font-mono">{legacy}</td>
                        <td className="py-2.5 pr-4 font-mono text-[11px]">{role}</td>
                        <td className="py-2.5">{use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GuideSection>

            <GuideSection
              title="Primary palette"
              description="Canonical muted primaries in rainbow order."
              isDarkMode={isDarkMode}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {PRIMARY_KEYS.map((name) => {
                  const t = primaryPalettes[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPreviewThemeKey(name)}
                      className={`rounded-xl border p-3 text-left transition-shadow ${
                        previewThemeKey === name
                          ? `${t.border} ring-2 ${t.ring}`
                          : isDarkMode
                            ? 'border-slate-700'
                            : 'border-slate-300'
                      }`}
                    >
                      <div className={`h-10 rounded-lg mb-3 ${t.colorPrimary}`} />
                      <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {name}
                      </p>
                      <p className={`text-[11px] font-mono mt-0.5 ${t.text}`}>{t.primary}</p>
                      <div className="flex gap-1.5 mt-3">
                        <span className={`w-6 h-6 rounded-full ${t.colorPrimary}`} title="primary" />
                        <span
                          className={`w-6 h-6 rounded-full ${t.colorPrimaryVariant}`}
                          title="primaryVariant"
                        />
                        <span
                          className={`w-6 h-6 rounded-full border ${t.colorPrimaryContainer} ${t.border}`}
                          title="primaryContainer"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </GuideSection>
          </>
        ) : null}

        {guideTab === 'notes' ? (
          <GuideSection
            title="Handoff notes"
            description="Rules that keep every mini-app on the same visual system. Details live under Patterns."
            isDarkMode={isDarkMode}
          >
            <ul
              className={`text-sm space-y-2 list-disc pl-5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              <li>One job per section: one headline, one short supporting line.</li>
              <li>
                App shell padding: <code className="font-mono">{SHELL_MAIN_PADDING}</code> on AppShell{' '}
                <code className="font-mono">&lt;main&gt;</code> only — apps use{' '}
                <code className="font-mono">AppPageShell</code>, never their own edge padding.
              </li>
              <li>
                Prefer Material role tokens (<code className="font-mono">colorPrimary</code>,{' '}
                <code className="font-mono">colorOnPrimary</code>,{' '}
                <code className="font-mono">colorPrimaryContainer</code> /{' '}
                <code className="font-mono">colorOnPrimaryContainer</code>, surface/error) from{' '}
                <code className="font-mono">getTheme(app, isDarkMode)</code>.
              </li>
              <li>
                Cards: <code className="font-mono">APP_STATIC_BOARD</code> (fits viewport),{' '}
                <code className="font-mono">APP_SCROLL_BOARD</code> (same chrome; if past the
                bottom edge → regular scrollbar),{' '}
                <code className="font-mono">APP_BOARD_BODY_SCROLL</code> (static shell; body
                scrolls under a header), <code className="font-mono">APP_GRID_CARD</code>{' '}
                (content-sized grid — confirm min cards/row when creating). Nested{' '}
                <code className="font-mono">{APP_NESTED_CARD}</code>.
              </li>
              <li>
                Card styles (M3): default to <span className={TYPE.titleSm}>outlined</span> (
                <code className="font-mono">colorSurface</code> +{' '}
                <code className="font-mono">colorOutline</code>, no shadow). Use{' '}
                <span className={TYPE.titleSm}>filled</span> (
                <code className="font-mono">colorSurfaceVariant</code>) for softer separation.
                Do not use elevated/shadow cards. One subject per card; headline → subhead →
                body → actions. Interactive cards: real buttons +{' '}
                <code className="font-mono">edu-control</code>, visible focus,{' '}
                <code className="font-mono">aria-label</code> on icon-only actions; pair primary
                headers with <code className="font-mono">colorOnPrimary</code>. Live reference:{' '}
                Cards → Card Styles / Accessibility.
              </li>
              <li>
                Layout: <code className="font-mono">AppPageShell variant=&quot;stage&quot;</code> for
                fill-height tools; <code className="font-mono">variant=&quot;scroll&quot;</code> for
                tall boards with FAB clearance.
              </li>
              <li>
                Toolbars: <code className="font-mono">ButtonRow</code> + canonical tool chip (see
                Patterns). Settings modal = temp state → Cancel / Apply Changes.
              </li>
              <li>
                Primary FAB: shell-contained via <code className="font-mono">appFabClass(isLeft)</code>,{' '}
                <code className="font-mono">w-14 h-14</code>,{' '}
                <code className="font-mono">colorPrimary</code> /{' '}
                <code className="font-mono">colorOnPrimary</code>.
              </li>
              <li>
                Dashboard teaching widgets must reuse the app view and the same shell classes —
                never invent widget-only padding that clips FABs.
              </li>
              <li>
                Prefer slate neutrals for chrome; keep soft brand fills on container tokens.
              </li>
              <li>Sidebar open = labels; collapsed rail = icons + tooltips.</li>
              <li>
                Type: import <code className="font-mono">TYPE</code> from{' '}
                <code className="font-mono">shared/typography</code> (Title / Body / Label roles).
                Prefer Regular/Semibold; Bold only on Title Large/Medium. No one-off sizes.
              </li>
            </ul>
          </GuideSection>
        ) : null}
      </div>
    </div>
  );
}
