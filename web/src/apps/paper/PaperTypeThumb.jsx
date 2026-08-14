import { INK } from '../../data/paper/paperModel';

const W = 34;
const H = 44;

function lines(color, ys, width = 0.9, x1 = 1, x2 = W - 1) {
  return ys.map((y) => (
    <line
      key={`h-${y}`}
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke={color}
      strokeWidth={width}
    />
  ));
}

function marks(type, c) {
  switch (type) {
    case 'lined':
      return (
        <>
          <line x1="4" y1="0" x2="4" y2={H} stroke={c.margin} strokeWidth="1.2" />
          <line
            x1={W - 4}
            y1="0"
            x2={W - 4}
            y2={H}
            stroke={c.margin}
            strokeWidth="1.2"
            opacity="0.5"
          />
          {lines(c.rule, [10, 16, 22, 28, 34, 40])}
        </>
      );
    case 'primary':
      return (
        <>
          {[6, 22].map((y0) => (
            <g key={y0}>
              <line x1="1" y1={y0} x2={W - 1} y2={y0} stroke={c.margin} strokeWidth="0.9" />
              <line
                x1="1"
                y1={y0 + 6}
                x2={W - 1}
                y2={y0 + 6}
                stroke={c.mid}
                strokeWidth="0.8"
                strokeDasharray="1.6 1.4"
              />
              <line x1="1" y1={y0 + 12} x2={W - 1} y2={y0 + 12} stroke={c.rule} strokeWidth="0.9" />
            </g>
          ))}
        </>
      );
    case 'handwriting':
      return (
        <>
          {[4, 24].map((y0) => (
            <g key={y0}>
              <rect
                x="2"
                y={y0}
                width={W - 4}
                height="14"
                fill="none"
                stroke={c.mono}
                strokeWidth="0.9"
              />
              <line x1="2" y1={y0 + 7} x2={W - 2} y2={y0 + 7} stroke={c.mid} strokeWidth="0.7" strokeDasharray="1.4 1.2" />
            </g>
          ))}
        </>
      );
    case 'boxes':
      return [4, 16, 28].flatMap((y) =>
        [3, 13, 23].map((x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="8"
            height="8"
            fill="none"
            stroke={c.mono}
            strokeWidth="0.8"
          />
        )),
      );
    case 'dots':
      return [6, 14, 22, 30, 38].flatMap((y) =>
        [6, 14, 22, 30].map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill={c.mono} />
        )),
      );
    case 'grid':
      return (
        <>
          {[6, 14, 22, 30].map((x) => (
            <line key={`v${x}`} x1={x} y1="3" x2={x} y2={H - 3} stroke={c.mono} strokeWidth="0.7" />
          ))}
          {lines(c.mono, [8, 16, 24, 32, 40], 0.7, 3, W - 3)}
        </>
      );
    case 'graph':
      return (
        <>
          {[5, 11, 17, 23, 29].map((x) => (
            <line
              key={`v${x}`}
              x1={x}
              y1="3"
              x2={x}
              y2={H - 3}
              stroke={c.mono}
              strokeWidth={x === 17 ? 1.5 : x === 5 || x === 29 ? 1.0 : 0.55}
            />
          ))}
          {[8, 14, 20, 26, 32, 38].map((y) => (
            <line
              key={`h${y}`}
              x1="3"
              y1={y}
              x2={W - 3}
              y2={y}
              stroke={c.mono}
              strokeWidth={y === 20 ? 1.5 : y === 8 || y === 32 ? 1.0 : 0.55}
            />
          ))}
        </>
      );
    case 'isometric': {
      const left = 4;
      const right = 30;
      const top = 6;
      const bottom = 40;
      return (
        <>
          <line x1={left} y1={top} x2={right} y2={top} stroke={c.mono} strokeWidth="0.7" />
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={c.mono} strokeWidth="0.7" />
          {[4, 10, 16, 22, 28].map((x) => (
            <line
              key={`iv${x}`}
              x1={x}
              y1={top}
              x2={x}
              y2={bottom}
              stroke={c.mono}
              strokeWidth="0.65"
            />
          ))}
          <line x1={left} y1="14" x2={right} y2="28" stroke={c.mono} strokeWidth="0.65" />
          <line x1={left} y1="22" x2={right} y2="36" stroke={c.mono} strokeWidth="0.65" />
          <line x1={left} y1="30" x2={22} y2={bottom} stroke={c.mono} strokeWidth="0.65" />
          <line x1={left} y1="28" x2={right} y2="14" stroke={c.mono} strokeWidth="0.65" />
          <line x1={left} y1="36" x2={right} y2="22" stroke={c.mono} strokeWidth="0.65" />
          <line x1={12} y1={top} x2={right} y2="20" stroke={c.mono} strokeWidth="0.65" />
        </>
      );
    }
    case 'hex': {
      const hex = (cx, cy, r) => {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 180) * (60 * i - 30);
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
        return (
          <polygon
            key={`${cx}-${cy}`}
            points={pts}
            fill="none"
            stroke={c.mono}
            strokeWidth="0.75"
          />
        );
      };
      return [hex(11, 14, 7), hex(23, 14, 7), hex(17, 24.5, 7), hex(11, 35, 7), hex(23, 35, 7)];
    }
    case 'story':
      return (
        <>
          <rect x="4" y="3" width={W - 8} height="14" fill="none" stroke={c.rule} strokeWidth="1" />
          <line x1="4" y1="22" x2="4" y2={H - 2} stroke={c.margin} strokeWidth="1.1" />
          <line
            x1={W - 4}
            y1="22"
            x2={W - 4}
            y2={H - 2}
            stroke={c.margin}
            strokeWidth="1.1"
            opacity="0.5"
          />
          {lines(c.rule, [22, 28, 34, 40], 0.85, 4, W - 4)}
        </>
      );
    case 'cornell':
      return (
        <>
          <line x1="12" y1="3" x2="12" y2="32" stroke={c.mono} strokeWidth="1" />
          <line x1="2" y1="32" x2={W - 2} y2="32" stroke={c.mono} strokeWidth="1" />
          {lines(c.rule, [10, 16, 22, 28], 0.75, 12, W - 2)}
        </>
      );
    case 'numberLine':
      return [12, 26, 38].map((y) => (
        <g key={y}>
          <line x1="3" y1={y} x2={W - 3} y2={y} stroke={c.mono} strokeWidth="0.9" />
          {[6, 12, 18, 24, 30].map((x) => (
            <line
              key={x}
              x1={x}
              y1={y - (x % 12 === 6 ? 3 : 1.6)}
              x2={x}
              y2={y + (x % 12 === 6 ? 3 : 1.6)}
              stroke={c.mono}
              strokeWidth="0.8"
            />
          ))}
        </g>
      ));
    case 'music':
      return [8, 24].flatMap((y0) =>
        [0, 1, 2, 3, 4].map((i) => (
          <line
            key={`${y0}-${i}`}
            x1="2"
            y1={y0 + i * 2.4}
            x2={W - 2}
            y2={y0 + i * 2.4}
            stroke={c.mono}
            strokeWidth="0.75"
          />
        )),
      );
    case 'calendar': {
      const cols = 7;
      const rows = 5;
      const x0 = 3;
      const y0 = 10;
      const cw = (W - 6) / cols;
      const ch = (H - 14) / rows;
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <text
              key={`d${i}`}
              x={x0 + (i + 0.5) * cw}
              y={8}
              fill={c.mono}
              fontSize="3.2"
              textAnchor="middle"
            >
              {'SMTWTFS'[i]}
            </text>
          ))}
          {Array.from({ length: rows * cols }, (_, i) => {
            const cIdx = i % cols;
            const rIdx = Math.floor(i / cols);
            return (
              <rect
                key={`c${i}`}
                x={x0 + cIdx * cw}
                y={y0 + rIdx * ch}
                width={cw}
                height={ch}
                fill="none"
                stroke={c.mono}
                strokeWidth="0.55"
              />
            );
          })}
        </>
      );
    }
    case 'blank':
    default:
      return null;
  }
}

/**
 * Letter-ratio thumbnail for the paper-type menu.
 */
export function PaperTypeThumb({ type, selected = false, isDarkMode = false, className = '' }) {
  const rim = selected
    ? isDarkMode
      ? 'ring-2 ring-offset-1 ring-sky-400 ring-offset-slate-900'
      : 'ring-2 ring-offset-1 ring-slate-700 ring-offset-white'
    : isDarkMode
      ? 'border border-slate-500'
      : 'border border-slate-300';
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-9 w-7 shrink-0 rounded-[2px] bg-white ${rim} ${className}`}
      aria-hidden
    >
      <rect width={W} height={H} fill="#fff" />
      {marks(type, INK.medium)}
    </svg>
  );
}
