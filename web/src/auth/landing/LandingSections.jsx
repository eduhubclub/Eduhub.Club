import { SampleSpotCharacter } from '../../apps/brand/artStyleSamples';
import {
  GlyphCircle,
  GlyphScribble,
  GlyphSquare,
  GlyphTriangle,
} from '../../shared/logoGlyphs';
import { TYPE } from '../../shared/typography';
import {
  LANDING_POPS,
  landingHandStyle,
  mutedInk,
  paperCard,
  popFillStyle,
} from './landingStyle';

const BLOCKS = [
  {
    id: 'classes',
    title: 'Classes',
    caption: 'One roster, every tool.',
    Icon: GlyphCircle,
  },
  {
    id: 'tools',
    title: 'Tools',
    caption: 'Timers, boards, and games.',
    Icon: GlyphTriangle,
  },
  {
    id: 'students',
    title: 'Students',
    caption: 'Names, jobs, and checkout.',
    Icon: GlyphSquare,
  },
  {
    id: 'yours',
    title: 'Make it yours',
    caption: 'Shape, line, and a little mess.',
    Icon: GlyphScribble,
  },
];

const APPS = [
  {
    id: 'meeting',
    title: 'Morning Meeting',
    line: 'A walk-in board before the first bell.',
    rotate: '-rotate-2',
  },
  {
    id: 'library',
    title: 'Library',
    line: 'Shelf, labels, and books out to students.',
    rotate: 'rotate-1',
  },
  {
    id: 'slides',
    title: 'Slides',
    line: 'A 16:9 lesson on the classroom display.',
    rotate: '-rotate-1',
  },
];

const BUBBLES = [
  { text: 'Simply playful', pop: LANDING_POPS.rose, rotate: '-rotate-3' },
  { text: 'Pops of color', pop: LANDING_POPS.amber, rotate: 'rotate-2' },
  { text: 'Flexible tools', pop: LANDING_POPS.emerald, rotate: '-rotate-1' },
  { text: 'Made for class', pop: LANDING_POPS.sky, rotate: 'rotate-3' },
];

/**
 * Scroll sections under the sign-in hero.
 */
export function LandingSections() {
  const scrollToSignIn = () => {
    document.getElementById('sign-in')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BLOCKS.map(({ id, title, caption, Icon }) => (
            <li key={id} className="flex flex-col items-center text-center">
              <Icon className="h-14 w-14" />
              <p className="mt-3 font-serif text-xl font-bold tracking-tight">{title}</p>
              <p className={`mt-1 max-w-[14rem] ${TYPE.bodyMd} ${mutedInk}`}>{caption}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="apps" className="scroll-mt-20 py-14 sm:py-16" style={popFillStyle(LANDING_POPS.sky)}>
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <h2 className="max-w-xl font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Tools you already run in class
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {APPS.map(({ id, title, line, rotate }) => (
              <li
                key={id}
                className={`rounded-[1.75rem] border-[1.5px] px-5 py-6 shadow-sm ${rotate} ${paperCard}`}
              >
                <p className="font-serif text-2xl font-bold tracking-tight">{title}</p>
                <p className={`mt-2 ${TYPE.bodyMd} ${mutedInk}`}>{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="why" className="scroll-mt-20 mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="mx-auto w-full max-w-xs">
            <SampleSpotCharacter className="w-full" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Playful on purpose
            </h2>
            <p className={`mt-3 max-w-md text-base leading-relaxed sm:text-lg ${mutedInk}`}>
              Pops of color, shape, and line — so the tools stay flexible, and the room still feels
              like yours.
            </p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {BUBBLES.map(({ text, pop, rotate }) => (
                <li
                  key={text}
                  className={`rounded-full px-5 py-2 text-2xl leading-none shadow-sm ${rotate}`}
                  style={{ ...landingHandStyle, ...popFillStyle(pop) }}
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-8">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Ready when you are.</h2>
        <button
          type="button"
          onClick={scrollToSignIn}
          className="edu-control mt-6 inline-flex rounded-full px-6 py-3 text-base font-semibold"
          style={popFillStyle(LANDING_POPS.rose)}
        >
          Choose how you are signing in
        </button>
      </section>
    </div>
  );
}
