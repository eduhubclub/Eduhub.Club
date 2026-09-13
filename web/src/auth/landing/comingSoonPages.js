/** Signed-out pages that exist, but aren’t written yet. */
export const COMING_SOON_PAGES = {
  '/help': { title: 'Help Center' },
  '/contact': { title: 'Contact' },
  '/guides': { title: 'Guides' },
};

export function comingSoonPage(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/';
  return COMING_SOON_PAGES[path] || null;
}
