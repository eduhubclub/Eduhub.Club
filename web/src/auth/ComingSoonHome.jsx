import { useEffect } from 'react';
import { StaffDoor } from './StaffDoorButton';
import { LogoHorizontal } from '../shared/Logo';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';

/**
 * Public homepage while the product is still being polished.
 * Staff door, localhost, invite links, password reset, and signed-in sessions
 * open the working app. Ordinary visitors stay on Coming soon.
 */
export function ComingSoonHome({ onUnlock }) {
  const theme = getTheme('Blue', false);
  const background = resolveShellBackgroundClass(undefined, false);

  useEffect(() => {
    document.title = 'Eduhub Club';
  }, []);

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center px-6 text-center ${background} ${theme.colorOnBackground}`}
    >
      <LogoHorizontal className="h-12 w-auto" />
      <h1 className={`mt-8 ${TYPE.titleLg}`}>Eduhub Club</h1>
      <p className={`mt-3 ${TYPE.titleMd} ${theme.colorOnSurfaceVariant}`}>Coming soon</p>
      <StaffDoor theme={theme} isDarkMode={false} onUnlock={onUnlock} />
    </div>
  );
}
