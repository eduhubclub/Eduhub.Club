import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { RANKS, SUITS } from '../solitaire/solitaireLogic';
import { SolitaireCard } from '../solitaire/SolitaireCard';

function demoCard(suitId, rankId, faceUp = true, copy = 0) {
  const suit = SUITS.find((s) => s.id === suitId);
  const rank = RANKS.find((r) => r.id === rankId);
  return {
    id: `spider-learn-${suitId}-${rankId}-${copy}-${faceUp ? 'up' : 'down'}`,
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
    text: 'Make 8 full runs from King down to Ace in the same suit. Each finished run clears to a box up top!',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-2">
        <StackDemo
          cardBack={cardBack}
          cards={[
            demoCard('spades', 'K'),
            demoCard('spades', 'Q'),
            demoCard('spades', 'J'),
          ]}
          peek={14}
        />
        <Arrow />
        <DemoSlot>
          <span className="text-[14px] text-[#bbf7d0]">1/8</span>
        </DemoSlot>
      </div>
    ),
  },
  {
    title: 'Stack down',
    text: 'Put a smaller card on a bigger one. Any suit can sit on any suit — red on black is fine!',
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
            any suit ok
          </span>
        </div>
      </div>
    ),
  },
  {
    title: 'Move a run',
    text: 'You can only drag a stack if every card is the same suit in a row. Mixed suits? Move one card at a time.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <StackDemo
            cardBack={cardBack}
            cards={[demoCard('spades', '9'), demoCard('spades', '8')]}
            peek={20}
          />
          <span className="text-[7px] text-[#86efac]">same suit ✓</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <StackDemo
            cardBack={cardBack}
            cards={[demoCard('spades', '9', true, 1), demoCard('hearts', '8')]}
            peek={20}
          />
          <span className="text-[7px] text-[#fca5a5]">mixed ✗</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Empty spaces',
    text: 'Any card (or same-suit stack) can fill an empty column. Clear a column to make room!',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-3">
        <DemoSlot />
        <Arrow />
        <DemoCard card={demoCard('diamonds', '5')} cardBack={cardBack} />
      </div>
    ),
  },
  {
    title: 'Deal more cards',
    text: 'Tap the stock to lay out the board. Later, tap it again to drop one card on each column — fill empty columns first.',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-2">
        <DemoCard card={demoCard('spades', 'A', false)} cardBack={cardBack} />
        <Arrow />
        <div className="flex gap-1">
          <DemoCard card={demoCard('clubs', '4')} cardBack={cardBack} />
          <DemoCard card={demoCard('hearts', '9')} cardBack={cardBack} />
          <DemoCard card={demoCard('spades', '2')} cardBack={cardBack} />
        </div>
      </div>
    ),
  },
  {
    title: 'Move & help',
    text: 'Drag cards where they fit. Stuck? Tap Hint. Oops? Tap Undo. 1-suit is the easiest way to start!',
    Illustration: ({ cardBack }) => (
      <div className="flex items-center justify-center gap-2">
        <DemoCard card={demoCard('spades', '6')} cardBack={cardBack} />
        <Arrow />
        <StackDemo
          cardBack={cardBack}
          cards={[demoCard('spades', '7'), demoCard('spades', '6', true, 1)]}
          peek={20}
        />
      </div>
    ),
  },
];

/**
 * Centered, paginated How-to-play guide for Spider — same kid-friendly chrome as Solitaire.
 */
export function SpiderLearnPanel({ onClose, cardBack }) {
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
      aria-describedby="arcade-spider-learn-page-text"
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
        id="arcade-spider-learn-page-text"
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
