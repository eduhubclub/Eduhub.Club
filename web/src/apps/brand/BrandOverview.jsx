import { BrandBumper } from './BrandBumper';

/**
 * HubBrand Overview — short intro; Art Style holds the mood work.
 * Page canvas comes from Settings → Shell background (no local cream fill).
 */
export function BrandOverview({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-3xl px-6 pt-4 pb-12 sm:px-10 sm:pt-6 sm:pb-16 md:pb-20">
        <BrandBumper isDarkMode={isDarkMode} />
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-8">
          <div className={`min-w-0 flex-1 text-base leading-relaxed sm:text-lg ${muted}`}>
            <p>
              We thought we&apos;d build our Brand and App Guidelines just like we built everything
              else. As a simple, versatile, playful app.
            </p>
            <p className="mt-4">
              Find our Brand and App Guidelines for other users here.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {['Students', 'Parents', 'Administrators'].map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className={`edu-control underline underline-offset-2 decoration-stone-400/80 hover:decoration-current ${
                      isDarkMode ? 'text-stone-200' : 'text-stone-800'
                    }`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div
            className={`flex min-h-40 w-full shrink-0 items-center justify-center rounded-3xl border border-dashed px-4 py-8 sm:w-44 sm:min-h-0 ${
              isDarkMode
                ? 'border-stone-600 bg-stone-900/40'
                : 'border-stone-300 bg-white/50'
            }`}
            aria-label="Illustration placeholder"
          >
            <p className={`text-center text-xs ${muted}`}>Illustration</p>
          </div>
        </div>

        <section className="mt-14 max-w-2xl">
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Philosophy
          </h2>
          <div className={`mt-4 text-base leading-relaxed sm:text-lg ${muted}`}>
            <p>
              Every one of us had a teacher that made us feel that learning was worth it. By
              teacher, we don&apos;t just mean in the traditional sense. Someone, well — special.
            </p>
            <p className="mt-4">
              Our philosophy is to use our design and apps to help make those moments happen.
            </p>
          </div>
        </section>

        <section className="mt-10 max-w-2xl" aria-label="Illustration placeholder">
          <div
            className={`flex min-h-48 items-center justify-center rounded-3xl border border-dashed px-6 py-10 ${
              isDarkMode
                ? 'border-stone-600 bg-stone-900/40'
                : 'border-stone-300 bg-white/50'
            }`}
          >
            <p className={`text-center text-sm ${muted}`}>
              Illustration placeholder
            </p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Personality
          </h2>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-8">
            <div
              className={`flex min-h-40 w-full shrink-0 items-center justify-center rounded-3xl border border-dashed px-4 py-8 sm:w-44 sm:min-h-[11rem] ${
                isDarkMode
                  ? 'border-stone-600 bg-stone-900/40'
                  : 'border-stone-300 bg-white/50'
              }`}
              aria-label="Illustration placeholder"
            >
              <p className={`text-center text-xs ${muted}`}>Illustration</p>
            </div>
            <p className={`min-w-0 flex-1 text-base leading-relaxed sm:text-lg ${muted}`}>
              Our personality is simply playful. We use pops of color, shape, and line to emphasize
              our design for flexible and adaptable apps.
            </p>
          </div>
        </section>

      </article>
    </div>
  );
}
