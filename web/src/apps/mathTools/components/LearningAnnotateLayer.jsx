import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { PRIMARY_SOLID_HEX } from '../../../shared/theme';

const DEFAULT_COLOR = PRIMARY_SOLID_HEX.Red;
const DEFAULT_SIZE = 4;

const sqr = (x) => x * x;
const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
const distToSegmentSquared = (p, v, w) => {
  const l2 = dist2(v, w);
  if (l2 === 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};

function pointerCoords(e, canvas) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  const clientX = touch ? touch.clientX : e.clientX;
  const clientY = touch ? touch.clientY : e.clientY;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: 0, y: 0 };
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function strokeStyleFor(obj) {
  if (obj.type === 'highlight') return `${obj.color}80`;
  return obj.color;
}

function findHitStroke(coords, objects, tol = 12) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj.points?.length) continue;
    const hitTol = tol + obj.size / 2;
    for (let j = 0; j < obj.points.length - 1; j++) {
      if (
        Math.sqrt(distToSegmentSquared(coords, obj.points[j], obj.points[j + 1])) <=
        hitTol
      ) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Desk-sized annotate overlay — pen / highlighter / eraser / move.
 * When `tool` is null, the layer is pointer-transparent so the clock stays interactive.
 */
export const LearningAnnotateLayer = forwardRef(function LearningAnnotateLayer(
  {
    tool = null,
    color = DEFAULT_COLOR,
    size = DEFAULT_SIZE,
    width,
    height,
  },
  ref,
) {
  const canvasRef = useRef(null);
  const drawingsRef = useRef([]);
  const currentPathRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastCoordsRef = useRef({ x: 0, y: 0 });
  const eraserDirtyRef = useRef(false);
  const draggingRef = useRef(null);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paint = (obj) => {
      if (!obj?.points?.length) return;
      ctx.strokeStyle = strokeStyleFor(obj);
      ctx.lineWidth = obj.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(obj.points[i].x, obj.points[i].y);
      }
      ctx.stroke();
    };

    drawingsRef.current.forEach(paint);
    if (currentPathRef.current) paint(currentPathRef.current);
  };

  useImperativeHandle(ref, () => ({
    clearAll() {
      drawingsRef.current = [];
      currentPathRef.current = null;
      isDrawingRef.current = false;
      draggingRef.current = null;
      redraw();
    },
  }));

  const eraseAt = (coords) => {
    const brush = sizeRef.current;
    const eraseRadius = Math.max(12, brush * 2);
    const eraseRadiusSq = eraseRadius * eraseRadius;
    const objects = drawingsRef.current;
    let hitIndex = -1;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (!obj.points?.length) continue;
      const hitDistSq = eraseRadiusSq + (obj.size / 2) ** 2;
      let found = false;
      for (let j = 0; j < obj.points.length - 1; j++) {
        if (
          distToSegmentSquared(coords, obj.points[j], obj.points[j + 1]) <=
          hitDistSq
        ) {
          found = true;
          break;
        }
      }
      if (found) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex === -1) return;

    eraserDirtyRef.current = true;
    const obj = objects[hitIndex];
    let next = objects.slice(0, hitIndex);
    let chunk = [];
    const chunks = [];
    const hitDistSq = eraseRadiusSq + (obj.size / 2) ** 2;

    for (let j = 0; j < obj.points.length - 1; j++) {
      const p1 = obj.points[j];
      const p2 = obj.points[j + 1];
      if (distToSegmentSquared(coords, p1, p2) <= hitDistSq) {
        if (chunk.length > 1) chunks.push(chunk);
        chunk = [];
      } else {
        if (chunk.length === 0) chunk.push(p1);
        chunk.push(p2);
      }
    }
    if (chunk.length > 1) chunks.push(chunk);

    chunks.forEach((pts) => {
      next.push({ ...obj, points: pts });
    });
    next = next.concat(objects.slice(hitIndex + 1));
    drawingsRef.current = next;
    redraw();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return undefined;

    canvas.width = width;
    canvas.height = height;
    redraw();

    const onDown = (e) => {
      const activeTool = toolRef.current;
      if (!activeTool) return;
      e.preventDefault();
      e.stopPropagation();
      const coords = pointerCoords(e, canvas);
      lastCoordsRef.current = coords;
      isDrawingRef.current = true;

      if (activeTool === 'move') {
        const hitIndex = findHitStroke(coords, drawingsRef.current);
        if (hitIndex !== -1) {
          draggingRef.current = {
            index: hitIndex,
            startX: coords.x,
            startY: coords.y,
          };
        } else {
          draggingRef.current = null;
          isDrawingRef.current = false;
        }
        return;
      }

      if (activeTool === 'eraser') {
        eraserDirtyRef.current = false;
        eraseAt(coords);
        return;
      }

      const isHighlight = activeTool === 'highlight';
      const brush = sizeRef.current;
      currentPathRef.current = {
        type: activeTool,
        color: colorRef.current,
        size: isHighlight ? brush * 4 : brush,
        points: [coords],
      };
      redraw();
    };

    const onMove = (e) => {
      if (!isDrawingRef.current) return;
      const activeTool = toolRef.current;
      if (!activeTool) return;
      e.preventDefault();
      const coords = pointerCoords(e, canvas);

      if (activeTool === 'move') {
        const drag = draggingRef.current;
        if (!drag) return;
        const dx = coords.x - drag.startX;
        const dy = coords.y - drag.startY;
        const obj = drawingsRef.current[drag.index];
        if (obj?.points) {
          obj.points.forEach((p) => {
            p.x += dx;
            p.y += dy;
          });
          if (dx !== 0 || dy !== 0) drag.hasMoved = true;
        }
        drag.startX = coords.x;
        drag.startY = coords.y;
        redraw();
        return;
      }

      if (activeTool === 'eraser') {
        const dist = Math.sqrt(dist2(lastCoordsRef.current, coords));
        const steps = Math.max(1, Math.floor(dist / 5));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          eraseAt({
            x:
              lastCoordsRef.current.x +
              (coords.x - lastCoordsRef.current.x) * t,
            y:
              lastCoordsRef.current.y +
              (coords.y - lastCoordsRef.current.y) * t,
          });
        }
        lastCoordsRef.current = coords;
        return;
      }

      if (currentPathRef.current) {
        currentPathRef.current.points.push(coords);
        redraw();
      }
    };

    const onUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      if (toolRef.current === 'move') {
        draggingRef.current = null;
        return;
      }

      if (toolRef.current === 'eraser') {
        eraserDirtyRef.current = false;
        return;
      }

      if (currentPathRef.current?.points?.length > 1) {
        drawingsRef.current = [
          ...drawingsRef.current,
          currentPathRef.current,
        ];
      }
      currentPathRef.current = null;
      redraw();
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [width, height]);

  const active = Boolean(tool);
  const cursor =
    tool === 'move'
      ? 'cursor-move'
      : tool === 'eraser'
        ? 'cursor-cell'
        : 'cursor-crosshair';

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-20 h-full w-full touch-none ${
        active ? cursor : 'pointer-events-none'
      }`}
      aria-hidden={!active}
    />
  );
});
