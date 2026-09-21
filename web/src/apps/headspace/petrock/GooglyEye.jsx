/**
 * Draggable googly eye. Position is percent of the rock stage (center of eye).
 */
export function GooglyEye({
  x,
  y,
  size = 14,
  draggable = false,
  onDrag,
  label = 'Eye',
}) {
  function onPointerDown(e) {
    if (!draggable || !onDrag) return;
    e.preventDefault();
    e.stopPropagation();
    const stage = e.currentTarget.parentElement;
    if (!stage) return;
    const pointerId = e.pointerId;
    e.currentTarget.setPointerCapture?.(pointerId);

    const move = (ev) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((ev.clientX - rect.left) / rect.width) * 100;
      const ny = ((ev.clientY - rect.top) / rect.height) * 100;
      onDrag({
        x: Math.max(5, Math.min(95, nx)),
        y: Math.max(5, Math.min(95, ny)),
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-white shadow-sm ${
        draggable ? 'edu-control cursor-grab active:cursor-grabbing touch-none' : 'pointer-events-none'
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        height: `${size}%`,
        minWidth: 28,
        minHeight: 28,
        maxWidth: 56,
        maxHeight: 56,
      }}
    >
      <span
        className="absolute left-1/2 top-[42%] h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
        aria-hidden
      />
    </button>
  );
}
