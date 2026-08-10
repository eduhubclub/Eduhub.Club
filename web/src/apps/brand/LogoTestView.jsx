import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Circle,
  Layers,
  LayoutGrid,
  RectangleHorizontal,
  Ruler,
  Spline,
  Square,
  Triangle,
} from 'lucide-react';
import { LogoHorizontal, LogoIcon2x2 } from '../../shared/Logo';
import {
  DEFAULT_GLYPH_SELECTION,
  GLYPH_SELECTORS,
} from '../../shared/logoGlyphCatalog.jsx';
import {
  DEFAULT_GLYPH_STYLE_ID,
  GLYPH_STYLES,
} from '../../shared/logoGlyphStyleMarks';
import { FitPopout } from '../../shared/usePopoutFit';

const GLYPH_ICONS = {
  circle: Circle,
  triangle: Triangle,
  square: Square,
  scribble: Spline,
};

/**
 * HubBrand Logo Test — centered lockup + dock for layout, glyph variants, style, padding.
 * Pass `embedded` to nest inside AppGuide (absolute dock, shorter stage).
 */
export function LogoTestView({ isDarkMode, embedded = false }) {
  const [layout, setLayout] = useState('horizontal');
  const [showPadding, setShowPadding] = useState(false);
  const [glyphStyle, setGlyphStyle] = useState(DEFAULT_GLYPH_STYLE_ID);
  const [glyphPick, setGlyphPick] = useState(DEFAULT_GLYPH_SELECTION);
  const [openSelector, setOpenSelector] = useState(null);
  const dockRef = useRef(null);
  const chipRefs = useRef({});
  const [popoutLeft, setPopoutLeft] = useState('50%');

  const isHorizontal = layout === 'horizontal';
  const scribbleVariant = glyphPick.scribble;
  const styleMeta =
    GLYPH_STYLES.find((s) => s.id === glyphStyle) || GLYPH_STYLES[0];
  const openGlyph = GLYPH_SELECTORS.find((g) => g.id === openSelector) || null;
  const openSelected =
    openGlyph &&
    (openGlyph.options.find((o) => o.id === glyphPick[openGlyph.id]) ||
      openGlyph.options[0]);
  const stylePopoutOpen = openSelector === 'style';

  const muted = isDarkMode ? 'text-stone-500' : 'text-stone-400';
  const title = isDarkMode ? 'text-stone-200' : 'text-stone-700';
  const dockSurface = isDarkMode
    ? 'bg-stone-900 border-stone-600'
    : 'bg-white border-stone-200';
  const idleChip = isDarkMode
    ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800';
  const popoutSurface = isDarkMode
    ? 'bg-stone-900 border-stone-600'
    : 'bg-white border-stone-200';

  useEffect(() => {
    if (!openSelector) return undefined;
    const onPointerDown = (event) => {
      if (dockRef.current && !dockRef.current.contains(event.target)) {
        setOpenSelector(null);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpenSelector(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openSelector]);

  // Anchor above the active chip; keep outside overflow-x so the menu isn't clipped.
  useLayoutEffect(() => {
    if (!openSelector || !dockRef.current) return undefined;
    const place = () => {
      const dock = dockRef.current;
      const chip = chipRefs.current[openSelector];
      if (!dock || !chip) return;
      const dockRect = dock.getBoundingClientRect();
      const chipRect = chip.getBoundingClientRect();
      setPopoutLeft(`${chipRect.left + chipRect.width / 2 - dockRect.left}px`);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [openSelector]);

  const chipClass = (active) =>
    `edu-control shrink-0 inline-flex flex-col items-center justify-center gap-0.5 min-w-[3.25rem] h-14 px-1.5 rounded-xl text-xs font-semibold transition-colors ${
      active ? 'bg-rose-500 text-white' : idleChip
    }`;

  const statusStyle =
    glyphStyle === 'default'
      ? `scribble ${scribbleVariant}`
      : styleMeta.label.toLowerCase();

  return (
    <div
      className={
        embedded
          ? 'relative flex min-h-[24rem] w-full flex-col items-center justify-center px-4 py-10 pb-36'
          : 'relative flex min-h-[calc(100dvh-5.5rem)] w-full flex-col items-center justify-center px-6 py-16 pb-40'
      }
    >
      {isHorizontal ? (
        <LogoHorizontal
          className={embedded ? 'h-8 w-auto' : 'h-16 w-auto sm:h-20'}
          showPadding={showPadding}
          scribbleVariant={scribbleVariant}
          glyphStyle={glyphStyle}
        />
      ) : (
        <LogoIcon2x2
          className={embedded ? 'h-8 w-8' : 'h-28 w-28 sm:h-36 sm:w-36'}
          showPadding={showPadding}
          scribbleVariant={scribbleVariant}
          glyphStyle={glyphStyle}
        />
      )}
      <p className={`mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>
        Logo test · {isHorizontal ? 'horizontal' : '2×2'} · {statusStyle}
      </p>

      <div
        className={
          embedded
            ? 'absolute bottom-4 inset-x-0 z-20 flex justify-center px-3 pointer-events-none'
            : 'fixed bottom-5 inset-x-0 z-[200] flex justify-center px-3 pointer-events-none'
        }
        role="toolbar"
        aria-label="Logo test tools"
      >
        <div ref={dockRef} className="pointer-events-auto relative w-full max-w-[32rem]">
          {openGlyph && openSelected ? (
            <FitPopout
              open
              centerX
              className={`absolute bottom-full mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-2 shadow-[0_12px_40px_rgb(0,0,0,0.18)] ${popoutSurface}`}
              style={{ left: popoutLeft }}
              role="dialog"
              aria-label={`${openGlyph.label} variants`}
            >
              <p
                className={`px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider ${muted}`}
              >
                {openGlyph.label}
                {openGlyph.options.length > 1
                  ? ` · ${openGlyph.options.length} options`
                  : ' · 1 option'}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {openGlyph.options.map((opt) => {
                  const active = opt.id === openSelected.id;
                  const Preview = opt.Preview;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setGlyphPick((prev) => ({ ...prev, [openGlyph.id]: opt.id }));
                        setOpenSelector(null);
                      }}
                      className={`edu-control flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-colors ${
                        active
                          ? isDarkMode
                            ? 'border-rose-400 bg-rose-500/15'
                            : 'border-rose-400 bg-rose-50'
                          : isDarkMode
                            ? 'border-stone-700 hover:bg-stone-800'
                            : 'border-stone-200 hover:bg-stone-50'
                      }`}
                      aria-pressed={active}
                      title={opt.label}
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center ${openGlyph.colorClass}`}
                      >
                        <Preview className="h-10 w-10" />
                      </span>
                      <span className={`text-[11px] font-semibold ${title}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FitPopout>
          ) : null}

          {stylePopoutOpen ? (
            <FitPopout
              open
              centerX
              className={`absolute bottom-full mb-2 w-[min(14rem,calc(100vw-2rem))] rounded-2xl border p-2 shadow-[0_12px_40px_rgb(0,0,0,0.18)] ${popoutSurface}`}
              style={{ left: popoutLeft }}
              role="dialog"
              aria-label="Glyph styles"
            >
              <p
                className={`px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider ${muted}`}
              >
                Style · {GLYPH_STYLES.length} options
              </p>
              <div className="flex flex-col gap-1">
                {GLYPH_STYLES.map((style) => {
                  const active = style.id === glyphStyle;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setGlyphStyle(style.id);
                        setOpenSelector(null);
                      }}
                      className={`edu-control rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        active
                          ? isDarkMode
                            ? 'border-rose-400 bg-rose-500/15 text-stone-100'
                            : 'border-rose-400 bg-rose-50 text-stone-800'
                          : isDarkMode
                            ? 'border-stone-700 text-stone-200 hover:bg-stone-800'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                      aria-pressed={active}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </FitPopout>
          ) : null}

          <div
            className={`rounded-2xl border shadow-[0_12px_40px_rgb(0,0,0,0.14)] px-2 py-2 ${dockSurface}`}
          >
            {showPadding ? (
              <div
                className={`mx-2 mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2.5 py-1.5 ${
                  isDarkMode ? 'bg-stone-800/80' : 'bg-stone-100'
                }`}
                aria-hidden
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>
                  Legend · viewBox units
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs ${title}`}>
                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-400/80 ring-1 ring-sky-600/50" />
                  Glyph box
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs ${title}`}>
                  <span className="h-2.5 w-2.5 rounded-sm bg-orange-400/80 ring-1 ring-orange-600/40" />
                  Gap
                </span>
              </div>
            ) : null}

            <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setLayout('horizontal');
                  setOpenSelector(null);
                }}
                aria-pressed={isHorizontal}
                title="Horizontal lockup"
                className={chipClass(isHorizontal)}
              >
                <RectangleHorizontal size={16} strokeWidth={isHorizontal ? 2.5 : 2} />
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayout('icon');
                  setOpenSelector(null);
                }}
                aria-pressed={!isHorizontal}
                title="2×2 icon lockup"
                className={chipClass(!isHorizontal)}
              >
                <LayoutGrid size={16} strokeWidth={!isHorizontal ? 2.5 : 2} />
                2×2
              </button>

              {GLYPH_SELECTORS.map((glyph) => {
                const Icon = GLYPH_ICONS[glyph.id];
                const open = openSelector === glyph.id;

                return (
                  <button
                    key={glyph.id}
                    ref={(el) => {
                      chipRefs.current[glyph.id] = el;
                    }}
                    type="button"
                    onClick={() =>
                      setOpenSelector((cur) => (cur === glyph.id ? null : glyph.id))
                    }
                    aria-pressed={open}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    title={`${glyph.label} variants`}
                    className={chipClass(open)}
                  >
                    <Icon size={16} strokeWidth={open ? 2.5 : 2} />
                    {glyph.label}
                  </button>
                );
              })}

              <button
                ref={(el) => {
                  chipRefs.current.style = el;
                }}
                type="button"
                onClick={() =>
                  setOpenSelector((cur) => (cur === 'style' ? null : 'style'))
                }
                aria-pressed={stylePopoutOpen || glyphStyle !== DEFAULT_GLYPH_STYLE_ID}
                aria-haspopup="dialog"
                aria-expanded={stylePopoutOpen}
                title={`Style · ${styleMeta.label}`}
                className={chipClass(
                  stylePopoutOpen || glyphStyle !== DEFAULT_GLYPH_STYLE_ID
                )}
              >
                <Layers
                  size={16}
                  strokeWidth={
                    stylePopoutOpen || glyphStyle !== DEFAULT_GLYPH_STYLE_ID ? 2.5 : 2
                  }
                />
                Style
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPadding((v) => !v);
                  setOpenSelector(null);
                }}
                aria-pressed={showPadding}
                title={showPadding ? 'Hide glyph padding' : 'Show glyph padding'}
                className={chipClass(showPadding)}
              >
                <Ruler size={16} strokeWidth={showPadding ? 2.5 : 2} />
                Padding
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
