import { CLASSIC_GAMES } from '../config';
import { ArcadeCabinet } from '../classic/ArcadeCabinet';
import { useStudentParts } from '../../../data/access/StudentPartAccess';

/**
 * Classic selection — pick a title on the arcade cabinet CRT.
 */
export function ClassicView({ onOpenGame }) {
  const parts = useStudentParts();
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
