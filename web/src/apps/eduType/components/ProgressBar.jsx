export function ProgressBar({ value, theme, label }) {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  return (
    <div className="w-full" aria-label={label || 'Progress'}>
      <div
        className={`h-2.5 w-full overflow-hidden rounded-full ${theme.colorSurfaceVariant || 'bg-slate-200'}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${theme.colorPrimary}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
