import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  GlyphCircle,
  GlyphScribble,
  GlyphSquare,
  GlyphTriangle,
  LOGO_HORIZONTAL_TIGHT_VIEWBOX,
  LogoHorizontal,
  LogoIcon2x2,
} from '../../shared/Logo';
import { primaryPalettes } from '../../shared/theme';
import { GLYPH_STYLES } from '../../shared/logoGlyphStyleMarks';
import { BUMPER_APPS } from './bumperApps';
import { ShapeViewMark } from './ShapeViewMark';
import logoPhotoSample from '../../assets/brand/logo-photo-sample.png';
import artistPaintingMonaLisa from '../../assets/brand/hub-brand/artist-painting-mona-lisa.svg';
import artistPaintingMonaLisaDark from '../../assets/brand/hub-brand/artist-painting-mona-lisa-dark.svg';
import girlMeasuring from '../../assets/brand/hub-brand/girl-measuring.svg';
import girlMeasuringDark from '../../assets/brand/hub-brand/girl-measuring-dark.svg';
import weCanBuildAnything from '../../assets/brand/hub-brand/we-can-build-anything.svg';
import weCanBuildAnythingDark from '../../assets/brand/hub-brand/we-can-build-anything-dark.svg';

/** Fixed light / dark stages so contrast is provable in either app theme. */
const LIGHT_STAGE = 'bg-white border-stone-200';
const DARK_STAGE = 'bg-stone-900 border-stone-700';

/** LogoHorizontal viewBox is 100×24; circle glyph is 20×20 → unit = logo height × 20/24.
 *  With logo at h-12 (3rem), unit = 2.5rem. */
const SAFE_ZONE_UNIT = '2.5rem';
/** 2×2 icon viewBox 40×40; circle glyph is 16×16. Logo at h-16 (4rem) → unit = 1.6rem. */
const SAFE_ZONE_ICON_UNIT = '1.6rem'; // 4rem × 16/40

function SafeZoneMarker({ className }) {
  return <GlyphCircle className={`block h-full w-full ${className}`} />;
}

function safeZoneChrome(isDarkMode) {
  return {
    cell: isDarkMode ? 'bg-stone-900' : 'bg-white',
    grid: isDarkMode
      ? 'border-stone-600 bg-stone-600'
      : 'border-stone-200 bg-stone-200',
    marker: isDarkMode ? 'text-white/20' : 'text-slate-200',
  };
}

/**
 * Horizontal lockup: ghost circles on every side, with an internal unit grid.
 */
function SafeZoneDiagram({ isDarkMode }) {
  const { cell, grid, marker } = safeZoneChrome(isDarkMode);

  const empty = <div className={cell} aria-hidden />;
  const markerCell = (
    <div className={`min-h-0 min-w-0 ${cell}`} aria-hidden>
      <SafeZoneMarker className={marker} />
    </div>
  );

  return (
    <div
      className={`inline-grid gap-px border ${grid}`}
      style={{
        gridTemplateColumns: `${SAFE_ZONE_UNIT} auto ${SAFE_ZONE_UNIT}`,
        gridTemplateRows: `${SAFE_ZONE_UNIT} auto ${SAFE_ZONE_UNIT}`,
      }}
      role="img"
      aria-label="Safe zone equal to one circle on every side of the horizontal lockup"
    >
      {empty}
      {markerCell}
      {empty}
      {markerCell}
      <div className={`flex items-center justify-center ${cell}`}>
        <LogoHorizontal className="h-12 w-auto" viewBox={LOGO_HORIZONTAL_TIGHT_VIEWBOX} />
      </div>
      {markerCell}
      {empty}
      {markerCell}
      {empty}
    </div>
  );
}

/**
 * 2×2 icon: real lockup (padding intact) with circle-sized clear space on every side.
 */
function SafeZoneIconDiagram({ isDarkMode }) {
  const { cell, grid, marker } = safeZoneChrome(isDarkMode);

  const empty = <div className={cell} aria-hidden />;
  const markerCell = (
    <div className={`min-h-0 min-w-0 ${cell}`} aria-hidden>
      <SafeZoneMarker className={marker} />
    </div>
  );

  return (
    <div
      className={`inline-grid gap-px border ${grid}`}
      style={{
        gridTemplateColumns: `${SAFE_ZONE_ICON_UNIT} auto ${SAFE_ZONE_ICON_UNIT}`,
        gridTemplateRows: `${SAFE_ZONE_ICON_UNIT} auto ${SAFE_ZONE_ICON_UNIT}`,
      }}
      role="img"
      aria-label="Safe zone equal to one circle on every side of the 2 by 2 icon"
    >
      {empty}
      {markerCell}
      {empty}
      {markerCell}
      <div className={`flex items-center justify-center ${cell}`}>
        <LogoIcon2x2 className="h-16 w-16" />
      </div>
      {markerCell}
      {empty}
      {markerCell}
      {empty}
    </div>
  );
}

/** Edu.{App} carousel — Hub color changes with each product name. */
function LogotypeCarousel({ titleClass, panel, isDarkMode }) {
  const [index, setIndex] = useState(0);
  const count = BUMPER_APPS.length;
  const app = BUMPER_APPS[index];
  const arrow =
    `edu-control absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition-colors ${
      isDarkMode
        ? 'border-stone-600 bg-stone-900/80 text-stone-300 hover:bg-stone-800'
        : 'border-stone-200 bg-white/90 text-stone-600 hover:bg-stone-50'
    }`;

  return (
    <figure className={`relative mt-8 rounded-3xl border p-8 sm:p-10 ${panel}`}>
      <button
        type="button"
        aria-label="Previous app logotype"
        onClick={() => setIndex((i) => (i - 1 + count) % count)}
        className={`${arrow} left-3 sm:left-4`}
      >
        <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Next app logotype"
        onClick={() => setIndex((i) => (i + 1) % count)}
        className={`${arrow} right-3 sm:right-4`}
      >
        <ChevronRight size={20} strokeWidth={2.25} aria-hidden />
      </button>
      <div className="flex justify-center px-12 sm:px-14">
        <p
          className="font-extrabold tracking-tight leading-none"
          style={{ fontSize: '2.5rem' }}
          aria-live="polite"
        >
          <span className={titleClass}>Edu.</span>
          <span className={app.colorClass}>{app.name}</span>
        </p>
      </div>
    </figure>
  );
}

/** Official glyph colors — rose, amber, emerald, sky. */
const COLOR_SWATCHES = [
  {
    name: 'Rose',
    note: 'The mark that starts the journey.',
    Glyph: GlyphCircle,
    colorClass: 'text-rose-500',
  },
  {
    name: 'Amber',
    note: 'Building toward the idea.',
    Glyph: GlyphTriangle,
    colorClass: 'text-amber-500',
  },
  {
    name: 'Emerald',
    note: 'The shape we learn to hold.',
    Glyph: GlyphSquare,
    colorClass: 'text-emerald-500',
  },
  {
    name: 'Sky',
    note: 'The path that points ahead.',
    Glyph: GlyphScribble,
    colorClass: 'text-sky-500',
  },
];

/**
 * HubBrand Logo — marks, safe zone, light & dark, color, and variations.
 * Webpage mode: serif headings and stone/paper text, no app board chrome.
 */
export function LogoView({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';
  const panel = isDarkMode
    ? 'bg-stone-900/80 border-stone-700'
    : 'bg-white/70 border-stone-200/80';
  const heading = 'font-serif text-2xl font-bold tracking-tight sm:text-3xl';
  const fullVisualCaption = `flex min-h-[4.5rem] items-center justify-center border-t px-4 py-3.5 text-center text-sm ${
    isDarkMode
      ? 'border-slate-600 bg-slate-800/50 text-slate-300'
      : 'border-slate-200 bg-slate-100 text-slate-600'
  }`;
  const colorSwatchCaption = `flex shrink-0 flex-col items-center justify-center gap-0.5 border-t px-3 py-2.5 text-center text-sm ${
    isDarkMode
      ? 'border-slate-600 bg-slate-800/50 text-slate-300'
      : 'border-slate-200 bg-slate-100 text-slate-600'
  }`;

  const colorSwatchFigure = ({ name, note, Glyph, colorClass }) => (
    <figure
      key={name}
      className={`relative z-10 flex h-full flex-col overflow-hidden rounded-3xl border ${panel}`}
    >
      <div
        className={`flex min-h-[9rem] flex-1 items-center justify-center p-5 ${
          isDarkMode ? 'bg-stone-900' : 'bg-white'
        }`}
      >
        <Glyph className={`h-20 w-20 ${colorClass}`} />
      </div>
      <figcaption className={colorSwatchCaption}>
        <span className={`font-semibold ${title}`}>{name}</span>
        <span className="text-xs leading-snug">{note}</span>
      </figcaption>
    </figure>
  );

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-5xl px-6 pt-4 pb-12 sm:px-10 sm:pt-6 sm:pb-16 md:pb-20">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Logo
        </h1>

        <div className={`mt-6 max-w-2xl space-y-4 text-base leading-relaxed sm:text-lg ${muted}`}>
          <p>Our logo showcases our different learners and their journeys.</p>
          <p className="flex items-center gap-2">
            <GlyphScribble className="inline-block h-[3.3em] w-[3.3em] shrink-0 text-sky-500" />
            <span>The scribble points to our first marks.</span>
          </p>
          <p className="flex items-center gap-2">
            <ShapeViewMark className="h-[3.3em] w-[3.3em] shrink-0" />
            <span>The shapes show what we learn to build with.</span>
          </p>
        </div>
        <div className={`mx-auto mt-6 w-full max-w-2xl space-y-4 text-base leading-relaxed sm:text-lg ${muted}`}>
          <p className="text-center">We can build anything.</p>
          <img
            src={isDarkMode ? weCanBuildAnythingDark : weCanBuildAnything}
            alt="Kid-art illustration: we can build anything"
            className="mx-auto w-full object-contain"
          />
        </div>

        <section className="mt-14">
          <h2 className={heading}>The Logomark</h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            Two stand alone layouts are available.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure
              className={`flex flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[12rem] flex-1 items-center justify-center p-6 sm:p-8">
                <LogoIcon2x2 className="h-28 w-28" />
              </div>
              <figcaption className={fullVisualCaption}>2 × 2</figcaption>
            </figure>

            <figure
              className={`flex flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[12rem] flex-1 items-center justify-center p-6 sm:p-8">
                <LogoHorizontal className="h-14 w-auto" />
              </div>
              <figcaption className={fullVisualCaption}>Horizontal</figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={heading}>The Logotype</h2>
          <LogotypeCarousel titleClass={title} panel={panel} isDarkMode={isDarkMode} />
          <p className={`mt-6 max-w-xl text-base leading-relaxed ${muted}`}>
            The idea of the Hub is anchored to the Edu. This reiterates the app&apos;s commitment
            to everything education. To showcase our versatility, the Hub text color changes by
            app. Blue is our go-to color.
          </p>
        </section>

        <section className="mt-14">
          <h2 className={heading}>The Full Visual</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[9rem] flex-1 items-center justify-center p-6 sm:p-8">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="relative h-[2rem] w-3 shrink-0 text-stone-400"
                    aria-hidden
                  >
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                    <span className="absolute top-0 left-0 right-0 h-px bg-current" />
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-current" />
                  </div>
                  <LogoIcon2x2 className="h-[2rem] w-[2rem] shrink-0" />
                  <p
                    className="font-extrabold tracking-tight leading-none"
                    style={{ fontSize: '2rem' }}
                  >
                    <span className={title}>Edu.</span>
                    <span className={primaryPalettes.Blue.text}>Hub</span>
                  </p>
                </div>
              </div>
              <figcaption className={fullVisualCaption}>
                Logo is as tall as the text.
              </figcaption>
            </figure>

            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[9rem] flex-1 items-center justify-center p-6 sm:p-8">
                <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-2.5 gap-y-2">
                  <div
                    className="relative h-[1.25rem] w-3 text-stone-400"
                    aria-hidden
                  >
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                    <span className="absolute top-0 left-0 right-0 h-px bg-current" />
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-current" />
                  </div>
                  <div className="relative flex h-[1.25rem] items-center">
                    <span
                      className="invisible whitespace-nowrap font-extrabold tracking-tight"
                      style={{ fontSize: '1.25rem' }}
                      aria-hidden
                    >
                      Edu.Hub
                    </span>
                    <LogoHorizontal className="absolute inset-0 h-full w-full" />
                  </div>
                  <p
                    className="whitespace-nowrap font-extrabold tracking-tight leading-none"
                    style={{ fontSize: '1.25rem' }}
                  >
                    <span className={title}>Edu.</span>
                    <span className={primaryPalettes.Blue.text}>Hub</span>
                  </p>
                  <div aria-hidden />
                  <div className="relative h-3 text-stone-400" aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 bottom-0 left-0 w-px bg-current" />
                    <span className="absolute top-0 bottom-0 right-0 w-px bg-current" />
                  </div>
                  <div className="relative h-3 text-stone-400" aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 bottom-0 left-0 w-px bg-current" />
                    <span className="absolute top-0 bottom-0 right-0 w-px bg-current" />
                  </div>
                </div>
              </div>
              <figcaption className={fullVisualCaption}>
                The logo is the same length and height as the Edu.Hub text.
              </figcaption>
            </figure>

            <div className="flex min-h-[14rem] items-center justify-center overflow-visible">
              <img
                src={isDarkMode ? girlMeasuringDark : girlMeasuring}
                alt="Kid-art illustration: girl measuring the logo"
                className="pointer-events-none h-full max-h-72 w-auto max-w-full object-contain"
              />
            </div>

            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[9rem] flex-1 items-center justify-center p-6 sm:p-8">
                <div className="inline-flex flex-col gap-2">
                  <div className="inline-flex items-center gap-x-2.5">
                    <div
                      className="relative h-[1.25rem] w-3 text-stone-400"
                      aria-hidden
                    >
                      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                      <span className="absolute top-0 left-0 right-0 h-px bg-current" />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-current" />
                    </div>
                    <div className="relative">
                      <LogoHorizontal className="invisible block h-[1.25rem] w-auto" />
                      <p
                        className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-extrabold tracking-tight leading-none"
                        style={{ fontSize: '1.25rem' }}
                      >
                        <span className={title}>Edu.</span>
                        <span className={primaryPalettes.Blue.text}>Hub</span>
                      </p>
                    </div>
                  </div>
                  <div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5">
                    <div
                      className="relative h-[1.25rem] w-3 text-stone-400"
                      aria-hidden
                    >
                      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                      <span className="absolute top-0 left-0 right-0 h-px bg-current" />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-current" />
                    </div>
                    <LogoHorizontal className="block h-[1.25rem] w-auto" />
                    <div aria-hidden />
                    <div className="relative h-3 text-stone-400" aria-hidden>
                      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                      <span className="absolute top-0 bottom-0 left-0 w-px bg-current" />
                      <span className="absolute top-0 bottom-0 right-0 w-px bg-current" />
                    </div>
                  </div>
                </div>
              </div>
              <figcaption className={fullVisualCaption}>
                If stacked the shapes are the base.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={heading}>Safe Zone</h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            The circle is the unit. Keep one circle of clear space on every side of the lockup —
            nothing enters this zone.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div
                className={`flex min-h-[9rem] flex-1 items-center justify-center p-6 sm:p-8 ${
                  isDarkMode ? 'bg-stone-900' : 'bg-white'
                }`}
              >
                <SafeZoneDiagram isDarkMode={isDarkMode} />
              </div>
              <figcaption className={fullVisualCaption}>
                The logo&apos;s safe zone is equivalent to the height of the
                &quot;circle&quot; on all sides.
              </figcaption>
            </figure>

            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div
                className={`flex min-h-[9rem] flex-1 items-center justify-center p-6 sm:p-8 ${
                  isDarkMode ? 'bg-stone-900' : 'bg-white'
                }`}
              >
                <SafeZoneIconDiagram isDarkMode={isDarkMode} />
              </div>
              <figcaption className={fullVisualCaption}>
                The logo&apos;s safe zone is equivalent to the height of the
                &quot;circle&quot; on all sides.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={heading}>Light &amp; Dark</h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            The logo is adaptable to light and dark environments.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
                <div className={`flex h-20 items-center justify-center rounded-2xl border ${LIGHT_STAGE}`}>
                  <LogoHorizontal className="h-8 w-auto" />
                </div>
                <div className={`flex h-20 items-center justify-center rounded-2xl border ${DARK_STAGE}`}>
                  <LogoHorizontal className="h-8 w-auto" />
                </div>
              </div>
              <figcaption className={fullVisualCaption}>
                Horizontal — full color on light and dark.
              </figcaption>
            </figure>

            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
                <div className={`flex h-20 items-center justify-center rounded-2xl border ${LIGHT_STAGE}`}>
                  <LogoIcon2x2 className="h-12 w-12" />
                </div>
                <div className={`flex h-20 items-center justify-center rounded-2xl border ${DARK_STAGE}`}>
                  <LogoIcon2x2 className="h-12 w-12" />
                </div>
              </div>
              <figcaption className={fullVisualCaption}>
                2 × 2 — full color on light and dark.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={heading}>Color</h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            Four colors, four shapes — keep the official hues wherever the mark appears.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 overflow-visible sm:grid-cols-3 sm:gap-6">
            {COLOR_SWATCHES.slice(0, 2).map(colorSwatchFigure)}

            <div className="relative z-0 col-span-2 flex min-h-[14rem] items-center justify-end overflow-visible sm:col-span-1 sm:row-span-2 sm:h-full sm:min-h-0">
              <img
                src={isDarkMode ? artistPaintingMonaLisaDark : artistPaintingMonaLisa}
                alt="Kid-art illustration of a child painting the Mona Lisa"
                className="pointer-events-none h-full w-auto max-w-none translate-x-[18%] object-contain"
              />
            </div>

            {COLOR_SWATCHES.slice(2).map(colorSwatchFigure)}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="flex min-h-[9rem] flex-1 items-center justify-center bg-stone-900 p-6 sm:p-8">
                <LogoIcon2x2 monochrome className="h-32 w-32 text-white" />
              </div>
              <figcaption className={fullVisualCaption}>
                White mark on dark.
              </figcaption>
            </figure>

            <figure
              className={`flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border ${panel}`}
            >
              <div className="relative flex min-h-[9rem] flex-1 items-center justify-center overflow-hidden">
                <img
                  src={logoPhotoSample}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <LogoIcon2x2 monochrome className="relative z-10 h-32 w-32 text-white" />
              </div>
              <figcaption className={fullVisualCaption}>
                White mark on photography.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-14">
          <h2 className={heading}>Variations</h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            The logo is playful. Feel free to play with line and texture to achieve
            different looks.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {GLYPH_STYLES.map(({ id, label }) => (
              <figure
                key={id}
                className={`flex h-full flex-col overflow-hidden rounded-3xl border ${panel}`}
              >
                <div
                  className={`flex min-h-[10rem] flex-1 flex-col items-center justify-center gap-5 p-6 sm:p-8 ${
                    isDarkMode ? 'bg-stone-900' : 'bg-white'
                  }`}
                >
                  <LogoIcon2x2 className="h-8 w-8" glyphStyle={id} />
                  <LogoHorizontal className="h-8 w-auto" glyphStyle={id} />
                </div>
                <figcaption className={fullVisualCaption}>{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
