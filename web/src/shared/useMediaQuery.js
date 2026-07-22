import { useEffect, useState } from 'react';

/** Tailwind `md` = 768px — desktop shell vs phone drawer. */
export const DESKTOP_MQ = '(min-width: 768px)';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery(DESKTOP_MQ);
}
