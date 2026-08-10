/**
 * Pip positions as % within the card face (x from left, y from top).
 * Bottom-half pips are drawn rotated like a real deck — keep vertical
 * rows optically even (flip shifts ink upward, so bottom rows sit lower).
 */
const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [
    [50, 22],
    [50, 84],
  ],
  3: [
    [50, 18],
    [50, 50],
    [50, 86],
  ],
  4: [
    [30, 22],
    [70, 22],
    [30, 84],
    [70, 84],
  ],
  5: [
    [30, 22],
    [70, 22],
    [50, 50],
    [30, 84],
    [70, 84],
  ],
  6: [
    [30, 18],
    [70, 18],
    [30, 50],
    [70, 50],
    [30, 86],
    [70, 86],
  ],
  7: [
    [30, 16],
    [70, 16],
    [50, 34],
    [30, 50],
    [70, 50],
    [30, 86],
    [70, 86],
  ],
  8: [
    [30, 14],
    [70, 14],
    [50, 32],
    [30, 50],
    [70, 50],
    [50, 68],
    [30, 88],
    [70, 88],
  ],
  9: [
    [30, 14],
    [70, 14],
    [30, 34],
    [70, 34],
    [50, 50],
    [30, 68],
    [70, 68],
    [30, 88],
    [70, 88],
  ],
  10: [
    [30, 12],
    [70, 12],
    [50, 24],
    [30, 36],
    [70, 36],
    [30, 66],
    [70, 66],
    [50, 78],
    [30, 90],
    [70, 90],
  ],
};

function CardIndex({ label, symbol, corner, showSuit = false }) {
  const pos =
    corner === 'tl'
      ? 'left-1 top-1'
      : 'right-1 bottom-1 rotate-180';
  return (
    <div
      className={`absolute z-[1] text-left leading-none ${pos}`}
      style={{ fontSize: 'var(--arcade-index-rank)' }}
    >
      <div
        style={{
          fontSize: 'var(--arcade-index-rank)',
          letterSpacing: '-0.04em',
        }}
      >
        {label}
      </div>
      {showSuit ? (
        <div
          style={{ fontSize: 'var(--arcade-index-suit)', marginTop: 2 }}
        >
          {symbol}
        </div>
      ) : null}
    </div>
  );
}

function PipField({ value, symbol, dimmed }) {
  const layout = PIP_LAYOUTS[value];
  if (!layout) return null;

  return (
    <div
      className="absolute inset-[12%_8%_12%_8%]"
      style={{ opacity: dimmed ? 0.35 : 1 }}
    >
      {layout.map(([x, y], i) => {
        const flip = y > 55;
        return (
          <span
            key={`${value}-${i}`}
            className="absolute leading-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              fontSize:
                value >= 9 ? 'var(--arcade-pip-dense)' : 'var(--arcade-pip)',
              // Flipped suit glyphs sit optically high after rotate; nudge down.
              transform: flip
                ? 'translate(-50%, -38%) rotate(180deg)'
                : 'translate(-50%, -50%)',
            }}
          >
            {symbol}
          </span>
        );
      })}
    </div>
  );
}

/** One mirrored half of a court figure (top half); suit tint via `accent`. */
function CourtHalf({ rank, accent, gold, ink, skin }) {
  // Chunky 12×11 pixel portrait — readable at solitaire card size.
  if (rank === 'K') {
    return (
      <g>
        {/* crown */}
        <rect x="3" y="0" width="6" height="2" fill={gold} />
        <rect x="2" y="1" width="1" height="1" fill={gold} />
        <rect x="9" y="1" width="1" height="1" fill={gold} />
        <rect x="4" y="0" width="1" height="1" fill={accent} />
        <rect x="7" y="0" width="1" height="1" fill={accent} />
        {/* hair / beard */}
        <rect x="2" y="2" width="8" height="2" fill={ink} />
        <rect x="1" y="4" width="2" height="4" fill={ink} />
        <rect x="9" y="4" width="2" height="4" fill={ink} />
        {/* face */}
        <rect x="3" y="3" width="6" height="5" fill={skin} />
        <rect x="4" y="5" width="1" height="1" fill={ink} />
        <rect x="7" y="5" width="1" height="1" fill={ink} />
        <rect x="5" y="6" width="2" height="1" fill={ink} />
        {/* beard */}
        <rect x="3" y="7" width="6" height="2" fill={ink} />
        {/* robe */}
        <rect x="2" y="9" width="8" height="2" fill={accent} />
        <rect x="3" y="9" width="2" height="1" fill={gold} />
        <rect x="7" y="9" width="2" height="1" fill={gold} />
        {/* axe hint */}
        <rect x="10" y="2" width="2" height="1" fill={ink} />
        <rect x="11" y="3" width="1" height="4" fill={ink} />
      </g>
    );
  }

  if (rank === 'Q') {
    return (
      <g>
        {/* crown / veil */}
        <rect x="2" y="0" width="8" height="2" fill={gold} />
        <rect x="3" y="0" width="1" height="1" fill={accent} />
        <rect x="6" y="0" width="1" height="1" fill={accent} />
        <rect x="1" y="2" width="10" height="1" fill={ink} />
        {/* hair */}
        <rect x="1" y="3" width="2" height="5" fill={ink} />
        <rect x="9" y="3" width="2" height="5" fill={ink} />
        {/* face */}
        <rect x="3" y="3" width="6" height="5" fill={skin} />
        <rect x="4" y="5" width="1" height="1" fill={ink} />
        <rect x="7" y="5" width="1" height="1" fill={ink} />
        <rect x="5" y="7" width="2" height="1" fill={accent} />
        {/* gown */}
        <rect x="2" y="8" width="8" height="3" fill={accent} />
        <rect x="3" y="8" width="6" height="1" fill={gold} />
        {/* flower */}
        <rect x="9" y="7" width="2" height="2" fill={gold} />
        <rect x="10" y="6" width="1" height="1" fill={accent} />
      </g>
    );
  }

  // Jack
  return (
    <g>
      {/* cap */}
      <rect x="2" y="0" width="8" height="2" fill={accent} />
      <rect x="3" y="1" width="6" height="1" fill={gold} />
      {/* hair */}
      <rect x="2" y="2" width="8" height="1" fill={gold} />
      <rect x="1" y="3" width="2" height="3" fill={gold} />
      <rect x="9" y="3" width="2" height="3" fill={gold} />
      {/* face */}
      <rect x="3" y="3" width="6" height="5" fill={skin} />
      <rect x="4" y="5" width="1" height="1" fill={ink} />
      <rect x="7" y="5" width="1" height="1" fill={ink} />
      <rect x="5" y="7" width="2" height="1" fill={ink} />
      {/* tunic */}
      <rect x="2" y="8" width="8" height="3" fill={accent} />
      <rect x="4" y="8" width="4" height="2" fill={gold} />
      {/* staff */}
      <rect x="11" y="1" width="1" height="9" fill={ink} />
      <rect x="10" y="1" width="3" height="1" fill={ink} />
    </g>
  );
}

/**
 * Double-ended pixel court card art (Jack / Queen / King).
 */
function FaceCourtArt({ rank, color, symbol, dimmed }) {
  const accent = color === 'red' ? '#d62828' : '#1a1a1a';
  const gold = '#e8b923';
  const ink = '#1a1a1a';
  const skin = '#efc39a';

  return (
    <div
      className="pointer-events-none absolute inset-[16%_14%_16%_14%]"
      style={{ opacity: dimmed ? 0.35 : 1 }}
      aria-hidden
    >
      <svg
        viewBox="0 0 12 24"
        className="h-full w-full"
        shapeRendering="crispEdges"
      >
        <rect x="0" y="0" width="12" height="24" fill="#f7f3e8" />
        <CourtHalf rank={rank} accent={accent} gold={gold} ink={ink} skin={skin} />
        <g transform="translate(12,24) rotate(180)">
          <CourtHalf rank={rank} accent={accent} gold={gold} ink={ink} skin={skin} />
        </g>
        {/* center suit pip */}
        <text
          x="6"
          y="13.2"
          textAnchor="middle"
          fontSize="3.2"
          fill={accent}
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {symbol}
        </text>
      </svg>
    </div>
  );
}

import { CardBackArt, DEFAULT_CARD_BACK } from './cardBacks';

/** Single Klondike card (face or back) — pixel chrome via Solitaire.css */
export function SolitaireCard({
  card,
  selected = false,
  onClick,
  onPointerDown,
  style,
  className = '',
  dimmed = false,
  dragSource = false,
  cardBack = DEFAULT_CARD_BACK,
}) {
  if (!card) return null;

  const dragClass = dragSource ? 'arcade-card-drag-source' : '';

  if (!card.faceUp) {
    return (
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`edu-control arcade-card arcade-card-back arcade-card-back-art ${selected ? 'arcade-card-selected' : ''} ${dragClass} ${className}`}
        aria-label="Face-down card"
      >
        <span className="arcade-card-back-inner">
          <CardBackArt id={cardBack} />
        </span>
      </button>
    );
  }

  const colorClass =
    card.color === 'red' ? 'arcade-card-red' : 'arcade-card-black';
  const isPipCard = card.value >= 1 && card.value <= 10;
  const isCourt = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`edu-control arcade-card arcade-card-face ${colorClass} ${selected ? 'arcade-card-selected' : ''} ${dragClass} ${className}`}
      aria-label={`${card.label} of ${card.suit}`}
    >
      <CardIndex
        label={card.label}
        symbol={card.symbol}
        corner="tl"
        showSuit
      />
      <CardIndex
        label={card.label}
        symbol={card.symbol}
        corner="br"
        showSuit
      />

      {isPipCard ? (
        <PipField value={card.value} symbol={card.symbol} dimmed={dimmed} />
      ) : isCourt ? (
        <FaceCourtArt
          rank={card.rank}
          color={card.color}
          symbol={card.symbol}
          dimmed={dimmed}
        />
      ) : null}
    </button>
  );
}

export function EmptySlot({
  onClick,
  label,
  selected = false,
  dropAttrs,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(dropAttrs || {})}
      className={`edu-control arcade-slot flex items-center justify-center ${selected ? 'arcade-card-selected' : ''} ${className}`}
      aria-label={label || 'Empty pile'}
    />
  );
}
