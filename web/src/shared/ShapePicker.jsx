import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { bestOnColor } from './colorContrast';
import { SHAPE_GROUPS, SHAPES, getShape } from './shapeLibrary';
import { ShapeSurface } from './ShapeSurface';
import { TYPE } from './typography';

/**
 * Popout shape picker — same portal pattern as SpectrumColorPicker.
 *
 * @param {object} props
 * @param {string} props.value — shape id
 * @param {(id: string) => void} props.onChange
 * @param {boolean} props.isDarkMode
 * @param {object} [props.theme]
 * @param {string} [props.fillHex] — panel swatch fill (e.g. grade color)
 * @param {string} [props.triggerFillHex] — trigger shape fill (defaults to fillHex)
 * @param {string} [props.ariaLabel]
 * @param {string} [props.triggerClassName]
 * @param {import('react').CSSProperties} [props.triggerStyle]
 */
export function ShapePicker({
  value,
  onChange,
  isDarkMode,
  theme,
  fillHex = '#94a3b8',
  triggerFillHex,
  ariaLabel = 'Shape',
  triggerClassName,
  triggerStyle,
}) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);

  const shapeId = getShape(value)?.id || 'Cookie9Sided';
  const onFill = bestOnColor(fillHex);
  const triggerFill = triggerFillHex || fillHex;
  const onTrigger = bestOnColor(triggerFill);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return undefined;
    }
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = 16 * 16; // w-64
      const gap = 8;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8),
      );
      let top = rect.bottom + gap;
      const panel = panelRef.current;
      const panelH = panel?.offsetHeight || 320;
      if (top + panelH > window.innerHeight - 8 && rect.top - gap - panelH > 8) {
        top = rect.top - gap - panelH;
      }
      setPanelPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      const t = event.target;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const outline = theme?.colorOutline || (isDarkMode ? 'border-slate-600' : 'border-slate-300');
  const surface = isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            id={`${id}-panel`}
            role="dialog"
            aria-label={`${ariaLabel} shape picker`}
            className={`fixed z-[80] w-64 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border-[1.5px] p-3 shadow-lg ${outline} ${surface}`}
            style={{
              top: panelPos?.top ?? 0,
              left: panelPos?.left ?? 0,
              visibility: panelPos ? 'visible' : 'hidden',
            }}
          >
            <p
              className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Shapes
            </p>
            <div className="mt-2 space-y-3">
              {SHAPE_GROUPS.map((group) => {
                const shapes = SHAPES.filter((s) => s.group === group.id);
                if (!shapes.length) return null;
                return (
                  <div key={group.id}>
                    <p
                      className={`${TYPE.labelMicro} mb-1.5 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {group.label}
                    </p>
                    <div
                      className="grid grid-cols-5 gap-1.5"
                      role="group"
                      aria-label={group.label}
                    >
                      {shapes.map((shape) => {
                        const selected = shape.id === shapeId;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            className={`edu-control flex aspect-square items-center justify-center rounded-lg p-1 transition-transform hover:scale-105 ${
                              selected
                                ? `ring-2 ring-offset-1 ${
                                    isDarkMode
                                      ? 'ring-white ring-offset-slate-900'
                                      : 'ring-slate-700 ring-offset-white'
                                  }`
                                : isDarkMode
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100'
                            }`}
                            title={shape.label}
                            aria-label={shape.label}
                            aria-pressed={selected}
                            onClick={() => {
                              onChange?.(shape.id);
                              setOpen(false);
                            }}
                          >
                            <ShapeSurface
                              shape={shape.id}
                              className="h-7 w-7"
                              style={{
                                backgroundColor: fillHex,
                                color: onFill.hex,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={
          triggerClassName ||
          `edu-control inline-flex h-7 w-7 items-center justify-center rounded-lg ${
            isDarkMode ? 'hover:bg-black/20' : 'hover:bg-black/10'
          }`
        }
        style={triggerStyle}
        aria-label={`${ariaLabel}: ${getShape(shapeId).label}. Open shape picker`}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <ShapeSurface
          shape={shapeId}
          className="h-6 w-6"
          style={{ backgroundColor: triggerFill, color: onTrigger.hex }}
        />
      </button>
      {panel}
    </div>
  );
}
