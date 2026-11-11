import { SHAPES, SHAPE_GROUPS } from '../../shared/shapeLibrary';
import { ShapeSurface } from '../../shared/ShapeSurface';

const LOGO_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9'];

/**
 * HubBrand Libraries — rounded polygon shape catalog for badges and accents.
 */
export function LibrariesView({ isDarkMode }) {
  const title = isDarkMode ? 'text-stone-100' : 'text-stone-900';
  const muted = isDarkMode ? 'text-stone-400' : 'text-stone-600';
  const panel = isDarkMode
    ? 'bg-stone-900/80 border-stone-700'
    : 'bg-white/70 border-stone-200/80';
  const ink = '#0f172a';

  return (
    <div className={`min-h-full ${title}`}>
      <article className="mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16 md:py-20">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted}`}>
          HubBrand · Libraries
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Shapes
        </h1>
        <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${muted}`}>
          {SHAPES.length} rounded polygon shapes for badges, marks, and accents — so screens
          aren&apos;t only circles.
        </p>

        <div className="mt-12 space-y-12">
          {SHAPE_GROUPS.map((group) => {
            const shapes = SHAPES.filter((s) => s.group === group.id);
            if (!shapes.length) return null;
            return (
              <section key={group.id}>
                <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                  {group.label}
                </h2>
                <ul
                  className={`mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 rounded-3xl border p-4 sm:p-5 ${panel}`}
                >
                  {shapes.map((shape, index) => {
                    const fill = LOGO_COLORS[index % LOGO_COLORS.length];
                    return (
                      <li
                        key={shape.id}
                        className="flex flex-col items-center gap-2.5 min-w-0 py-2"
                      >
                        <ShapeSurface
                          shape={shape.id}
                          className="h-14 w-14 shrink-0 text-sm font-bold tabular-nums"
                          style={{ backgroundColor: fill, color: ink }}
                          title={shape.id}
                          aria-label={shape.label}
                        />
                        <div className="min-w-0 text-center">
                          <p
                            className={`truncate text-sm font-semibold ${
                              isDarkMode ? 'text-stone-100' : 'text-stone-900'
                            }`}
                            title={shape.id}
                          >
                            {shape.id}
                          </p>
                          <p className={`truncate text-xs ${muted}`}>{shape.label}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
}
