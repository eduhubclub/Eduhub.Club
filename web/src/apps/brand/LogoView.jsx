/**
 * Inline logo glyphs for HubBrand Logo copy.
 */

function GlyphCircle({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em]' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="8" className="text-rose-500" fill="currentColor" />
    </svg>
  );
}

function GlyphTriangle({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em]' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        d="M10 2.5 L17.5 17 H2.5 Z"
        className="text-amber-500"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlyphSquare({ className = 'inline-block h-[1.1em] w-[1.1em] align-[-0.15em]' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <rect
        x="2.5"
        y="2.5"
        width="15"
        height="15"
        rx="2.5"
        className="text-emerald-500"
        fill="currentColor"
      />
    </svg>
  );
}

function GlyphSquiggle({ className = 'inline-block h-[1.1em] w-[1.35em] align-[-0.15em]' }) {
  return (
    <svg viewBox="0 0 24 20" className={className} aria-hidden>
      <path
        d="M6 4 C 14 4, 16 10, 12 14 C 6 19, -1 14, 1 8 C 3 3, 14 6, 12 11 C 10 16, 3 15, 5 10 C 7 5, 12 8, 10 13"
        className="text-sky-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * HubBrand Logo — marks and meaning.
 */
export function LogoView({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-3xl px-6 pt-4 sm:px-10 sm:pt-6">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Logo
        </h1>

        <div className={`mt-6 max-w-2xl space-y-4 text-base leading-relaxed sm:text-lg ${muted}`}>
          <p>Our logo showcases our different learners and their journeys.</p>
          <p>
            <GlyphSquiggle /> Points to our first marks.
          </p>
          <p>
            <GlyphTriangle /> <GlyphSquare /> <GlyphCircle /> Show what we learn to build
            with.
          </p>
        </div>
      </article>

      <div className="px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 md:pb-20">
        <p
          className={`mt-10 text-center text-base leading-relaxed sm:text-lg ${muted}`}
        >
          Together we can make anything
        </p>
        <div
          className={`mt-3 flex min-h-56 w-full items-center justify-center rounded-3xl border border-dashed ${
            isDarkMode
              ? 'border-stone-600 bg-stone-900/40'
              : 'border-stone-300 bg-white/50'
          }`}
          aria-label="Illustration placeholder"
        >
          <p className={`text-sm ${muted}`}>Illustration placeholder</p>
        </div>
      </div>
    </div>
  );
}
