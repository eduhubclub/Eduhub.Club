/**
 * Standard toolbar row under PageHeader — tool buttons aligned end.
 */
export function ButtonRow({ children, className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 mb-4 ${className}`.trim()}
      data-button-row
    >
      {children}
    </div>
  );
}
