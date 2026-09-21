import { NUMBER_GAMES } from '../config';
import { ArcadeCabinet } from '../classic/ArcadeCabinet';
import { useStudentParts } from '../../../data/access/StudentPartAccess';

/**
 * Number Games selection — pick a math title on the arcade cabinet CRT.
 */
export function NumberGamesView({ onOpenGame }) {
  const parts = useStudentParts();
  return (
    <ArcadeCabinet
      title="NUMBER GAMES"
      subtitle="Insert coin · pick a cabinet"
      deck={
        <p className="arcade-cab-hint w-full">
          Swipe, sum, and solve · more games coming soon
        </p>
      }
    >
      <div className="arcade-cab-game-grid">
        {NUMBER_GAMES.map((game) => {
          const Icon = game.icon;
          const closed = parts.isClosed('arcade', game.tab);
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => (closed ? parts.explain(game.name) : onOpenGame?.(game.tab))}
              className="edu-control arcade-cab-btn arcade-cab-game-card"
            >
              <span className="arcade-cab-game-icon">
                <Icon size={22} strokeWidth={2.5} />
              </span>
              <span className="text-[10px]">{game.name}</span>
              <span className="arcade-cab-game-blurb">
                {closed ? 'Closed' : game.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </ArcadeCabinet>
  );
}
