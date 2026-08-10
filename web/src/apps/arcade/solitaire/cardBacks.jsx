/**
 * Solitaire card backs — PLACEHOLDERS until final designs ship.
 *
 * Easy switch to final art:
 * 1. Import assets (png/svg) into this folder or web/src/assets/…
 * 2. Assign each id in CARD_BACK_SRC below (leave ids stable).
 * 3. CardBackArt will prefer CARD_BACK_SRC and skip placeholders.
 * 4. Delete PlaceholderCardBack when all five are wired.
 *
 * Ids (do not rename without a prefs migration): robot, logo, beach, snowman, haunted
 */

// Final art goes here — e.g. `robot: robotPng` after `import robotPng from './backs/robot.png'`
export const CARD_BACK_SRC = {
  robot: null,
  logo: null,
  beach: null,
  snowman: null,
  haunted: null,
};

export const CARD_BACK_OPTIONS = [
  { id: 'robot', label: 'Robot' },
  { id: 'logo', label: 'Logo' },
  { id: 'beach', label: 'Beach' },
  { id: 'snowman', label: 'Snowman' },
  { id: 'haunted', label: 'Haunted' },
];

export const DEFAULT_CARD_BACK = 'logo';

/** Prefer final asset when set; otherwise placeholder pixel SVG. */
export function CardBackArt({ id = DEFAULT_CARD_BACK }) {
  const src = CARD_BACK_SRC[id];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
  return <PlaceholderCardBack id={id} />;
}

/** Brand colors (circle / triangle / square / scribble) as chunky pixels. */
function PixelLogoMark() {
  const C = '#f43f5e'; // rose — circle
  const T = '#f59e0b'; // amber — triangle
  const S = '#10b981'; // emerald — square
  const W = '#0ea5e9'; // sky — scribble
  const bg = '#ffffff';

  // 32×32 mark (2× prior), centered on 40×56 card
  const ox = 4;
  const oy = 12;
  const scale = 2;

  const circle = [
    [2, 0],
    [3, 0],
    [4, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [6, 3],
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [6, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [5, 5],
    [2, 6],
    [3, 6],
    [4, 6],
  ];

  const triangle = [
    [12, 0],
    [11, 1],
    [12, 1],
    [13, 1],
    [10, 2],
    [11, 2],
    [12, 2],
    [13, 2],
    [14, 2],
    [9, 3],
    [10, 3],
    [11, 3],
    [12, 3],
    [13, 3],
    [14, 3],
    [15, 3],
    [9, 4],
    [10, 4],
    [11, 4],
    [12, 4],
    [13, 4],
    [14, 4],
    [15, 4],
    [9, 5],
    [10, 5],
    [11, 5],
    [12, 5],
    [13, 5],
    [14, 5],
    [15, 5],
    [9, 6],
    [10, 6],
    [11, 6],
    [12, 6],
    [13, 6],
    [14, 6],
    [15, 6],
  ];

  const square = [];
  for (let y = 9; y <= 15; y += 1) {
    for (let x = 0; x <= 6; x += 1) square.push([x, y]);
  }

  const scribble = [
    [9, 9],
    [10, 9],
    [11, 10],
    [12, 10],
    [13, 11],
    [14, 11],
    [15, 12],
    [14, 13],
    [13, 14],
    [12, 14],
    [11, 15],
    [10, 15],
    [9, 14],
    [9, 13],
    [10, 12],
    [11, 11],
    [15, 9],
    [15, 15],
  ];

  const px = (cells, fill) =>
    cells.flatMap(([x, y]) => {
      const rects = [];
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          rects.push(
            <rect
              key={`${fill}-${x}-${y}-${dx}-${dy}`}
              x={ox + x * scale + dx}
              y={oy + y * scale + dy}
              width={1}
              height={1}
              fill={fill}
            />,
          );
        }
      }
      return rects;
    });

  return (
    <svg
      viewBox="0 0 40 56"
      className="h-full w-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      <rect width="40" height="56" fill={bg} />
      {px(circle, C)}
      {px(triangle, T)}
      {px(square, S)}
      {px(scribble, W)}
    </svg>
  );
}

function HauntedHouseBack() {
  // Stepped purple sky (pixel gradient, not smooth) — 7×8px bands = 56.
  const skyBands = [
    '#a855f7',
    '#9333ea',
    '#7e22ce',
    '#6b21a8',
    '#581c87',
    '#3730a3',
    '#1e1b4b',
  ];

  return (
    <svg
      viewBox="0 0 40 56"
      className="h-full w-full"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {skyBands.map((fill, i) => (
        <rect key={fill} y={i * 8} width="40" height="8" fill={fill} />
      ))}
      <rect x="26" y="6" width="8" height="8" fill="#e2e8f0" />
      <rect x="8" y="22" width="24" height="26" fill="#334155" />
      <rect x="6" y="20" width="28" height="4" fill="#1e293b" />
      <rect x="18" y="10" width="4" height="10" fill="#1e293b" />
      <rect x="12" y="28" width="5" height="6" fill="#fbbf24" />
      <rect x="23" y="28" width="5" height="6" fill="#fbbf24" />
      <rect x="17" y="38" width="6" height="10" fill="#0f172a" />
      <rect x="4" y="48" width="2" height="2" fill="#86efac" />
      <rect x="34" y="44" width="2" height="2" fill="#86efac" />
    </svg>
  );
}

function PlaceholderCardBack({ id = DEFAULT_CARD_BACK }) {
  switch (id) {
    case 'robot':
      return (
        <svg
          viewBox="0 0 40 56"
          className="h-full w-full"
          shapeRendering="crispEdges"
          aria-hidden
        >
          {/* Lighter backdrop */}
          <rect width="40" height="56" fill="#e2e8f0" />
          <rect x="0" y="0" width="40" height="8" fill="#cbd5e1" />
          <rect x="0" y="48" width="40" height="8" fill="#cbd5e1" />
          <rect x="10" y="14" width="20" height="22" fill="#94a3b8" />
          <rect x="12" y="16" width="16" height="18" fill="#64748b" />
          <rect x="13" y="18" width="5" height="5" fill="#22d3ee" />
          <rect x="22" y="18" width="5" height="5" fill="#22d3ee" />
          <rect x="14" y="19" width="3" height="3" fill="#ecfeff" />
          <rect x="23" y="19" width="3" height="3" fill="#ecfeff" />
          <rect x="15" y="28" width="10" height="3" fill="#0f172a" />
          <rect x="18" y="8" width="4" height="6" fill="#64748b" />
          <rect x="16" y="5" width="8" height="4" fill="#fbbf24" />
          <rect x="6" y="20" width="4" height="10" fill="#94a3b8" />
          <rect x="30" y="20" width="4" height="10" fill="#94a3b8" />
          <rect x="14" y="36" width="4" height="6" fill="#64748b" />
          <rect x="22" y="36" width="4" height="6" fill="#64748b" />
        </svg>
      );
    case 'logo':
      return <PixelLogoMark />;
    case 'beach':
      return (
        <svg
          viewBox="0 0 40 56"
          className="h-full w-full"
          shapeRendering="crispEdges"
          aria-hidden
        >
          <rect width="40" height="28" fill="#38bdf8" />
          <rect y="28" width="40" height="12" fill="#0ea5e9" />
          <rect y="40" width="40" height="16" fill="#fbbf24" />
          <rect x="24" y="6" width="10" height="10" fill="#fde047" />
          <rect x="26" y="8" width="6" height="6" fill="#fef08a" />
          <rect x="4" y="34" width="8" height="2" fill="#fff" />
          <rect x="18" y="36" width="10" height="2" fill="#e0f2fe" />
          <rect x="8" y="44" width="6" height="2" fill="#f59e0b" />
        </svg>
      );
    case 'snowman':
      return (
        <svg
          viewBox="0 0 40 56"
          className="h-full w-full"
          shapeRendering="crispEdges"
          aria-hidden
        >
          {/* Sunny day sky + ground */}
          <rect width="40" height="40" fill="#7dd3fc" />
          <rect y="40" width="40" height="16" fill="#bbf7d0" />
          <rect x="28" y="4" width="8" height="8" fill="#fde047" />
          <rect x="30" y="6" width="4" height="4" fill="#fef08a" />
          {/* rays */}
          <rect x="26" y="7" width="2" height="2" fill="#fde047" />
          <rect x="36" y="7" width="2" height="2" fill="#fde047" />
          <rect x="31" y="2" width="2" height="2" fill="#fde047" />
          <rect x="31" y="12" width="2" height="2" fill="#fde047" />
          {/* snowman */}
          <rect x="12" y="34" width="16" height="12" fill="#f8fafc" />
          <rect x="14" y="22" width="12" height="12" fill="#f1f5f9" />
          <rect x="16" y="14" width="8" height="8" fill="#e2e8f0" />
          <rect x="17" y="16" width="2" height="2" fill="#0f172a" />
          <rect x="21" y="16" width="2" height="2" fill="#0f172a" />
          <rect x="18" y="19" width="4" height="2" fill="#f97316" />
          <rect x="18" y="26" width="2" height="2" fill="#1e293b" />
          <rect x="18" y="30" width="2" height="2" fill="#1e293b" />
          <rect x="18" y="38" width="2" height="2" fill="#1e293b" />
          {/* scarf */}
          <rect x="14" y="21" width="12" height="2" fill="#ef4444" />
          <rect x="24" y="23" width="2" height="4" fill="#ef4444" />
        </svg>
      );
    case 'haunted':
      return <HauntedHouseBack />;
    default:
      return <PlaceholderCardBack id={DEFAULT_CARD_BACK} />;
  }
}
