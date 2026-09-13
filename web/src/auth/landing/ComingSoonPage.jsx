import { TYPE } from '../../shared/typography';
import { mutedInk } from './landingStyle';

export function ComingSoonPage({ title, theme }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-5xl flex-col justify-center px-4 py-20 sm:px-8">
      <p className={`${TYPE.labelLg} ${mutedInk}`}>{title}</p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight sm:text-5xl">Coming soon</h1>
      <p className={`mt-4 max-w-md ${TYPE.bodyMd} ${mutedInk}`}>
        This page isn’t ready yet. Check back soon.
      </p>
      <a
        href="/"
        className={`edu-control mt-8 w-fit rounded-full px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      >
        Back home
      </a>
    </div>
  );
}
