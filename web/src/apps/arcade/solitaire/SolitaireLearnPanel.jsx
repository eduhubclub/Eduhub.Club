import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SUITS, RANKS } from './solitaireLogic';
import { SolitaireCard } from './SolitaireCard';

function demoCard(suitId, rankId, faceUp = true) {
  const suit = SUITS.find((s) => s.id === suitId);
  const rank = RANKS.find((r) => r.id === rankId);
  return {
    id: `learn-${suitId}-${rankId}-${faceUp ? 'up' : 'down'}`,
    suit: suit.id,
    symbol: suit.symbol,
    color: suit.color,
    rank: rank.id,
    label: rank.label,
    value: rank.value,
    faceUp,
  };
}

function DemoSlot({ children = null }) {
  return (
    <div
      className="arcade-slot pointer-events-none relative flex shrink-0 items-center justify-center"
      aria-hidden
    >
      {children}
    </div>
  );
}

function DemoCard({ card, cardBack, className = '', style }) {
  return (
    <div className={`pointer-events-none ${className}`} style={style} aria-hidden>
      <SolitaireCard card={card} cardBack={cardBack} />
    </div>
  );
}

function StackDemo({ cards, cardBack, peek = 18 }) {
  return (
    <div
      className="relative"
      style={{
        width: 'var(--arcade-card-w)',
        height: `calc(var(--arcade-card-h) + ${(cards.length - 1) * peek}px)`,
      }}
    >
      {cards.map((card, i) => (
        <DemoCard
          key={card.id}
          card={card}
          cardBack={cardBack}
          className="absolute left-0"
          style={{ top: i * peek }}
        />
      ))}
    </div>
  );
}

function Arrow() {
  return (
    <span className="px-1 text-[14px] leading-none text-[#fbbf24]" aria-hidden>
      →
    </span>
  );
}

const PAGES = [
  {
    title: 'The goal',
    text: 'Fill the 4 boxes up top. Start with an Ace, then 2, 3… all the way to King. Keep the same suit together!',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-2">
        <DemoSlot>
          <span className="text-[18px] text-[#bbf7d0]">A</span>
        </DemoSlot>
        <Arrow />
        <DemoCard card={demoCard('hearts', 'A')} cardBack={cardBack} />
        <Arrow />
        <StackDemo
          cardBack={cardBack}
          cards={[
            demoCard('hearts', 'A'),
            demoCard('hearts', '2'),
            demoCard('hearts', '3'),
          ]}
          peek={14}
        />
      </div>
    ),
  },
  {
    title: 'Stack in the middle',
    text: 'Put a smaller card on a bigger one. Red goes on black. Black goes on red.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-4">
        <StackDemo
          cardBack={cardBack}
          cards={[demoCard('spades', '8'), demoCard('hearts', '7')]}
          peek={22}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[16px] text-[#86efac]" aria-hidden>
            ✓
          </span>
          <span className="max-w-[5.5rem] text-center text-[7px] leading-snug text-[#bbf7d0]">
            red on black
          </span>
        </div>
      </div>
    ),
  },
  {
    title: 'Empty spaces',
    text: 'Only a King can sit in an empty column. No King? Leave it empty for now.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-3">
        <DemoSlot />
        <Arrow />
        <DemoCard card={demoCard('clubs', 'K')} cardBack={cardBack} />
      </div>
    ),
  },
  {
    title: 'Get new cards',
    text: 'Tap the deck on the left. New cards flip over for you to use. When the deck is empty, tap again to recycle.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-3">
        <DemoCard card={demoCard('spades', 'A', false)} cardBack={cardBack} />
        <Arrow />
        <DemoCard card={demoCard('diamonds', '5')} cardBack={cardBack} />
      </div>
    ),
  },
  {
    title: 'Move & help',
    text: 'Drag a card (or a stack) where it fits. Stuck? Tap Hint. Made a mistake? Tap Undo.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-2">
        <DemoCard card={demoCard('diamonds', '6')} cardBack={cardBack} />
        <Arrow />
        <StackDemo
          cardBack={cardBack}
          cards={[demoCard('clubs', '7'), demoCard('diamonds', '6')]}
          peek={20}
        />
      </div>
    ),
  },
];

/**
 * Centered, paginated How-to-play guide for young players.
 * Pages change only via Back / Next (dots are indicators, not a carousel).
 */
export function SolitaireLearnPanel({ onClose, cardBack }) {
  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isFirst = page === 0;
  const isLast = page === PAGES.length - 1;
  const Illustration = current.Illustration;
  const pageLabel = `Page ${page + 1} of ${PAGES.length}`;

  return (
    <div
      className="arcade-panel arcade-learn-panel absolute left-1/2 top-1/2 z-40 flex w-[min(100%-1.5rem,26rem)] max-h-[min(88%,34rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4"
      role="dialog"
      aria-label="How to play"
      aria-describedby="arcade-learn-page-text"
    >
      <div className="relative mb-3 min-h-10 shrink-0">
        <p className="pr-12 pt-2 text-center text-[12px] leading-none text-[#f7f3e8] sm:text-[13px]">
          How to play
        </p>
        <button
          type="button"
          className="edu-control arcade-btn absolute right-0 top-0 inline-flex items-center justify-center p-2"
          onClick={onClose}
          title="Close"
          aria-label="Close how to play"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
      <p
        className="mb-4 shrink-0 text-center text-[10px] leading-snug text-[#fbbf24] sm:text-[11px]"
        aria-live="polite"
      >
        {current.title}
      </p>

      <div
        className="arcade-learn-demo mb-3 flex min-h-[7.5rem] shrink-0 items-center justify-center rounded-sm border-2 border-[#064a29] bg-[#085530]/px-2 py-3"
        aria-hidden
      >
        <Illustration cardBack={cardBack} />
      </div>

      <p
        id="arcade-learn-page-text"
        className="mb-4 min-h-[4.5rem] flex-1 overflow-auto text-center text-[9px] leading-relaxed text-[#bbf7d0] sm:text-[10px]"
        aria-live="polite"
      >
        {current.text}
      </p>

      <div
        className="mb-3 flex shrink-0 items-center justify-center gap-2"
        aria-hidden
      >
        {PAGES.map((p, i) => (
          <span
            key={p.title}
            className={`h-2.5 w-2.5 border-2 border-[#1a1a1a] ${
              i === page ? 'bg-[#fbbf24]' : 'bg-[#bbf7d0]/opacity-50'
            }`}
          />
        ))}
      </div>
      <span className="sr-only">{pageLabel}</span>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          className="edu-control arcade-btn inline-flex items-center gap-1"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={isFirst}
          aria-label="Back"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            className="edu-control arcade-btn arcade-btn-primary inline-flex items-center gap-1"
            onClick={onClose}
            aria-label="Got it"
          >
            Got it!
          </button>
        ) : (
          <button
            type="button"
            className="edu-control arcade-btn arcade-btn-primary inline-flex items-center gap-1"
            onClick={() => setPage((p) => Math.min(PAGES.length - 1, p + 1))}
            aria-label="Next"
          >
            Next
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
