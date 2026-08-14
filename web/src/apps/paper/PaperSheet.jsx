/**
 * SVG Letter sheet from geometry primitives.
 */
export function PaperSheet({ sheet, className = '', width, height }) {
  if (!sheet) return null;
  return (
    <svg
      viewBox={`0 0 ${sheet.width} ${sheet.height}`}
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Printable paper preview"
    >
      <rect width={sheet.width} height={sheet.height} fill="#fff" />
      {sheet.primitives.map((p, i) => {
        const key = `${p.kind}-${i}`;
        if (p.kind === 'line') {
          return (
            <line
              key={key}
              x1={p.x1}
              y1={p.y1}
              x2={p.x2}
              y2={p.y2}
              stroke={p.stroke}
              strokeWidth={p.width}
              strokeOpacity={p.opacity}
              strokeDasharray={p.dash ? p.dash.join(' ') : undefined}
              strokeLinecap="butt"
            />
          );
        }
        if (p.kind === 'circle') {
          return (
            <circle
              key={key}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={p.stroke}
            />
          );
        }
        if (p.kind === 'rect') {
          return (
            <rect
              key={key}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={p.fill || 'none'}
              stroke={p.stroke === 'none' || !p.stroke ? 'none' : p.stroke}
              strokeWidth={p.width || 0}
            />
          );
        }
        if (p.kind === 'text') {
          return (
            <text
              key={key}
              x={p.x}
              y={p.y}
              fill={p.fill}
              fontSize={p.size}
              textAnchor={p.anchor || 'start'}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {p.text}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}
