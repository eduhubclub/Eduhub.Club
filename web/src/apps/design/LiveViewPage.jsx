import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AppWindow,
  ArrowLeft,
  Box,
  ChevronDown,
  ChevronUp,
  CircleDot,
  LayoutGrid,
  Layers,
  PanelTop,
  PanelsTopLeft,
  Plus,
  RotateCcw,
  Rows3,
  Ruler,
  Settings2,
  SquareDashed,
  SquareStack,
  Type,
} from 'lucide-react';
import { AppPageShell } from '../../shared/AppPageShell';
import { ButtonRow } from '../../shared/ButtonRow';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { PageBackLink } from '../../shared/PageBackLink';
import { PageHeader } from '../../shared/PageHeader';
import {
  APP_BOARD_PAD,
  APP_EMPTY_SLOT,
  appFabClass,
  APP_GRID_CARD,
  APP_MAX_WIDTH,
  APP_MULTI_BOARD,
  APP_MULTI_BOARD_FULL,
  APP_NESTED_CARD,
  APP_SCROLL_BOARD,
  APP_STATIC_BOARD,
} from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE, typeRoleLabel } from '../../shared/typography';

function px(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Live View Fonts mode — wraps typed copy so hover shows the TYPE role.
 */
function TypeProbe({ role, enabled, as: Comp = 'p', className = '', children, ...rest }) {
  const typeClass = TYPE[role] || '';
  const merged = `${typeClass} ${className}`.trim();
  if (!enabled) {
    return (
      <Comp className={merged} {...rest}>
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      className={`edu-type-probe ${merged}`}
      data-edu-type={role}
      data-edu-type-label={typeRoleLabel(role)}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * Fixed floating tip — avoids clipping from truncate / overflow scroll parents.
 * Flips left/right and above/below to stay inside the viewport.
 */
function FontsHoverTip({ enabled, rootRef }) {
  const tipRef = useRef(null);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setTip(null);
      return undefined;
    }
    const root = rootRef.current;
    if (!root) return undefined;

    const clear = () => setTip(null);

    const updateFromEvent = (event) => {
      const el = event.target?.closest?.('[data-edu-type]');
      if (!el || !root.contains(el)) {
        clear();
        return;
      }
      const rect = el.getBoundingClientRect();
      const label =
        el.getAttribute('data-edu-type-label') ||
        typeRoleLabel(el.getAttribute('data-edu-type') || '');
      setTip({
        label,
        anchor: {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
      });
    };

    root.addEventListener('pointerover', updateFromEvent);
    root.addEventListener('pointermove', updateFromEvent);
    root.addEventListener('pointerleave', clear);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => {
      root.removeEventListener('pointerover', updateFromEvent);
      root.removeEventListener('pointermove', updateFromEvent);
      root.removeEventListener('pointerleave', clear);
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
    };
  }, [enabled, rootRef]);

  useLayoutEffect(() => {
    if (!tip || !tipRef.current) return;
    const node = tipRef.current;
    const { anchor } = tip;
    const pad = 8;
    const gap = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipW = node.offsetWidth;
    const tipH = node.offsetHeight;

    const spaceRight = vw - pad - anchor.left;
    const spaceLeft = anchor.right - pad;
    // Prefer left-aligned under the probe; flip to right-aligned (opens left) near the right edge.
    let left = anchor.left;
    if (tipW > spaceRight && spaceLeft >= tipW) {
      left = anchor.right - tipW;
    } else if (tipW > spaceRight) {
      left = Math.max(pad, vw - tipW - pad);
    }
    if (left < pad) left = pad;

    const spaceBelow = vh - pad - (anchor.bottom + gap);
    const spaceAbove = anchor.top - gap - pad;
    let top = anchor.bottom + gap;
    if (tipH > spaceBelow && spaceAbove >= tipH) {
      top = anchor.top - tipH - gap;
    } else if (tipH > spaceBelow) {
      top = Math.max(pad, vh - tipH - pad);
    }
    if (top < pad) top = pad;

    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
  }, [tip]);

  if (!enabled || !tip) return null;

  return createPortal(
    <div
      ref={tipRef}
      className="fixed z-[300] pointer-events-none px-2.5 py-1.5 rounded-lg text-[11px] font-semibold leading-snug tracking-wide text-slate-50 bg-slate-900/95 shadow-[0_8px_24px_rgb(0,0,0,0.2)] max-w-[18rem] whitespace-nowrap"
      style={{ left: 0, top: 0 }}
      role="tooltip"
    >
      {tip.label}
    </div>,
    document.body,
  );
}

function SpaceChip({ className, children }) {
  return (
    <span
      className={`pointer-events-none absolute z-[5] inline-flex items-center justify-center min-w-[1.1rem] px-1 h-3.5 rounded text-[8px] font-black leading-none tabular-nums select-none ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Measured padding / margin / gap labels for Space debug (px).
 * Positioned relative to the Live View root (accounts for shell transform).
 */
function SpaceSizeOverlays({ rootRef, enabled, revision }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return undefined;
    }
    const root = rootRef.current;
    if (!root) return undefined;

    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      const next = [];

      root.querySelectorAll('[data-edu-space]').forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        next.push({
          key: `box-${i}`,
          kind: 'box',
          top: rect.top - rootRect.top + root.scrollTop,
          left: rect.left - rootRect.left + root.scrollLeft,
          width: rect.width,
          height: rect.height,
          pad: {
            t: px(cs.paddingTop),
            r: px(cs.paddingRight),
            b: px(cs.paddingBottom),
            l: px(cs.paddingLeft),
          },
          mar: {
            t: px(cs.marginTop),
            r: px(cs.marginRight),
            b: px(cs.marginBottom),
            l: px(cs.marginLeft),
          },
        });
      });

      root.querySelectorAll('[data-edu-space-stack]').forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const gap = px(cs.rowGap || cs.gap || 0);
        if (gap <= 0) return;
        next.push({
          key: `stack-${i}`,
          kind: 'stack',
          top: rect.top - rootRect.top + root.scrollTop,
          left: rect.left - rootRect.left + root.scrollLeft,
          width: rect.width,
          height: rect.height,
          gap,
        });
      });

      setItems(next);
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    root.querySelectorAll('[data-edu-space], [data-edu-space-stack]').forEach((el) => {
      ro.observe(el);
    });
    const onScroll = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', measure);
    };
  }, [enabled, rootRef, revision]);

  if (!enabled || items.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[180] pointer-events-none overflow-hidden" aria-hidden>
      {items.map((item) => {
        if (item.kind === 'stack') {
          return (
            <div
              key={item.key}
              className="absolute"
              style={{
                top: item.top,
                left: item.left,
                width: item.width,
                height: item.height,
              }}
            >
              <SpaceChip className="top-1 right-1 bg-orange-400 text-orange-950">
                gap {item.gap}
              </SpaceChip>
            </div>
          );
        }

        const { pad, mar } = item;
        const hasPad = pad.t || pad.r || pad.b || pad.l;
        const hasMar = mar.t || mar.r || mar.b || mar.l;
        const uniformPad =
          hasPad && pad.t === pad.r && pad.r === pad.b && pad.b === pad.l && pad.t > 0;

        return (
          <div
            key={item.key}
            className="absolute"
            style={{
              top: item.top,
              left: item.left,
              width: item.width,
              height: item.height,
            }}
          >
            {hasPad && pad.t > 0 ? (
              <SpaceChip className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-400 text-emerald-950">
                {pad.t}
              </SpaceChip>
            ) : null}
            {hasPad && pad.b > 0 ? (
              <SpaceChip className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-emerald-400 text-emerald-950">
                {pad.b}
              </SpaceChip>
            ) : null}
            {hasPad && pad.l > 0 ? (
              <SpaceChip className="left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-400 text-emerald-950">
                {pad.l}
              </SpaceChip>
            ) : null}
            {hasPad && pad.r > 0 ? (
              <SpaceChip className="right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-400 text-emerald-950">
                {pad.r}
              </SpaceChip>
            ) : null}
            {hasMar ? (
              <SpaceChip className="top-1 left-1 bg-orange-400 text-orange-950">
                {mar.t === mar.r && mar.r === mar.b && mar.b === mar.l
                  ? `m ${mar.t}`
                  : `m ${mar.t} ${mar.r} ${mar.b} ${mar.l}`}
              </SpaceChip>
            ) : null}
            {uniformPad ? (
              <SpaceChip className="bottom-1 right-1 bg-sky-400/90 text-sky-950">
                p {pad.t}
              </SpaceChip>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Dock chips — press to show/hide live pieces on the canvas. */
const DOCK_ITEMS = [
  { id: 'back', label: 'Back', icon: ArrowLeft },
  { id: 'header', label: 'Header', icon: PanelsTopLeft },
  { id: 'toolbar', label: 'Buttons', icon: Rows3 },
  { id: 'static', label: 'Static', icon: Box },
  { id: 'scroll', label: 'Scroll', icon: Layers },
  { id: 'multi', label: 'Multi', icon: SquareStack },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'nested', label: 'Nested', icon: PanelTop },
  { id: 'empty', label: 'Empty', icon: SquareDashed },
  { id: 'fab', label: 'FAB', icon: CircleDot },
  { id: 'modal', label: 'Modal', icon: AppWindow },
  { id: 'space', label: 'Space', icon: Ruler },
  { id: 'fonts', label: 'Fonts', icon: Type },
];

const DOCK_META = new Set(['space', 'fonts']);

const INITIAL_ON = {
  back: false,
  header: false,
  toolbar: false,
  static: false,
  scroll: false,
  multi: false,
  grid: false,
  nested: false,
  empty: false,
  fab: false,
  modal: false,
  space: false,
  fonts: false,
};

/** Content-area height matching shell (header + main padding). */
const SHELL_CONTENT_H = APP_MULTI_BOARD_FULL;

/**
 * Edu.Design — Live View.
 * Scroll lives on AppShell `<main>` (edge scrollbar) — never an inner page scroller.
 * Floating component dock sits above at high z-index, centered in the app shell column
 * (fixed elements are contained by AppShell’s content column).
 */
export function LiveViewPage({
  isDarkMode,
  theme,
  isLeft = true,
  onLiveSpaceDebugChange,
}) {
  const rootRef = useRef(null);
  const [on, setOn] = useState(INITIAL_ON);
  const [dockOpen, setDockOpen] = useState(true);
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const title = isDarkMode ? 'text-white' : 'text-slate-900';
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const nestedFill = isDarkMode
    ? 'bg-slate-800/60 border-slate-600'
    : 'bg-slate-50 border-slate-200';
  const emptyFill = isDarkMode
    ? 'border-slate-600 text-slate-500'
    : 'border-slate-300 text-slate-400';
  const toolBtn = toolBtnClass(isDarkMode);
  const showSpace = on.space;
  const showFonts = on.fonts;
  const anyOn = DOCK_ITEMS.some((item) => !DOCK_META.has(item.id) && on[item.id]);
  const activeCount = DOCK_ITEMS.filter((item) => !DOCK_META.has(item.id) && on[item.id]).length;
  const hasStackContent =
    on.scroll || on.multi || on.grid || on.nested || on.empty;
  /** Static alone fills content-area height; shell edge does not need an inner scroller. */
  const fillStatic = on.static && !hasStackContent;
  const spaceClass = showSpace ? 'edu-live-space-debug' : '';
  const fontsClass = showFonts ? 'edu-live-fonts-debug' : '';
  const canvasDebugClass = [spaceClass, fontsClass].filter(Boolean).join(' ');
  const spaceRevision = `${dockOpen}:${Object.entries(on)
    .map(([k, v]) => (v ? k : ''))
    .join(',')}`;

  useEffect(() => {
    onLiveSpaceDebugChange?.(showSpace);
    return () => onLiveSpaceDebugChange?.(false);
  }, [showSpace, onLiveSpaceDebugChange]);

  const toggle = (id) => {
    setOn((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const closeModal = () => {
    setOn((prev) => ({ ...prev, modal: false }));
  };

  const dockSurface = isDarkMode
    ? 'bg-slate-900/95 border-slate-600 backdrop-blur-md'
    : 'bg-white/95 border-slate-300 backdrop-blur-md';

  const dockPad = dockOpen ? '!pb-36' : '!pb-24';

  const chrome = (
    <>
      {on.back ? (
        <div data-edu-space="chrome">
          <PageBackLink
            label="Patterns"
            isDarkMode={isDarkMode}
            onClick={() => {}}
            fontsDebug={showFonts}
          />
        </div>
      ) : null}

      {on.header ? (
        <div data-edu-space="chrome">
          <PageHeader
            title="Live View"
            description="Compose back link, header, tools, boards, and FAB on one canvas."
            isDarkMode={isDarkMode}
            fontsDebug={showFonts}
          />
        </div>
      ) : null}

      {on.toolbar ? (
        <div data-edu-space="chrome">
          <ButtonRow>
            <button
              type="button"
              className={`${toolBtn} disabled:opacity-50 ${showFonts ? 'edu-type-probe' : ''}`}
              disabled
              {...(showFonts
                ? { 'data-edu-type': 'labelMd', 'data-edu-type-label': typeRoleLabel('labelMd') }
                : {})}
            >
              <RotateCcw size={16} strokeWidth={2.5} />
              Reset
            </button>
            <button
              type="button"
              className={`${toolBtn} ${showFonts ? 'edu-type-probe' : ''}`}
              {...(showFonts
                ? { 'data-edu-type': 'labelMd', 'data-edu-type-label': typeRoleLabel('labelMd') }
                : {})}
            >
              <Settings2 size={16} strokeWidth={2.5} />
              Settings
            </button>
          </ButtonRow>
        </div>
      ) : null}
    </>
  );

  const staticBoard = (fill) => (
    <div
      data-edu-space="board"
      className={`${fill ? APP_STATIC_BOARD : APP_MULTI_BOARD} ${APP_BOARD_PAD} ${surface} ${
        fill && dockOpen ? 'pb-28' : ''
      }`}
    >
      <TypeProbe role="titleSm" enabled={showFonts} className={title}>
        Static board
      </TypeProbe>
      <TypeProbe role="bodySm" enabled={showFonts} className={`font-mono mt-0.5 ${muted}`}>
        APP_STATIC_BOARD
      </TypeProbe>
      <TypeProbe role="bodyMd" enabled={showFonts} className={`mt-3 ${body}`}>
        {fill
          ? 'Fills available app-shell height — grows and shrinks with header, toolbar, and shell.'
          : 'Content-sized here — turn off other boards to fill the stage.'}
      </TypeProbe>
      <div className="mt-auto pt-4 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary} ${
            showFonts ? 'edu-type-probe' : ''
          }`}
          {...(showFonts
            ? { 'data-edu-type': 'labelMd', 'data-edu-type-label': typeRoleLabel('labelMd') }
            : {})}
        >
          Primary
        </span>
        <span
          className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${
            showFonts ? 'edu-type-probe' : ''
          } ${
            isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
          }`}
          {...(showFonts
            ? { 'data-edu-type': 'labelMd', 'data-edu-type-label': typeRoleLabel('labelMd') }
            : {})}
        >
          Secondary
        </span>
      </div>
    </div>
  );

  let canvas;
  if (!anyOn) {
    canvas = (
      <div
        className={`relative ${APP_MAX_WIDTH} ${SHELL_CONTENT_H} flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed px-6 py-12 text-center ${fontsClass} ${
          isDarkMode ? 'border-slate-600' : 'border-slate-300'
        }`}
      >
        <TypeProbe role="titleSm" enabled={showFonts} className={title}>
          Live canvas
        </TypeProbe>
        <TypeProbe role="bodyMd" enabled={showFonts} className={`mt-2 max-w-sm ${body}`}>
          Use the dock below to turn components on. Compose a page and see how pieces sit together
          in the real shell.
        </TypeProbe>
      </div>
    );
  } else if (fillStatic) {
    canvas = (
      <div className={`relative ${APP_MAX_WIDTH} ${SHELL_CONTENT_H} flex flex-col ${canvasDebugClass}`}>
        {chrome}
        <div className="flex-1 min-h-0 flex flex-col">{staticBoard(true)}</div>
      </div>
    );
  } else {
    canvas = (
      <AppPageShell variant="scroll" className={`${dockPad} ${canvasDebugClass}`}>
        {chrome}
        {on.static || on.scroll || on.multi || on.grid || on.nested || on.empty ? (
          <div className="flex flex-col gap-4" data-edu-space-stack>
            {on.static ? staticBoard(false) : null}

            {on.scroll ? (
              <div
                data-edu-space="board"
                className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}
              >
                <TypeProbe role="titleSm" enabled={showFonts} className={title}>
                  Scrolling board
                </TypeProbe>
                <TypeProbe role="bodySm" enabled={showFonts} className={`font-mono mt-0.5 ${muted}`}>
                  APP_SCROLL_BOARD
                </TypeProbe>
                <TypeProbe role="bodyMd" enabled={showFonts} className={`mt-3 ${body}`}>
                  Height follows content. Shell edge scrolls — not this card.
                </TypeProbe>
                <div className="mt-4 h-24 rounded-xl border border-dashed opacity-40" aria-hidden />
                <div className="mt-4 h-24 rounded-xl border border-dashed opacity-40" aria-hidden />
              </div>
            ) : null}

            {on.multi ? (
              <div className="flex flex-col gap-3" data-edu-space-stack>
                {['A', 'B'].map((label) => (
                  <div
                    key={label}
                    data-edu-space="board"
                    className={`${APP_MULTI_BOARD} ${APP_BOARD_PAD} ${surface} ${
                      label === 'A' ? APP_MULTI_BOARD_FULL : ''
                    }`}
                  >
                    <TypeProbe role="titleSm" enabled={showFonts} className={title}>
                      Multi board {label}
                    </TypeProbe>
                    <TypeProbe role="bodySm" enabled={showFonts} className={`font-mono mt-0.5 ${muted}`}>
                      {label === 'A'
                        ? 'APP_MULTI_BOARD + APP_MULTI_BOARD_FULL'
                        : 'APP_MULTI_BOARD · content height'}
                    </TypeProbe>
                    <TypeProbe role="bodyMd" enabled={showFonts} className={`mt-3 ${body}`}>
                      {label === 'A'
                        ? 'Full static footprint in a multi stack.'
                        : 'Smaller board — height follows copy.'}
                    </TypeProbe>
                  </div>
                ))}
              </div>
            ) : null}

            {on.grid ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-edu-space-stack>
                {['A', 'B', 'C', 'D', 'E', 'F'].map((label) => (
                  <div
                    key={label}
                    data-edu-space="board"
                    className={`${APP_GRID_CARD} p-4 sm:p-5 ${surface}`}
                  >
                    <TypeProbe role="titleSm" enabled={showFonts} className={title}>
                      Grid {label}
                    </TypeProbe>
                    <TypeProbe role="bodySm" enabled={showFonts} className={`font-mono mt-0.5 ${muted}`}>
                      APP_GRID_CARD
                    </TypeProbe>
                  </div>
                ))}
              </div>
            ) : null}

            {on.nested ? (
              <div
                data-edu-space="board"
                className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} space-y-3 ${surface}`}
              >
                <TypeProbe role="titleSm" enabled={showFonts} className={title}>
                  Host board
                </TypeProbe>
                <div data-edu-space="nested" className={`${APP_NESTED_CARD} p-4 ${nestedFill}`}>
                  <TypeProbe role="titleSm" enabled={showFonts} className={theme.text}>
                    Nested card
                  </TypeProbe>
                  <TypeProbe role="bodySm" enabled={showFonts} className={`mt-2 ${body}`}>
                    Soft fill inside a board.
                  </TypeProbe>
                </div>
                <div data-edu-space="nested" className={`${APP_NESTED_CARD} p-4 ${nestedFill}`}>
                  <TypeProbe role="titleSm" enabled={showFonts} className={theme.text}>
                    Another nested panel
                  </TypeProbe>
                  <TypeProbe role="bodySm" enabled={showFonts} className={`mt-2 ${body}`}>
                    Same radius — never invent a third.
                  </TypeProbe>
                </div>
              </div>
            ) : null}

            {on.empty ? (
              <div data-edu-space="board" className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
                <div
                  data-edu-space="nested"
                  className={`${APP_EMPTY_SLOT} p-6 min-h-[10rem] flex flex-col items-center justify-center gap-1.5 ${emptyFill}`}
                >
                  <TypeProbe role="labelMicro" enabled={showFonts}>
                    Empty slot
                  </TypeProbe>
                  <TypeProbe
                    role="bodySm"
                    enabled={showFonts}
                    className={`text-center max-w-[14rem] ${muted}`}
                  >
                    Short prompt for the next action
                  </TypeProbe>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AppPageShell>
    );
  }

  return (
    <div ref={rootRef} className="relative h-full min-h-0">
      {canvas}

      <SpaceSizeOverlays
        rootRef={rootRef}
        enabled={showSpace && anyOn}
        revision={spaceRevision}
      />

      <FontsHoverTip enabled={showFonts} rootRef={rootRef} />

      <Modal
        isOpen={on.modal}
        title="Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={closeModal}
        maxWidth="max-w-sm"
        zIndex="z-[220]"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={closeModal}>
              Apply Changes
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6">
          <TypeProbe role="titleSm" enabled={showFonts} className={title}>
            Example option
          </TypeProbe>
          <TypeProbe role="bodySm" enabled={showFonts} className={`mt-1 ${muted}`}>
            Temp state while open — Apply commits, Cancel discards.
          </TypeProbe>
        </div>
      </Modal>

      {on.fab ? (
        <button
          type="button"
          data-edu-space="fab"
          className={`${appFabClass(isLeft)} z-[190] ${theme.colorPrimary} ${theme.colorOnPrimary} ${
            showSpace ? 'edu-live-space-debug' : ''
          }`}
          aria-label="Primary action"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      ) : null}

      <div
        className="fixed bottom-5 inset-x-0 z-[200] flex justify-center px-3 pointer-events-none"
        role="toolbar"
        aria-label="Live View components"
      >
        <div className="pointer-events-auto w-full max-w-[44rem]">
          {dockOpen ? (
            <div
              className={`rounded-2xl border shadow-[0_12px_40px_rgb(0,0,0,0.14)] px-2 py-2 ${dockSurface}`}
            >
              <div className="flex items-center justify-between gap-2 px-2 pt-0.5 pb-1.5">
                <p className={`${TYPE.labelMicro} ${muted}`}>
                  Components
                  {activeCount > 0 ? (
                    <span className={`ml-1.5 tabular-nums ${theme.text}`}>{activeCount}</span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => setDockOpen(false)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${TYPE.labelMd} transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                  aria-expanded={true}
                  title="Collapse components"
                >
                  Hide
                  <ChevronDown size={14} strokeWidth={2.5} />
                </button>
              </div>
              {showSpace ? (
                <div
                  className={`mx-2 mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2.5 py-1.5 ${
                    isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'
                  }`}
                  aria-hidden
                >
                  <span className={`${TYPE.labelMicro} ${muted}`}>Legend · px · shell + components</span>
                  <span className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} ${title}`}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/80 ring-1 ring-emerald-600/40" />
                    Padding
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} ${title}`}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 ring-1 ring-sky-600/50" />
                    Content
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} ${title}`}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-400/80 ring-1 ring-orange-600/40" />
                    Margin / gap
                  </span>
                </div>
              ) : null}
              {showFonts ? (
                <div
                  className={`mx-2 mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2.5 py-1.5 ${
                    isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'
                  }`}
                  aria-hidden
                >
                  <span className={`${TYPE.labelMicro} ${muted}`}>
                    Legend · hover text for TYPE role
                  </span>
                  <span className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} ${title}`}>
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-400/80 ring-1 ring-violet-600/40" />
                    Title / Body / Label
                  </span>
                </div>
              ) : null}
              <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {DOCK_ITEMS.map(({ id, label, icon: Icon }) => {
                  const active = on[id];
                  const metaTitle =
                    id === 'space'
                      ? active
                        ? 'Hide shell & component spacing'
                        : 'Show shell & component spacing'
                      : id === 'fonts'
                        ? active
                          ? 'Hide type-role probes'
                          : 'Show type roles on hover'
                        : active
                          ? `Hide ${label}`
                          : `Show ${label}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggle(id)}
                      aria-pressed={active}
                      title={metaTitle}
                      className={`shrink-0 inline-flex flex-col items-center justify-center gap-0.5 min-w-[3.25rem] h-14 px-1.5 rounded-xl ${TYPE.labelMd} transition-colors ${
                        active
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                          : isDarkMode
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setDockOpen(true)}
                className={`inline-flex items-center gap-2 rounded-full border shadow-[0_12px_40px_rgb(0,0,0,0.14)] px-4 h-11 ${TYPE.labelMd} transition-colors ${dockSurface} ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-700'
                }`}
                aria-expanded={false}
                title="Show components"
              >
                <ChevronUp size={16} strokeWidth={2.5} />
                Components
                {activeCount > 0 ? (
                  <span
                    className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  >
                    {activeCount}
                  </span>
                ) : null}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
