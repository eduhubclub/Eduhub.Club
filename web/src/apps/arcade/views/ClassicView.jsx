import { CLASSIC_GAMES } from '../config';
import { ArcadeCabinet } from '../classic/ArcadeCabinet';

/**
 * Classic selection — pick a title on the arcade cabinet CRT.
 */
export function ClassicView({ onOpenGame }) {
  return (
    <ArcadeCabinet
      title="CLASSIC"
      subtitle="Insert coin · pick a cabinet"
      deck={
        <p className="arcade-cab-hint w-full">
          Early arcade favorites · more games coming soon
        </p>
      }
    >
      <div className="arcade-cab-game-grid">
        {CLASSIC_GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onOpenGame?.(game.tab)}
              className="edu-control arcade-cab-btn arcade-cab-game-card"
            >
              <span className="arcade-cab-game-icon">
                <Icon size={22} strokeWidth={2.5} />
              </span>
              <span className="text-[10px]">{game.name}</span>
              <span className="arcade-cab-game-blurb">{game.blurb}</span>
            </button>
          );
        })}
      </div>
    </ArcadeCabinet>
  );
}
