import { useEffect, useRef, useState } from 'react';
import { PIN_FONTS, normalizePinFont } from '../morningMeeting/pinTextStyle';
import { SlideEmbed } from './SlideEmbed';

/**
 * 16:9 (or 4:3) slide surface. Coordinates are percent of the canvas.
 */
export function SlideCanvas({
  slide,
  theme,
  selectedId = '',
  interactive = false,
  presentMode = false,
  aspect = '16:9',
  onSelect,
  onChangeObject,
  onDoubleClick,
}) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const [override, setOverride] = useState(null);
  const ratio = aspect === '4:3' ? '4 / 3' : '16 / 9';
  const bg = slide?.background?.color || '#ffffff';
  const imageUrl = slide?.background?.imageUrl || '';
  const objects = (slide?.objects || []).map((obj) =>
    override && obj.id === override.id ? { ...obj, ...override.patch } : obj,
  );

  useEffect(() => {
    if (!interactive) return undefined;
    const onMove = (e) => {
      const drag = dragRef.current;
      const box = rootRef.current?.getBoundingClientRect();
      if (!drag || !box) return;
      const dx = ((e.clientX - drag.startX) / box.width) * 100;
      const dy = ((e.clientY - drag.startY) / box.height) * 100;
      const patch =
        drag.mode === 'move'
          ? {
              x: clamp(drag.x + dx, 0, 100 - drag.w),
              y: clamp(drag.y + dy, 0, 100 - drag.h),
            }
          : {
              w: clamp(drag.w + dx, 4, 100 - drag.x),
              h: clamp(drag.h + dy, 4, 100 - drag.y),
            };
      drag.patch = patch;
      setOverride({ id: drag.id, patch });
    };
    const onUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (drag?.patch) onChangeObject?.(drag.id, drag.patch);
      setOverride(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [interactive, onChangeObject]);

  return (
    <div
      ref={rootRef}
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: ratio,
        backgroundColor: bg,
        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        if (e.target === e.currentTarget) onSelect?.('');
      }}
    >
      {objects.map((obj) => (
        <SlideObject
          key={obj.id}
          object={obj}
          theme={theme}
          selected={interactive && selectedId === obj.id}
          interactive={interactive}
          presentMode={presentMode}
          onSelect={() => onSelect?.(obj.id)}
          onDoubleClick={() => onDoubleClick?.(obj)}
          onDragStart={(mode, event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect?.(obj.id);
            dragRef.current = {
              mode,
              id: obj.id,
              startX: event.clientX,
              startY: event.clientY,
              x: obj.x,
              y: obj.y,
              w: obj.w,
              h: obj.h,
            };
          }}
        />
      ))}
    </div>
  );
}

function SlideObject({
  object,
  theme,
  selected,
  interactive,
  presentMode,
  onSelect,
  onDoubleClick,
  onDragStart,
}) {
  const face = PIN_FONTS.find((f) => f.id === normalizePinFont(object.fontId));

  return (
    <div
      className={`absolute ${interactive ? 'cursor-move' : ''} ${
        selected ? 'ring-2 ring-pink-500 ring-offset-1' : ''
      }`}
      style={{
        left: `${object.x}%`,
        top: `${object.y}%`,
        width: `${object.w}%`,
        height: `${object.h}%`,
        transform: object.rotation ? `rotate(${object.rotation}deg)` : undefined,
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        onDragStart('move', e);
      }}
      onDoubleClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      {object.kind === 'text' ? (
        <div
          className="h-full w-full overflow-hidden px-1"
          style={{
            color: object.color || '#0f172a',
            fontSize: `clamp(12px, ${Number(object.fontSize) || 32}px, 12vw)`,
            textAlign: object.align || 'left',
            fontFamily: face?.cssFamily,
            lineHeight: 1.15,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {object.text || ''}
        </div>
      ) : null}
      {object.kind === 'image' ? (
        object.src ? (
          <img
            src={object.src}
            alt=""
            draggable={false}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className={`flex h-full items-center justify-center ${theme.colorSurfaceVariant}`}>
            Image
          </div>
        )
      ) : null}
      {object.kind === 'shape' ? (
        <ShapeVisual object={object} />
      ) : null}
      {object.kind === 'embed' ? (
        <div
          className={`h-full w-full overflow-hidden rounded-xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <SlideEmbed object={object} theme={theme} interactive={presentMode} />
        </div>
      ) : null}
      {selected ? (
        <button
          type="button"
          aria-label="Resize"
          className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm bg-pink-500"
          onPointerDown={(e) => onDragStart('resize', e)}
        />
      ) : null}
    </div>
  );
}

function ShapeVisual({ object }) {
  const fill = object.fill || '#fb7185';
  const stroke = object.stroke || '#9f1239';
  if (object.shape === 'ellipse') {
    return (
      <div
        className="h-full w-full"
        style={{
          backgroundColor: fill,
          border: `2px solid ${stroke}`,
          borderRadius: '999px',
        }}
      />
    );
  }
  if (object.shape === 'line') {
    return (
      <div className="flex h-full w-full items-center">
        <div className="h-0.5 w-full" style={{ backgroundColor: stroke }} />
      </div>
    );
  }
  return (
    <div
      className="h-full w-full"
      style={{ backgroundColor: fill, border: `2px solid ${stroke}` }}
    />
  );
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
