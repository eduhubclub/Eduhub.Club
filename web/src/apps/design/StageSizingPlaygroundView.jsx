import { useMemo, useState } from 'react';
import {
  Plus,
  RotateCcw,
  Settings2,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  SlidersHorizontal,
} from 'lucide-react';
import { AppBoard } from '../../shared/AppBoard';
import { AppFab } from '../../shared/AppFab';
import { AppPageShell } from '../../shared/AppPageShell';
import { ButtonRow } from '../../shared/ButtonRow';
import { ContentCardGrid } from '../../shared/ContentCardGrid';
import { InternalScrollBoard } from '../../shared/InternalScrollBoard';
import { PageBackLink } from '../../shared/PageBackLink';
import { PageHeader } from '../../shared/PageHeader';
import { SegmentControl } from '../../shared/SegmentControl';
import { StageToolLayout } from '../../shared/StageToolLayout';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';

const TEMPLATES = [
  { id: 'board', label: 'AppBoard' },
  { id: 'stage', label: 'Stage tool' },
  { id: 'internal', label: 'Internal scroll' },
  { id: 'grid', label: 'Card grid' },
  { id: 'scrollPage', label: 'Scroll + FAB' },
];

const SIZES = [
  { id: 'full', label: 'Full' },
  { id: 'md', label: 'MD' },
  { id: 'sm', label: 'SM' },
];

const PADS = [
  { id: 'board', label: 'Board' },
  { id: 'stage', label: 'Stage' },
  { id: 'none', label: 'None' },
];

const FRAMES = [
  { id: 'full', label: 'Full', Icon: Maximize2, width: null, note: 'Real shell width' },
  { id: 'phone', label: 'Phone', Icon: Smartphone, width: 360, note: '~360px' },
  { id: 'tablet', label: 'Tablet', Icon: Tablet, width: 768, note: '~768px' },
  { id: 'desktop', label: 'Desktop', Icon: Monitor, width: 1100, note: '~1100px' },
  { id: 'custom', label: 'Custom', Icon: SlidersHorizontal, width: 'custom', note: 'Width slider' },
];

const SAMPLE_ROWS = Array.from({ length: 12 }, (_, i) => `Sample row ${i + 1}`);
const CUSTOM_WIDTH_MIN = 280;
const CUSTOM_WIDTH_MAX = 1200;

function SampleToolbar({ toolBtn, count }) {
  const chips = [
    { icon: RotateCcw, label: 'Reset' },
    { icon: Settings2, label: 'Settings' },
    { icon: Plus, label: 'Add' },
  ].slice(0, count);
  return (
    <>
      {chips.map(({ icon: Icon, label }) => (
        <button key={label} type="button" className={toolBtn}>
          <Icon size={16} strokeWidth={2.5} />
          {label}
        </button>
      ))}
    </>
  );
}

function SquareFaceDemo({ theme, isDarkMode }) {
  const fill = isDarkMode ? 'bg-slate-800' : 'bg-slate-100';
  const ring = theme.colorOutline;
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      <div
        className={`aspect-square h-full max-h-full w-auto max-w-full ${fill} ${ring} rounded-full border-[1.5px] flex items-center justify-center`}
      >
        <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
          aspect-square face
        </span>
      </div>
    </div>
  );
}

/**
 * Edu.Design — Stage Sizing playground.
 * Stress-test template blocks under phone / short-height frames without resizing the browser.
 */
export function StageSizingPlaygroundView({ isDarkMode, theme, isLeft }) {
  const [template, setTemplate] = useState('stage');
  const [size, setSize] = useState('full');
  const [pad, setPad] = useState('stage');
  const [frameId, setFrameId] = useState('phone');
  const [customWidth, setCustomWidth] = useState(420);
  const [shortHeight, setShortHeight] = useState(true);
  const [toolbarCount, setToolbarCount] = useState(3);
  const [showFab, setShowFab] = useState(true);
  const [showSquare, setShowSquare] = useState(true);

  const toolBtn = toolBtnClass(isDarkMode);
  const muted = theme.colorOnSurfaceVariant;
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const frame = FRAMES.find((f) => f.id === frameId) || FRAMES[0];
  const frameWidthPx =
    frame.width === 'custom'
      ? customWidth
      : typeof frame.width === 'number'
        ? frame.width
        : null;

  const readout = useMemo(() => {
    const parts = [
      `template=${template}`,
      `size=${size}`,
      `pad=${pad}`,
      `frame=${frame.label}${frameWidthPx != null ? ` (${frameWidthPx}px)` : ''}`,
      shortHeight ? 'height=short(~560)' : 'height=fill',
    ];
    return parts.join(' · ');
  }, [template, size, pad, frame, frameWidthPx, shortHeight]);

  const toolbar = (
    <SampleToolbar toolBtn={toolBtn} count={toolbarCount} />
  );

  let canvas;
  if (template === 'board') {
    canvas = (
      <AppPageShell variant={size === 'full' && pad !== 'none' ? 'stage' : 'scroll'}>
        <AppBoard mode="static" size={size} pad={pad} theme={theme} className="flex-1 min-h-0">
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>AppBoard</p>
          <p className={`${TYPE.bodySm} mt-1 ${muted}`}>
            mode=static · size={size} · pad={pad}
          </p>
          {showSquare ? (
            <div className="mt-4 flex-1 min-h-[12rem]">
              <SquareFaceDemo theme={theme} isDarkMode={isDarkMode} />
            </div>
          ) : (
            <ul className={`mt-4 space-y-2 ${TYPE.bodyMd} ${body}`}>
              {SAMPLE_ROWS.slice(0, 6).map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          )}
        </AppBoard>
      </AppPageShell>
    );
  } else if (template === 'stage') {
    canvas = (
      <AppPageShell variant="stage">
        <StageToolLayout
          toolbar={toolbar}
          boardSize={size}
          pad={pad === 'none' ? 'stage' : pad}
          theme={theme}
        >
          {showSquare ? (
            <SquareFaceDemo theme={theme} isDarkMode={isDarkMode} />
          ) : (
            <div className={`space-y-2 ${TYPE.bodyMd} ${body}`}>
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Stage body</p>
              {SAMPLE_ROWS.slice(0, 4).map((row) => (
                <p key={row}>{row}</p>
              ))}
            </div>
          )}
        </StageToolLayout>
      </AppPageShell>
    );
  } else if (template === 'internal') {
    canvas = (
      <AppPageShell variant="stage">
        <InternalScrollBoard
          size={size}
          pad={pad === 'none' ? 'board' : pad}
          theme={theme}
          isDarkMode={isDarkMode}
          header={
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Header band</p>
          }
        >
          <ul className={`space-y-2 ${TYPE.bodyMd} ${body}`}>
            {SAMPLE_ROWS.map((row) => (
              <li key={row} className="py-1">
                {row}
              </li>
            ))}
          </ul>
        </InternalScrollBoard>
      </AppPageShell>
    );
  } else if (template === 'grid') {
    canvas = (
      <AppPageShell variant="scroll">
        <ContentCardGrid>
          {Array.from({ length: 6 }, (_, i) => (
            <AppBoard key={i} mode="grid" pad="board" theme={theme}>
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Card {i + 1}</p>
              <p className={`${TYPE.bodySm} mt-1 ${muted}`}>APP_GRID_CARD via AppBoard</p>
            </AppBoard>
          ))}
        </ContentCardGrid>
      </AppPageShell>
    );
  } else {
    canvas = (
      <AppPageShell variant="scroll">
        <PageBackLink label="Patterns" isDarkMode={isDarkMode} onClick={() => {}} />
        <PageHeader
          title="Scroll page"
          description="Back, header, toolbar, board, FAB — compose pieces."
          isDarkMode={isDarkMode}
        />
        <div className="mb-3">
          <ButtonRow>
            <SampleToolbar toolBtn={toolBtn} count={toolbarCount} />
          </ButtonRow>
        </div>
        <AppBoard mode="scroll" pad={pad === 'none' ? 'board' : pad} theme={theme}>
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Scrolling board</p>
          <ul className={`mt-3 space-y-2 ${TYPE.bodyMd} ${body}`}>
            {SAMPLE_ROWS.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </AppBoard>
        {showFab ? (
          <AppFab isLeft={isLeft} theme={theme} aria-label="Primary action">
            <Plus size={24} strokeWidth={2.5} />
          </AppFab>
        ) : null}
      </AppPageShell>
    );
  }

  const dockSurface = isDarkMode
    ? 'bg-slate-900/95 border-slate-600 backdrop-blur-md'
    : 'bg-white/95 border-slate-300 backdrop-blur-md';

  const constrained = frameWidthPx != null || shortHeight;
  const frameStyle = constrained
    ? {
        width: frameWidthPx != null ? `min(100%, ${frameWidthPx}px)` : '100%',
        height: shortHeight ? '560px' : '100%',
        maxHeight: shortHeight ? '560px' : undefined,
      }
    : undefined;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 pb-36">
      <div className={`shrink-0 ${TYPE.bodySm} ${muted}`}>
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Stage Sizing</p>
        <p className="mt-1">
          Stress-test template blocks under phone / short frames without resizing the browser.
        </p>
        <p className={`mt-1 font-mono text-[11px] ${muted}`}>{readout}</p>
      </div>

      <div
        className={`relative flex-1 min-h-0 ${
          constrained
            ? `mx-auto overflow-auto rounded-2xl border-[1.5px] border-dashed ${theme.colorOutline} ${
                isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/80'
              }`
            : 'min-h-[24rem]'
        }`}
        style={frameStyle}
      >
        <div className={constrained ? 'h-full min-h-0 p-2' : 'h-full min-h-[24rem]'}>
          {canvas}
        </div>
      </div>

      <div
        className={`fixed bottom-4 left-1/2 z-[190] w-[min(100%-1.5rem,42rem)] -translate-x-1/2 rounded-2xl border-[1.5px] p-3 shadow-lg ${dockSurface}`}
      >
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto">
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              value={template}
              onChange={setTemplate}
              options={TEMPLATES}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`${TYPE.labelSm} ${muted}`}>Size</span>
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              value={size}
              onChange={setSize}
              options={SIZES}
            />
            <span className={`${TYPE.labelSm} ${muted}`}>Pad</span>
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              value={pad}
              onChange={setPad}
              options={PADS}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`${TYPE.labelSm} ${muted}`}>Frame</span>
            {FRAMES.map(({ id, label, Icon }) => {
              const active = frameId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFrameId(id)}
                  className={`edu-control inline-flex items-center gap-1.5 h-9 px-3 rounded-xl ${TYPE.labelMd} border ${
                    active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                      : `${toolBtn}`
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShortHeight((v) => !v)}
              className={`edu-control inline-flex items-center h-9 px-3 rounded-xl ${TYPE.labelMd} border ${
                shortHeight
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : toolBtn
              }`}
            >
              Short height
            </button>
            {frameId === 'custom' ? (
              <label
                className={`edu-control inline-flex items-center gap-2 ${TYPE.labelMd} ${muted}`}
              >
                Width
                <input
                  type="range"
                  min={CUSTOM_WIDTH_MIN}
                  max={CUSTOM_WIDTH_MAX}
                  step={10}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-28 accent-current"
                  aria-label="Custom frame width"
                />
                <span className="font-mono tabular-nums w-10">{customWidth}</span>
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className={`edu-control inline-flex items-center gap-2 ${TYPE.labelMd} ${muted}`}>
              Toolbar chips
              <select
                className={`h-9 rounded-xl border px-2 ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                value={toolbarCount}
                onChange={(e) => setToolbarCount(Number(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowSquare((v) => !v)}
              className={`edu-control inline-flex h-9 px-3 rounded-xl ${TYPE.labelMd} border ${
                showSquare
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : toolBtn
              }`}
            >
              Square face
            </button>
            <button
              type="button"
              onClick={() => setShowFab((v) => !v)}
              className={`edu-control inline-flex h-9 px-3 rounded-xl ${TYPE.labelMd} border ${
                showFab
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : toolBtn
              }`}
            >
              FAB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
