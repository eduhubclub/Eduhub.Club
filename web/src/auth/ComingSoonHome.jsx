import { useEffect } from 'react';
import { LogoHorizontal } from '../shared/Logo';
import { getTheme, resolveShellBackgroundClass } from '../shared/theme';
import { TYPE } from '../shared/typography';

/**
 * Public entry while sign-in is closed.
 * Do not add role cards or a login modal here.
 */
export function ComingSoonHome() {
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
    </div>
  );
}
