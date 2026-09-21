import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Rock-stage annotate overlay. Strokes are stored normalized (0–1) so they
 * survive stage resize. Tools: pen | eraser | null (passthrough).
 */
export const RockAnnotateLayer = forwardRef(function RockAnnotateLayer(
  {
    tool = null,
    color = '#0f172a',
    size = 4,
    width,
    height,
    initialStrokes = [],
    seedKey = 'default',
  },
  ref,
) {
  const canvasRef = useRef(null);
  const drawingsRef = useRef([]);
  const currentPathRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastCoordsRef = useRef({ x: 0, y: 0 });
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const sizeBoxRef = useRef({ width: 0, height: 0 });
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;

  const toNorm = (coords) => {
    const w = sizeBoxRef.current.width || 1;
    const h = sizeBoxRef.current.height || 1;
    return { x: coords.x / w, y: coords.y / h };
  };

  const toPx = (p) => ({
    x: p.x * (sizeBoxRef.current.width || 1),
    y: p.y * (sizeBoxRef.current.height || 1),
  });

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paint = (obj) => {
      if (!obj?.points?.length) return;
      const pts = obj.points.map(toPx);
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
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
      redraw();
    },
    getStrokes() {
      return drawingsRef.current.map((s) => ({
        type: s.type || 'pen',
        color: s.color,
        size: s.size,
        points: s.points.map((p) => ({ x: p.x, y: p.y })),
      }));
    },
    setStrokes(strokes) {
      drawingsRef.current = Array.isArray(strokes)
        ? strokes.map((s) => ({
            type: s.type || 'pen',
            color: s.color,
            size: s.size,
            points: (s.points || []).map((p) => ({ x: p.x, y: p.y })),
          }))
        : [];
      redraw();
    },
  }));

  useEffect(() => {
    drawingsRef.current = Array.isArray(initialStrokes)
      ? initialStrokes.map((s) => ({
          type: s.type || 'pen',
          color: s.color,
          size: s.size,
          points: (s.points || []).map((p) => ({ x: p.x, y: p.y })),
        }))
      : [];
    redraw();
    // Seed only when pet identity changes — not on every strokes array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return undefined;

    canvas.width = width;
    canvas.height = height;
    sizeBoxRef.current = { width, height };
    redraw();

    const pointerCoords = (e) => {
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    };

    const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    const distToSegmentSquared = (p, v, w) => {
      const l2 = dist2(v, w);
      if (l2 === 0) return dist2(p, v);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
    };

    const eraseAt = (coordsPx) => {
      const brush = sizeRef.current;
      const eraseRadius = Math.max(12, brush * 2);
      const eraseRadiusSq = eraseRadius * eraseRadius;
      const objects = drawingsRef.current;
      let hitIndex = -1;

      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (!obj.points?.length) continue;
        const pts = obj.points.map(toPx);
        const hitDistSq = eraseRadiusSq + (obj.size / 2) ** 2;
        for (let j = 0; j < pts.length - 1; j++) {
          if (distToSegmentSquared(coordsPx, pts[j], pts[j + 1]) <= hitDistSq) {
            hitIndex = i;
            break;
          }
        }
        if (hitIndex !== -1) break;
      }
      if (hitIndex === -1) return;

      const obj = objects[hitIndex];
      const pts = obj.points.map(toPx);
      let chunk = [];
      const chunks = [];
      const hitDistSq = eraseRadiusSq + (obj.size / 2) ** 2;
      for (let j = 0; j < pts.length - 1; j++) {
        const p1 = pts[j];
        const p2 = pts[j + 1];
        if (distToSegmentSquared(coordsPx, p1, p2) <= hitDistSq) {
          if (chunk.length > 1) chunks.push(chunk);
          chunk = [];
        } else {
          if (chunk.length === 0) chunk.push(obj.points[j]);
          chunk.push(obj.points[j + 1]);
        }
      }
      if (chunk.length > 1) chunks.push(chunk);

      let next = objects.slice(0, hitIndex);
      chunks.forEach((normPts) => next.push({ ...obj, points: normPts }));
      next = next.concat(objects.slice(hitIndex + 1));
      drawingsRef.current = next;
      redraw();
    };

    const onDown = (e) => {
      const activeTool = toolRef.current;
      if (!activeTool) return;
      e.preventDefault();
      e.stopPropagation();
      const coords = pointerCoords(e);
      lastCoordsRef.current = coords;
      isDrawingRef.current = true;

      if (activeTool === 'eraser') {
        eraseAt(coords);
        return;
      }

      currentPathRef.current = {
        type: 'pen',
        color: colorRef.current,
        size: sizeRef.current,
        points: [toNorm(coords)],
      };
      redraw();
    };

    const onMove = (e) => {
      if (!isDrawingRef.current) return;
      const activeTool = toolRef.current;
      if (!activeTool) return;
      e.preventDefault();
      const coords = pointerCoords(e);

      if (activeTool === 'eraser') {
        const dist = Math.sqrt(dist2(lastCoordsRef.current, coords));
        const steps = Math.max(1, Math.floor(dist / 5));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          eraseAt({
            x: lastCoordsRef.current.x + (coords.x - lastCoordsRef.current.x) * t,
            y: lastCoordsRef.current.y + (coords.y - lastCoordsRef.current.y) * t,
          });
        }
        lastCoordsRef.current = coords;
        return;
      }

      if (currentPathRef.current) {
        currentPathRef.current.points.push(toNorm(coords));
        redraw();
      }
    };

    const onUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (toolRef.current === 'eraser') return;
      if (currentPathRef.current?.points?.length > 1) {
        drawingsRef.current = [...drawingsRef.current, currentPathRef.current];
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
  const cursor = tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair';

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
