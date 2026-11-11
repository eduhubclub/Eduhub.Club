import { AppBoard } from '../../shared/AppBoard';
import { AppPageShell } from '../../shared/AppPageShell';
import { SHAPES, SHAPE_GROUPS } from '../../shared/shapeLibrary';
import { ShapeSurface } from '../../shared/ShapeSurface';
import { TYPE } from '../../shared/typography';

/**
 * AppGuide → Patterns → Shapes — rounded polygon catalog for badges and accents.
 */
export function ShapesLibraryView({ isDarkMode, theme }) {
  return (
    <AppPageShell mode="scroll" theme={theme}>
      <div className="space-y-4">
        <div>
          <h1 className={`${TYPE.titleLg} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Shapes
          </h1>
          <p className={`mt-1 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Shape library for badges and accents. Prefer one or two expressive shapes per screen —
            keep simple circles for dense rating chips if needed.
          </p>
        </div>

        {SHAPE_GROUPS.map((group) => {
          const shapes = SHAPES.filter((s) => s.group === group.id);
          if (!shapes.length) return null;
          return (
            <AppBoard key={group.id} mode="scroll" pad="board" theme={theme}>
              <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {group.label}
              </h2>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                {shapes.map((shape) => (
                  <div
                    key={shape.id}
                    className="flex flex-col items-center gap-2 min-w-0"
                  >
                    <ShapeSurface
                      shape={shape.id}
                      className={`h-12 w-12 text-xs font-bold tabular-nums ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                      title={shape.id}
                      aria-label={shape.label}
                    >
                      24
                    </ShapeSurface>
                    <span
                      className={`truncate max-w-full text-center ${TYPE.labelMicro} ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                      title={shape.id}
                    >
                      {shape.label}
                    </span>
                  </div>
                ))}
              </div>
            </AppBoard>
          );
        })}
      </div>
    </AppPageShell>
  );
}
