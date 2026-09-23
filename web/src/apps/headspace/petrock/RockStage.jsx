import { useEffect, useRef, useState } from 'react';
import { rockById } from './rockOptions';
import { GooglyEye } from './GooglyEye';
import { RockAnnotateLayer } from './RockAnnotateLayer';

/**
 * Rock portrait: photo + googly eyes + optional ink overlay.
 */
export function RockStage({
  rockId,
  eyes = [],
  strokes = [],
  seedKey = 'rock',
  drawTool = null,
  drawColor = '#0f172a',
  eyesEditable = false,
  onEyesChange,
  annotateRef,
  className = '',
}) {
  const wrapRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const rock = rockById(rockId);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({
        width: Math.max(1, Math.round(r.width)),
        height: Math.max(1, Math.round(r.height)),
      });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  function updateEye(index, next) {
    if (!onEyesChange) return;
    const list = eyes.length
      ? eyes.map((e) => ({ ...e }))
      : [
          { x: 38, y: 42 },
          { x: 58, y: 42 },
        ];
    while (list.length < 2) list.push({ x: 50, y: 45 });
    list[index] = next;
    onEyesChange(list.slice(0, 2));
  }

  const eyeList =
    eyes.length >= 2
      ? eyes
      : [
          { x: 38, y: 42 },
          { x: 58, y: 42 },
        ];

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto aspect-square w-full max-h-full max-w-full overflow-hidden rounded-2xl bg-black ${className}`.trim()}
    >
      <img
        src={rock.src}
        alt={rock.label}
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      {eyeList.map((eye, i) => (
        <GooglyEye
          key={i}
          x={eye.x}
          y={eye.y}
          draggable={eyesEditable}
          onDrag={(pos) => updateEye(i, pos)}
          label={`Googly eye ${i + 1}`}
        />
      ))}
      <RockAnnotateLayer
        ref={annotateRef}
        tool={drawTool}
        color={drawColor}
        width={box.width}
        height={box.height}
        initialStrokes={strokes}
        seedKey={seedKey}
      />
    </div>
  );
}
