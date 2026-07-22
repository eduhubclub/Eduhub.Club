/**
 * Convert common share URLs into iframe-friendly embed URLs.
 * YouTube watch/short links refuse to load in iframes until converted.
 */

function youtubeIdFromUrl(raw) {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.replace(/^\//, '').split('/')[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      const markers = new Set(['embed', 'shorts', 'live', 'v']);
      for (let i = 0; i < parts.length - 1; i++) {
        if (markers.has(parts[i])) return parts[i + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {string} input
 * @returns {{ link: string, label: string, desc: string, icon: string }}
 */
export function normalizeLessonUrl(input) {
  let trimmed = String(input || '').trim();
  if (!trimmed) {
    return { link: '', label: 'Link', desc: 'Added Resource', icon: 'ExternalLink' };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const ytId = youtubeIdFromUrl(trimmed);
  if (ytId) {
    return {
      link: `https://www.youtube.com/embed/${ytId}`,
      label: 'YouTube Video',
      desc: 'YouTube',
      icon: 'MonitorPlay',
    };
  }

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes('docs.google.com') && !url.pathname.includes('/embed')) {
      const embed = trimmed.replace(/\/edit.*$/, '/embed?rm=minimal');
      return {
        link: embed,
        label: 'Google Doc',
        desc: 'Google Docs',
        icon: 'ExternalLink',
      };
    }

    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) {
        return {
          link: `https://player.vimeo.com/video/${id}`,
          label: 'Vimeo Video',
          desc: 'Vimeo',
          icon: 'MonitorPlay',
        };
      }
    }

    const host = url.hostname.replace(/^www\./, '');
    return {
      link: trimmed,
      label: host,
      desc: 'Added Resource',
      icon: 'ExternalLink',
    };
  } catch {
    return {
      link: trimmed,
      label: 'Link',
      desc: 'Added Resource',
      icon: 'ExternalLink',
    };
  }
}
