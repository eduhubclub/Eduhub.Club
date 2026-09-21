import { appFabClass } from './layout';

/**
 * Primary shell FAB — opposite the sidebar, primary fill + on-color.
 *
 * @param {object} props
 * @param {boolean} [props.isLeft=true]
 * @param {{ colorPrimary?: string, colorOnPrimary?: string }} props.theme
 * @param {string} props['aria-label']
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function AppFab({
  isLeft = true,
  theme,
  onClick,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const colors = theme
    ? `${theme.colorPrimary || ''} ${theme.colorOnPrimary || ''}`.trim()
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${appFabClass(isLeft)} ${colors} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
