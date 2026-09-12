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
    document.title = 'Coming soon · Edu.Hub';
  }, []);

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center px-6 text-center ${background} ${theme.colorOnBackground}`}
    >
      <LogoHorizontal className="h-10 w-auto" />
      <h1 className={`mt-6 ${TYPE.titleLg}`}>Coming soon</h1>
      <p className={`mt-3 max-w-md ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
        Edu.Hub isn’t open for sign-in yet. Check back soon.
      </p>
    </div>
  );
}
