import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ANNOTATE_MUTED_PALETTE } from './theme';
import { TYPE } from './typography';

function needsSwatchBorder(color) {
  const c = String(color || '').toLowerCase();
  return c === '#ffffff' || c === '#fff' || c === '#f1f5f9' || c === '#fde68a' || c === '#fca5a5';
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input) {
  if (!input) return null;
  let h = String(input).trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toLowerCase()}`;
}

function hexToRgb(hex) {
  const n = normalizeHex(hex)?.replace('#', '');
  if (!n) return null;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const to = (v) =>
    clamp(Math.round(v), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r, g, b) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
  else if (max === G) h = ((B - R) / d + 2) / 6;
  else h = ((R - G) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  const H = ((h % 360) + 360) % 360;
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  if (S === 0) {
    const v = L * 255;
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hk = H / 360;
  const t = (n) => {
    let x = n;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return {
    r: t(hk + 1 / 3) * 255,
    g: t(hk) * 255,
    b: t(hk - 1 / 3) * 255,
  };
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 210, s: 70, l: 55 };
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Compact spectrum (HSL) color picker with hex paste.
 *
 * @param {object} props
 * @param {string} props.value — current #rrggbb
 * @param {(hex: string) => void} props.onChange
 * @param {boolean} [props.isDarkMode]
 * @param {object} [props.theme]
 * @param {string} [props.ariaLabel]
 * @param {import('react').ReactNode} [props.children] — optional trigger content (e.g. level number)
 * @param {string} [props.triggerClassName] — replaces default circle trigger classes
 * @param {import('react').CSSProperties} [props.triggerStyle] — merged onto trigger (after backgroundColor)
 */
export function SpectrumColorPicker({
  value,
  onChange,
  isDarkMode = false,
  theme,
  ariaLabel = 'Color',
  children,
  triggerClassName,
  triggerStyle,
}) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const squareRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const hex = normalizeHex(value) || '#64748b';
  const [hsl, setHsl] = useState(() => hexToHsl(hex));
  const [hexDraft, setHexDraft] = useState(hex);

  useEffect(() => {
    const next = normalizeHex(value) || '#64748b';
    setHsl(hexToHsl(next));
    setHexDraft(next);
  }, [value]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return undefined;
    }
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = 14.5 * 16; // w-[14.5rem]
      const gap = 8;
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8),
      );
      let top = rect.bottom + gap;
      const panel = panelRef.current;
      const panelH = panel?.offsetHeight || 360;
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

  const commitHsl = (next) => {
    const h = clamp(next.h, 0, 360);
    const s = clamp(next.s, 0, 100);
    const l = clamp(next.l, 0, 100);
    const out = { h, s, l };
    setHsl(out);
    const nextHex = hslToHex(h, s, l);
    setHexDraft(nextHex);
    onChange?.(nextHex);
  };

  const commitHex = (raw) => {
    const next = normalizeHex(raw);
    if (!next) {
      setHexDraft(hex);
      return;
    }
    setHexDraft(next);
    setHsl(hexToHsl(next));
    onChange?.(next);
  };

  const pickFromSquare = (clientX, clientY) => {
    const el = squareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    commitHsl({ h: hsl.h, s: x * 100, l: (1 - y) * 100 });
  };

  const onSquarePointerDown = (event) => {
    event.preventDefault();
    pickFromSquare(event.clientX, event.clientY);
    const move = (e) => pickFromSquare(e.clientX, e.clientY);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const outline = theme?.colorOutline || (isDarkMode ? 'border-slate-600' : 'border-slate-300');
  const surface = isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            id={`${id}-panel`}
            role="dialog"
            aria-label={`${ariaLabel} spectrum picker`}
            className={`fixed z-[80] w-[14.5rem] rounded-2xl border-[1.5px] p-3 shadow-lg ${outline} ${surface}`}
            style={{
              top: panelPos?.top ?? 0,
              left: panelPos?.left ?? 0,
              visibility: panelPos ? 'visible' : 'hidden',
            }}
          >
            <p
              className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Muted presets
            </p>
            <div
              className="mt-1.5 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Muted color presets"
            >
              {ANNOTATE_MUTED_PALETTE.map((color) => {
                const selected = hex.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    className={`edu-control w-6 h-6 rounded-full shrink-0 transition-transform hover:scale-110 ${
                      needsSwatchBorder(color) ? 'border border-slate-400' : ''
                    } ${
                      selected
                        ? `ring-2 ring-offset-2 ${
                            isDarkMode
                              ? 'ring-white ring-offset-slate-900'
                              : 'ring-slate-700 ring-offset-white'
                          }`
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`Use ${color}`}
                    aria-pressed={selected}
                    onClick={() => commitHex(color)}
                  />
                );
              })}
            </div>

            <div
              ref={squareRef}
              className="relative mt-3 h-28 w-full cursor-crosshair rounded-xl overflow-hidden touch-none"
              style={{
                backgroundColor: `hsl(${hsl.h} 100% 50%)`,
                backgroundImage:
                  'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
              }}
              onPointerDown={onSquarePointerDown}
            >
              <span
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  left: `${hsl.s}%`,
                  top: `${100 - hsl.l}%`,
                  backgroundColor: hex,
                }}
              />
            </div>

            <label className="mt-3 block">
              <span
                className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Hue
              </span>
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(hsl.h)}
                onChange={(e) => commitHsl({ ...hsl, h: Number(e.target.value) })}
                className="edu-control mt-1 w-full accent-current"
                style={{
                  background: `linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`,
                }}
                aria-label="Hue"
              />
            </label>

            <label className="mt-3 block">
              <span
                className={`${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Hex
              </span>
              <input
                type="text"
                spellCheck={false}
                className={`edu-control mt-1 w-full px-3 py-2 rounded-xl border text-sm font-mono ${outline} ${
                  isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'
                }`}
                value={hexDraft}
                onChange={(e) => setHexDraft(e.target.value)}
                onBlur={() => commitHex(hexDraft)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitHex(hexDraft);
                  }
                }}
                placeholder="#60a5fa"
                aria-label="Paste hex color"
              />
            </label>
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
          `edu-control w-9 h-9 rounded-full border-[1.5px] shadow-inner ${outline}`
        }
        style={{ backgroundColor: hex, ...triggerStyle }}
        aria-label={`${ariaLabel}: ${hex}. Open spectrum picker`}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      {panel}
    </div>
  );
}
