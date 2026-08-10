import { PLATFORMER_GAMES } from '../config';
import '../solitaire/Solitaire.css';

/**
 * Platformers selection board — pixel cabinets for jump-and-run titles.
 */
export function PlatformersView({ isDarkMode, onOpenGame }) {
  const felt = isDarkMode ? 'arcade-felt-dark' : 'arcade-felt';

  return (
    <div
      className={`arcade-pixel flex h-full min-h-0 flex-col overflow-hidden rounded-2xl ${felt}`}
    >
      <div className="arcade-panel mx-3 mt-3 px-4 py-3 sm:mx-4">
        <h1 className="text-[12px] leading-relaxed text-[#f7f3e8]">
          Platformers
        </h1>
        <p className="mt-2 text-[8px] leading-relaxed text-[#bbf7d0]">
          Run, jump, and outlast the blast. More cabinets coming soon.
        </p>
      </div>

      <div className="flex flex-1 flex-wrap content-start gap-4 overflow-auto p-4 sm:p-6">
        {PLATFORMER_GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onOpenGame?.(game.tab)}
              className="edu-control arcade-btn arcade-btn-primary flex w-[200px] flex-col items-start gap-3 p-4 text-left"
            >
              <span className="flex h-12 w-12 items-center justify-center border-3 border-[#1a1a1a] bg-[#0a6b3c] text-[#f7f3e8]">
                <Icon size={22} strokeWidth={2.5} />
              </span>
              <span className="text-[11px]">{game.name}</span>
              <span className="text-[8px] leading-relaxed text-[#422006]">
                {game.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
