import { useEffect, useRef, useState } from 'react';
import { TYPE } from './typography';

const STAGE = 280;
const CIRCLE = Math.round(STAGE * 0.78);
const OUT_SIZE = 320;

/**
 * Circular avatar crop: drag the image under a fixed circle, then apply.
 */
export function AvatarCropStage({
  src,
  theme,
  isDarkMode,
  onApply,
  onPickDifferent,
}) {
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setReady(false);
    setNatural({ w: 0, h: 0 });
    setLoadError(false);

    const img = imgRef.current;
    if (!img || !src) return undefined;

    let cancelled = false;

    const markReady = () => {
      if (cancelled || img.naturalWidth <= 0) return;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setReady(true);
      setOffset({ x: 0, y: 0 });
      setLoadError(false);
    };

    const onError = () => {
      if (cancelled) return;
      setReady(false);
      setLoadError(true);
    };

    // Cached data URLs often finish before React attaches onLoad.
    if (img.complete && img.naturalWidth > 0) {
      markReady();
      return () => {
        cancelled = true;
      };
    }

    img.addEventListener('load', markReady);
    img.addEventListener('error', onError);

    // decode() covers late layout / animated formats
    if (typeof img.decode === 'function') {
      img.decode().then(markReady).catch(() => {
        /* load/error listeners still apply */
      });
    }

    return () => {
      cancelled = true;
      img.removeEventListener('load', markReady);
      img.removeEventListener('error', onError);
    };
  }, [src]);

  const baseScale =
    natural.w > 0 && natural.h > 0
      ? CIRCLE / Math.min(natural.w, natural.h)
      : 1;
  const scale = baseScale * zoom;
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;
  const left = (STAGE - dispW) / 2 + offset.x;
  const top = (STAGE - dispH) / 2 + offset.y;

  const clampCover = (ox, oy, nextZoom = zoom) => {
    if (!natural.w) return { x: ox, y: oy };
    const s = baseScale * nextZoom;
    const w = natural.w * s;
    const h = natural.h * s;
    const cx = STAGE / 2;
    const cy = STAGE / 2;
    const r = CIRCLE / 2;
    const imgLeft = (STAGE - w) / 2 + ox;
    const imgTop = (STAGE - h) / 2 + oy;
    let nx = ox;
    let ny = oy;
    if (imgLeft > cx - r) nx = cx - r - (STAGE - w) / 2;
    if (imgLeft + w < cx + r) nx = cx + r - w - (STAGE - w) / 2;
    if (imgTop > cy - r) ny = cy - r - (STAGE - h) / 2;
    if (imgTop + h < cy + r) ny = cy + r - h - (STAGE - h) / 2;
    return { x: nx, y: ny };
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(
      clampCover(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
      ),
    );
  };

  const onPointerUp = (e) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onZoomChange = (value) => {
    const nextZoom = Number(value);
    setZoom(nextZoom);
    setOffset((prev) => clampCover(prev.x, prev.y, nextZoom));
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    const s = baseScale * zoom;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    const imgLeft = (STAGE - w) / 2 + offset.x;
    const imgTop = (STAGE - h) / 2 + offset.y;
    const cx = STAGE / 2;
    const cy = STAGE / 2;
    const sx = (cx - CIRCLE / 2 - imgLeft) / s;
    const sy = (cy - CIRCLE / 2 - imgTop) / s;
    const sSize = CIRCLE / s;

    const canvas = document.createElement('canvas');
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(OUT_SIZE / 2, OUT_SIZE / 2, OUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT_SIZE, OUT_SIZE);
    onApply(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="space-y-3">
      <p
        className={`${TYPE.bodySm} text-center ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        Drag the photo to frame the face in the circle
      </p>
      <div className="flex justify-center">
        <div
          role="presentation"
          className={`relative touch-none select-none overflow-hidden rounded-2xl ${
            isDarkMode ? 'bg-slate-900' : 'bg-slate-100'
          }`}
          style={{
            width: STAGE,
            height: STAGE,
            cursor: ready ? 'grab' : loadError ? 'default' : 'wait',
          }}
          onPointerDown={ready ? onPointerDown : undefined}
          onPointerMove={ready ? onPointerMove : undefined}
          onPointerUp={ready ? onPointerUp : undefined}
          onPointerCancel={ready ? onPointerUp : undefined}
        >
          <img
            key={src}
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            crossOrigin={
              typeof src === 'string' && /^https?:/i.test(src)
                ? 'anonymous'
                : undefined
            }
            className="pointer-events-none absolute max-w-none"
            style={{
              width: ready ? dispW : undefined,
              height: ready ? dispH : undefined,
              left: ready ? left : 0,
              top: ready ? top : 0,
              opacity: ready ? 1 : 0,
            }}
          />
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white/90"
            style={{
              width: CIRCLE,
              height: CIRCLE,
              left: (STAGE - CIRCLE) / 2,
              top: (STAGE - CIRCLE) / 2,
              boxShadow: isDarkMode
                ? '0 0 0 9999px rgba(15, 23, 42, 0.72)'
                : '0 0 0 9999px rgba(15, 23, 42, 0.45)',
            }}
            aria-hidden
          />
          {!ready && !loadError ? (
            <p
              className={`pointer-events-none absolute inset-0 flex items-center justify-center ${TYPE.bodySm} ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Loading photo…
            </p>
          ) : null}
          {loadError ? (
            <p
              className={`pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center ${TYPE.bodySm} text-rose-500`}
            >
              Couldn’t load that image. Try another file.
            </p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-3 px-1">
        <span
          className={`shrink-0 ${TYPE.labelMd} ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Zoom
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={zoom}
          disabled={!ready}
          onChange={(e) => onZoomChange(e.target.value)}
          className={`edu-control h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:opacity-40 ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
          }`}
          aria-label="Zoom photo"
        />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelLg} ${
            isDarkMode
              ? 'text-slate-300 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={onPickDifferent}
        >
          Choose different
        </button>
        <button
          type="button"
          className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={handleApply}
          disabled={!ready}
        >
          Use this crop
        </button>
      </div>
    </div>
  );
}
