/**
 * Teachable resource refs — metadata only (no file bytes).
 */

import { normalizeLessonUrl } from '../lessons/normalizeLessonUrl';

export const RESOURCE_SOURCES = ['google_drive', 'onedrive', 'web', 'manual'];

export function newResourceId() {
  return `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function detectSource(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
      return 'google_drive';
    }
    if (
      host.includes('onedrive.live.com') ||
      host.includes('sharepoint.com') ||
      host.includes('1drv.ms')
    ) {
      return 'onedrive';
    }
  } catch {
    /* ignore */
  }
  return 'web';
}

/** Build a preview/open URL for known cloud hosts. */
export function toEmbedUrl(url) {
  const { link } = normalizeLessonUrl(url);
  try {
    const u = new URL(link);
    // Google Drive file → preview
    if (u.hostname.includes('drive.google.com')) {
      const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (fileMatch) {
        return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
      }
      const openId = u.searchParams.get('id');
      if (openId) {
        return `https://drive.google.com/file/d/${openId}/preview`;
      }
    }
    // Google Slides presentation
    if (u.hostname.includes('docs.google.com') && u.pathname.includes('/presentation/')) {
      return link.replace(/\/edit.*$/, '/embed?start=false&rm=minimal');
    }
  } catch {
    /* ignore */
  }
  return link;
}

/**
 * @returns {{
 *   id: string,
 *   title: string,
 *   url: string,
 *   embedUrl: string,
 *   source: string,
 *   externalId: string,
 *   mimeType: string,
 *   icon: string,
 *   addedAt: string,
 * }}
 */
export function normalizeResource(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const url = String(raw.url || '').trim();
  if (!url) return null;
  const normalized = normalizeLessonUrl(url);
  const embedUrl = raw.embedUrl ? String(raw.embedUrl) : toEmbedUrl(url);
  const source = RESOURCE_SOURCES.includes(raw.source)
    ? raw.source
    : detectSource(normalized.link || url);
  return {
    id: String(raw.id || newResourceId()),
    title: String(raw.title || normalized.label || 'Resource').trim() || 'Resource',
    url: normalized.link || url,
    embedUrl,
    source,
    externalId: raw.externalId != null ? String(raw.externalId) : '',
    mimeType: raw.mimeType != null ? String(raw.mimeType) : '',
    icon: String(raw.icon || normalized.icon || 'ExternalLink'),
    addedAt: String(raw.addedAt || new Date().toISOString()),
  };
}

export function resourceFromUrl(input, overrides = {}) {
  const normalized = normalizeLessonUrl(input);
  if (!normalized.link) return null;
  return normalizeResource({
    title: overrides.title || normalized.label,
    url: normalized.link,
    source: overrides.source || detectSource(normalized.link),
    externalId: overrides.externalId,
    mimeType: overrides.mimeType,
    icon: overrides.icon || normalized.icon,
  });
}

/** Map resource → Dashboard lesson shape. */
export function resourceToLesson(resource) {
  if (!resource) return null;
  return {
    id: resource.id,
    label: resource.title,
    desc:
      resource.source === 'google_drive'
        ? 'Google Drive'
        : resource.source === 'onedrive'
          ? 'OneDrive'
          : 'Resource',
    icon: resource.icon || 'ExternalLink',
    link: resource.embedUrl || resource.url,
  };
}
