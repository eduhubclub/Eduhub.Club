/** Default phone → tablet → desktop card columns. */
export const CONTENT_CARD_GRID_COLS = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

/**
 * Responsive grid for content-sized cards (`AppBoard mode="grid"` / `APP_GRID_CARD`).
 *
 * @param {object} props
 * @param {string} [props.columns] — Tailwind grid-cols recipe
 * @param {string} [props.gap='gap-3']
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function ContentCardGrid({
  columns = CONTENT_CARD_GRID_COLS,
  gap = 'gap-3',
  className = '',
  children,
  ...props
}) {
  return (
    <div className={`grid ${columns} ${gap} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
