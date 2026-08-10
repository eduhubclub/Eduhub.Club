import { getEduColorPalette } from './eduColorPalette';

/**
 * HubBrand Color — interim brand spot palette (Edu.ColorPalette).
 * Theme / role decisions are made in Color Test; this page will later become
 * a simplified Color Brand surface that publishes those decisions.
 * Contrast docs live in AppGuide → Colors.
 */
export function ColorView({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';
  const labelMuted = isDarkMode ? 'text-stone-500' : 'text-stone-500';
  const palette = getEduColorPalette();

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-6xl px-6 pt-4 pb-12 sm:px-10 sm:pt-6 sm:pb-16 md:pb-20">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Color
        </h1>
        <p className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg ${muted}`}>
          Our brand is color.
        </p>
        <div
          className={`mt-10 flex min-h-48 max-w-2xl items-center justify-center rounded-3xl border border-dashed px-6 py-10 ${
            isDarkMode
              ? 'border-stone-600 bg-stone-900/40'
              : 'border-stone-300 bg-white/50'
          }`}
          aria-label="Illustration placeholder"
        >
          <p className={`text-center text-sm ${muted}`}>Illustration placeholder</p>
        </div>
        <p className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg ${muted}`}>
          Schools are filled with every color under the sun. From its people to its materials, we
          want to celebrate that with our Edu.ColorPalette.
        </p>

        <ul
          className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-3"
          aria-label="Edu.ColorPalette"
        >
          {palette.map((color) => (
            <li key={color.name} className="flex flex-col items-center text-center">
              <span
                className={`h-20 w-20 shrink-0 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.12)] ${
                  color.name === 'White'
                    ? isDarkMode
                      ? 'ring-1 ring-stone-500'
                      : 'ring-1 ring-stone-300'
                    : 'ring-1 ring-black/5'
                }`}
                style={{ backgroundColor: color.hex }}
                aria-hidden
              />
              <p className="mt-3 text-sm font-semibold tracking-wide">{color.name}</p>
              <dl className={`mt-2 space-y-0.5 font-mono text-[10px] leading-snug sm:text-[11px] ${labelMuted}`}>
                <div>
                  <dt className="inline">PMS: </dt>
                  <dd className="inline">{color.pms}</dd>
                </div>
                <div>
                  <dt className="inline">RGB: </dt>
                  <dd className="inline">{color.rgb}</dd>
                </div>
                <div>
                  <dt className="inline">CMYK: </dt>
                  <dd className="inline">{color.cmyk}</dd>
                </div>
                <div>
                  <dt className="inline">HEX: </dt>
                  <dd className="inline">{color.hex}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
