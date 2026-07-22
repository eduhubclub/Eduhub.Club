import { APP_SHELL_VARIANTS } from './layout';

/**
 * Standard wrapper for every mini-app root view.
 *
 * @param {'stage' | 'scroll' | 'page'} variant
 *   - stage — static board tools (games, meters); fill-height, no shell scroll
 *   - scroll — scrolling boards / grid cards with FAB clearance; AppShell edge scrolls
 *   - page — settings, design guide, empty gates; AppShell edge scrolls
 */
export function AppPageShell({ variant = 'scroll', className = '', children, ...props }) {
  return (
    <div className={`${APP_SHELL_VARIANTS[variant]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
