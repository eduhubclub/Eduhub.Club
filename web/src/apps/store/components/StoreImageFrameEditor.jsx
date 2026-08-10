import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X, ZoomIn, ZoomOut } from 'lucide-react';
import { TYPE } from '../../../shared/typography';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;
const EXPORT_W = 960;
const EXPORT_H = 540; // 16:9

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function loadImageForCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isData = String(src).startsWith('data:');
    const isLocal =
      String(src).startsWith('/') ||
      (typeof window !== 'undefined' &&
        String(src).startsWith(window.location.origin));
    if (!isData && !isLocal) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Pan / zoom framing for a store item photo (16:9 crop).
 * Apply bakes the visible frame into a JPEG data URL.
 */
export function StoreImageFrameEditor({
  src,
  theme,
  isDarkMode,
  onApply,
  onCancel,
}) {
  const viewportRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError('');
    setNatural({ w: 0, h: 0 });
  }, [src]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setViewport({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = (() => {
    if (!viewport.w || !natural.w || !natural.h) {
      return { dw: 0, dh: 0, ox: 0, oy: 0 };
    }
    const cover = Math.max(viewport.w / natural.w, viewport.h / natural.h);
    const scale = cover * zoom;
    const dw = natural.w * scale;
    const dh = natural.h * scale;
    const ox = (viewport.w - dw) / 2 + pan.x;
    const oy = (viewport.h - dh) / 2 + pan.y;
    return { dw, dh, ox, oy, cover, scale };
  })();

  const clampPan = (nextPan, nextZoom = zoom) => {
    if (!viewport.w || !natural.w) return nextPan;
    const cover = Math.max(viewport.w / natural.w, viewport.h / natural.h);
    const dw = natural.w * cover * nextZoom;
    const dh = natural.h * cover * nextZoom;
    const maxX = Math.max(0, (dw - viewport.w) / 2);
    const maxY = Math.max(0, (dh - viewport.h) / 2);
    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  };

  const changeZoom = (delta) => {
    setZoom((z) => {
      const next = clamp(
        Math.round((z + delta) / ZOOM_STEP) * ZOOM_STEP,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      setPan((p) => clampPan(p, next));
      return Number(next.toFixed(2));
    });
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setPan(clampPan({ x: drag.panX + dx, y: drag.panY + dy }));
  };

  const onPointerUp = (e) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const apply = async () => {
    setError('');
    if (!viewport.w || !natural.w) return;

    const cover = Math.max(viewport.w / natural.w, viewport.h / natural.h);
    const scale = cover * zoom;
    const ox = (viewport.w - natural.w * scale) / 2 + pan.x;
    const oy = (viewport.h - natural.h * scale) / 2 + pan.y;

    const sx = -ox / scale;
    const sy = -oy / scale;
    const sw = viewport.w / scale;
    const sh = viewport.h / scale;

    try {
      const img = await loadImageForCanvas(src);
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_W;
      canvas.height = EXPORT_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, EXPORT_W, EXPORT_H);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onApply(dataUrl);
    } catch {
      setError(
        'This linked image can’t be reframed (site blocks editing). Upload the photo instead.',
      );
    }
  };

  return (
    <div className="space-y-0">
      <div
        ref={viewportRef}
        className={`relative aspect-[16/9] cursor-grab touch-none overflow-hidden active:cursor-grabbing ${
          isDarkMode ? 'bg-slate-900' : 'bg-slate-200'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => {
          e.preventDefault();
          changeZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        }}
      >
        {/* Hidden loader for natural size + CORS attempt */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            width: layout.dw || undefined,
            height: layout.dh || undefined,
            left: layout.ox,
            top: layout.oy,
            opacity: natural.w ? 1 : 0,
          }}
          draggable={false}
          onLoad={(e) => {
            setNatural({
              w: e.currentTarget.naturalWidth,
              h: e.currentTarget.naturalHeight,
            });
          }}
          onError={() =>
            setError('Couldn’t load image for editing. Try Upload instead.')
          }
        />
        {!natural.w ? (
          <p
            className={`absolute inset-0 flex items-center justify-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
          >
            Loading…
          </p>
        ) : null}
      </div>
      <div className="flex gap-2 p-2">
        <button
          type="button"
          className={`edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
          onClick={() => changeZoom(-ZOOM_STEP)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut size={16} />
          Out
        </button>
        <button
          type="button"
          className={`edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
          onClick={() => changeZoom(ZOOM_STEP)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn size={16} />
          In
        </button>
        <button
          type="button"
          className={`edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorSurfaceVariant} ${theme.colorOnSurface}`}
          onClick={onCancel}
        >
          <X size={16} />
          Cancel
        </button>
        <button
          type="button"
          className={`edu-control inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={apply}
        >
          <Check size={16} />
          Apply
        </button>
      </div>
      <p className={`px-2 pb-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        Drag to reposition · zoom in/out · Apply saves the frame
      </p>
      {error ? (
        <p className={`px-2 pb-2 ${TYPE.bodySm} text-rose-500`}>{error}</p>
      ) : null}
    </div>
  );
}

export function StoreImageEditButton({ theme, onClick, label = 'Edit framing' }) {
  return (
    <button
      type="button"
      className={`edu-control absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${theme.colorSurface} ${theme.colorOnSurface}`}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Pencil size={14} strokeWidth={2.5} />
    </button>
  );
}
