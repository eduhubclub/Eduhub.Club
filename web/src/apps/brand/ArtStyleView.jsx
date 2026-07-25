import { LogoHorizontal } from '../../shared/Logo';
import {
  ART_STYLE_NOTES,
  SampleLineWhimsy,
  SampleLogoBlocks,
  SampleShapeUnderLine,
  SampleSpotCharacter,
} from './artStyleSamples';

/**
 * HubBrand Art Style — webpage rhythm inside the app shell.
 * Canvas comes from Settings → Shell background (no local cream fill).
 */
export function ArtStyleView({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';
  const panel = isDarkMode
    ? 'bg-stone-900/80 border-stone-700'
    : 'bg-white/70 border-stone-200/80';
  const rule = isDarkMode ? 'border-stone-800' : 'border-stone-300/70';

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16 md:py-20">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>
          HubBrand · Art style
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Playful whimsy, built from shape and line
        </h1>
        <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${muted}`}>
          A quick look at the illustration direction for Edu.Hub. Keep the shell and sidebar —
          this page is meant to feel like a brand site inside the app. Full kid-art color
          underlays come next; for now we start with line and the logo’s building blocks.
        </p>

        <div className={`mt-10 flex items-center gap-4 border-y py-6 ${rule}`}>
          <LogoHorizontal className="h-6 w-auto" />
          <p className={`text-sm leading-snug ${muted}`}>
            Rose · amber · emerald · sky — the same blocks that make the mark.
          </p>
        </div>

        <section className="mt-14 space-y-10">
          {ART_STYLE_NOTES.map((note) => (
            <div key={note.id}>
              <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                {note.title}
              </h2>
              <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>{note.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Samples
          </h2>
          <p className={`mt-2 max-w-xl text-base leading-relaxed ${muted}`}>
            Original sketches in the spirit of the mood board — not final assets.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure className={`rounded-3xl border p-5 ${panel}`}>
              <SampleLineWhimsy className="w-full" />
              <figcaption className={`mt-4 text-sm ${muted}`}>
                Line first — ink carries the personality.
              </figcaption>
            </figure>
            <figure className={`rounded-3xl border p-5 ${panel}`}>
              <SampleShapeUnderLine className="w-full" />
              <figcaption className={`mt-4 text-sm ${muted}`}>
                Coming next — color shape under the line.
              </figcaption>
            </figure>
            <figure className={`rounded-3xl border p-5 ${panel}`}>
              <SampleLogoBlocks className="w-full" />
              <figcaption className={`mt-4 text-sm ${muted}`}>
                Logo glyphs as building blocks for shape + line.
              </figcaption>
            </figure>
            <figure className={`rounded-3xl border p-5 ${panel}`}>
              <SampleSpotCharacter className="w-full" />
              <figcaption className={`mt-4 text-sm ${muted}`}>
                Spot character — simple fill, marker outline on top.
              </figcaption>
            </figure>
          </div>
        </section>

        <p className={`mt-16 text-sm leading-relaxed ${muted}`}>
          Next passes can deepen kid-art underlays, safe zones, and do/don’t pairs — still
          webpage rhythm, still our nav.
        </p>
      </article>
    </div>
  );
}
