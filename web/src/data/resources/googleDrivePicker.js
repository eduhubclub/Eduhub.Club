/**
 * Ephemeral Google Drive search/list via GIS (metadata only — no file download).
 * Reuses Slides settings googleClientId when present.
 */

import { readSlidesSettings } from '../slides/settings';
import { readCloudOauthSettings } from './oneDrivePicker';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-edu-gis="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Could not load Google sign-in.')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.eduGis = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(script);
  });
}

function requestToken(clientId) {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error(resp?.error || 'Google sign-in was cancelled.'));
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Google sign-in failed.'));
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

function resolveClientId(override) {
  const id = String(
    override ||
      readCloudOauthSettings().googleClientId ||
      readSlidesSettings().googleClientId ||
      '',
  ).trim();
  if (!id) {
    throw new Error(
      'Add a Google OAuth client ID in Planner or Slides settings to search Drive.',
    );
  }
  return id;
}

/**
 * @returns {Promise<string>} short-lived access token
 */
export async function getGoogleDriveToken(clientId) {
  const id = resolveClientId(clientId);
  await loadGis();
  return requestToken(id);
}

function fileToPick(file) {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
  const url = isFolder
    ? `https://drive.google.com/drive/folders/${file.id}`
    : file.webViewLink ||
      `https://drive.google.com/file/d/${file.id}/view`;
  return {
    id: file.id,
    name: file.name || 'Untitled',
    mimeType: file.mimeType || '',
    url,
    isFolder: Boolean(isFolder),
  };
}

/**
 * Search Drive files (and folders) by name.
 * @returns {Promise<{ token: string, files: object[] }>}
 */
export async function searchGoogleDrive(query, { clientId, pageSize = 25 } = {}) {
  const token = await getGoogleDriveToken(clientId);
  const q = String(query || '').trim();
  const parts = ["trashed=false"];
  if (q) {
    const escaped = q.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    parts.push(`name contains '${escaped}'`);
  }
  const params = new URLSearchParams({
    q: parts.join(' and '),
    pageSize: String(pageSize),
    fields: 'files(id,name,mimeType,webViewLink)',
    spaces: 'drive',
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error('Could not search Google Drive. Check the client ID and access.');
  }
  const data = await res.json();
  const files = (Array.isArray(data.files) ? data.files : []).map(fileToPick);
  return { token, files };
}

/**
 * List children of a Drive folder (one page).
 */
export async function listGoogleDriveFolder(
  folderId,
  { token: existingToken, clientId, pageSize = 50 } = {},
) {
  const token = existingToken || (await getGoogleDriveToken(clientId));
  const escaped = String(folderId).replace(/'/g, "\\'");
  const params = new URLSearchParams({
    q: `'${escaped}' in parents and trashed=false`,
    pageSize: String(pageSize),
    fields: 'files(id,name,mimeType,webViewLink)',
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not list that Drive folder.');
  const data = await res.json();
  return {
    token,
    files: (Array.isArray(data.files) ? data.files : []).map(fileToPick),
  };
}

/** Parse folder id from a Drive folder URL. */
export function parseGoogleDriveFolderId(input) {
  const s = String(input || '').trim();
  const m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
  return null;
}
