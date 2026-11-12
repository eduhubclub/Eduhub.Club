import { bestOnColor } from '../../../shared/colorContrast';
import { TYPE } from '../../../shared/typography';

/** Saturated fills for intro / body / conclusion blocks inside a picker card. */
const SEGMENT = {
  intro: '#0284C7',
  body: '#EA580C',
  conclusion: '#7C3AED',
};

/**
 * Mini essay diagram stacked like paragraphs: intro, N body bars, conclusion.
 */
export function EssayShapeViz({ bodyCount = 1, className = '' }) {
  const n = Math.max(1, Number(bodyCount) || 1);
  const bodies = Array.from({ length: n }, (_, i) => i);

  return (
    <div
      className={`flex w-full flex-col gap-1 ${className}`}
      aria-hidden
    >
      <Segment
        height="h-5"
        fill={SEGMENT.intro}
        label="I"
        title="Introduction"
      />
      {bodies.map((i) => (
        <Segment
          key={i}
          height="h-7"
          fill={SEGMENT.body}
          label={String(i + 1)}
          title={`Body ${i + 1}`}
        />
      ))}
      <Segment
        height="h-5"
        fill={SEGMENT.conclusion}
        label="C"
        title="Conclusion"
      />
    </div>
  );
}

function Segment({ height, fill, label, title }) {
  const on = bestOnColor(fill);
  return (
    <div
      title={title}
      className={`flex w-full items-center justify-center rounded-md ${height} ${TYPE.labelMicro}`}
      style={{ backgroundColor: fill, color: on.hex }}
    >
      {label}
    </div>
  );
}
