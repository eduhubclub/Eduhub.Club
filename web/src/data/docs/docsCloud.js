/**
 * Save/Open .edudoc under Edu.Hub/Docs on Drive or OneDrive.
 * Canonical format only — never Word round-trip.
 */

import { getGoogleDriveToken } from '../resources/googleDrivePicker';
import {
  getOneDriveToken,
  readCloudOauthSettings,
} from '../resources/oneDrivePicker';
import { normalizeDoc } from './docModel';
import {
  EDUDOC_MIME,
  edudocFileName,
  parseEdudoc,
  serializeEdudoc,
} from './edudocFormat';
import { writeDoc } from './docStorage';

const FOLDER_HUB = 'Edu.Hub';
const FOLDER_DOCS = 'Docs';
const GOOGLE_FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Drive write scope (in addition to read used by Planner). */
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

async function getGoogleWriteToken(clientId) {
  // GIS token client is scoped at init; request drive.file via a dedicated client.
  const { readSlidesSettings } = await import('../slides/settings');
  const id = String(
    clientId ||
      readCloudOauthSettings().googleClientId ||
      readSlidesSettings().googleClientId ||
      '',
  ).trim();
  if (!id) {
    throw new Error(
      'Add a Google OAuth client ID in Docs or Planner settings to save to Drive.',
    );
  }
  await new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(script);
  });
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: DRIVE_FILE_SCOPE,
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

async function ensureGoogleChildFolder(token, parentId, name) {
  const escaped = name.replace(/'/g, "\\'");
  const parentClause = parentId
    ? `'${parentId}' in parents`
    : `'root' in parents`;
  const q = `name='${escaped}' and mimeType='${GOOGLE_FOLDER_MIME}' and ${parentClause} and trashed=false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name)',
    pageSize: '1',
  });
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) throw new Error('Could not look up Edu.Hub folders on Drive.');
  const listed = await listRes.json();
  const existing = listed.files?.[0];
  if (existing?.id) return existing.id;

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: GOOGLE_FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
    }),
  });
  if (!createRes.ok) throw new Error('Could not create Edu.Hub/Docs on Drive.');
  const created = await createRes.json();
  return created.id;
}

async function ensureGoogleDocsFolder(token) {
  const hubId = await ensureGoogleChildFolder(token, null, FOLDER_HUB);
  const docsId = await ensureGoogleChildFolder(token, hubId, FOLDER_DOCS);
  return docsId;
}

async function uploadGoogleEdudoc(token, folderId, doc, existingFileId) {
  const body = serializeEdudoc(doc);
  const meta = {
    name: edudocFileName(doc.title),
    mimeType: EDUDOC_MIME,
  };
  if (!existingFileId) meta.parents = [folderId];

  const boundary = `eduhub_${Date.now()}`;
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${EDUDOC_MIME}\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
  if (!res.ok) throw new Error('Could not save .edudoc to Google Drive.');
  const file = await res.json();
  return {
    provider: 'google',
    fileId: file.id,
    folderId,
    path: `${FOLDER_HUB}/${FOLDER_DOCS}`,
    syncedAt: new Date().toISOString(),
    webUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
  };
}

async function downloadGoogleEdudoc(token, fileId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not open that Drive document.');
  return parseEdudoc(await res.text());
}

async function ensureOneDriveDocsFolder(token) {
  const ensure = async (path) => {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(path)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const item = await res.json();
      return item.id;
    }
    if (res.status !== 404) {
      throw new Error('Could not look up Edu.Hub folders on OneDrive.');
    }
    const parentPath = path.includes('/')
      ? path.slice(0, path.lastIndexOf('/'))
      : '';
    const name = path.includes('/')
      ? path.slice(path.lastIndexOf('/') + 1)
      : path;
    const createUrl = parentPath
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(parentPath)}:/children`
      : 'https://graph.microsoft.com/v1.0/me/drive/root/children';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      }),
    });
    if (!createRes.ok) {
      // Race: folder created elsewhere
      const again = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(path)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (again.ok) return (await again.json()).id;
      throw new Error('Could not create Edu.Hub/Docs on OneDrive.');
    }
    return (await createRes.json()).id;
  };

  await ensure(FOLDER_HUB);
  return ensure(`${FOLDER_HUB}/${FOLDER_DOCS}`);
}

async function uploadOneDriveEdudoc(token, folderId, doc, existingFileId) {
  const body = serializeEdudoc(doc);
  const name = edudocFileName(doc.title);
  let url;
  if (existingFileId) {
    url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(existingFileId)}/content`;
  } else {
    url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}:/${encodeURIComponent(name)}:/content`;
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': EDUDOC_MIME,
    },
    body,
  });
  if (!res.ok) throw new Error('Could not save .edudoc to OneDrive.');
  const file = await res.json();
  return {
    provider: 'onedrive',
    fileId: file.id,
    folderId,
    path: `${FOLDER_HUB}/${FOLDER_DOCS}`,
    syncedAt: new Date().toISOString(),
    webUrl: file.webUrl || '',
  };
}

async function downloadOneDriveEdudoc(token, fileId) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(fileId)}/content`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not open that OneDrive document.');
  return parseEdudoc(await res.text());
}

/**
 * Push local doc to Edu.Hub/Docs as .edudoc.
 * @param {'google'|'onedrive'} provider
 */
export async function saveDocToCloud(doc, provider) {
  const normalized = normalizeDoc(doc);
  if (provider === 'google') {
    const token = await getGoogleWriteToken();
    const folderId = await ensureGoogleDocsFolder(token);
    const existing =
      normalized.cloud?.provider === 'google' ? normalized.cloud.fileId : '';
    const cloud = await uploadGoogleEdudoc(
      token,
      folderId,
      normalized,
      existing || undefined,
    );
    return writeDoc({ ...normalized, cloud });
  }

  // OneDrive needs write scopes — reuse token helper; Graph may prompt consent.
  const token = await getOneDriveToken();
  const folderId = await ensureOneDriveDocsFolder(token);
  const existing =
    normalized.cloud?.provider === 'onedrive' ? normalized.cloud.fileId : '';
  const cloud = await uploadOneDriveEdudoc(
    token,
    folderId,
    normalized,
    existing || undefined,
  );
  return writeDoc({ ...normalized, cloud });
}

/**
 * Pull .edudoc from cloud into local library (keeps local id when merging).
 */
export async function openDocFromCloud(provider, fileId, { keepLocalId } = {}) {
  let remote;
  if (provider === 'google') {
    const token = await getGoogleDriveToken();
    remote = await downloadGoogleEdudoc(token, fileId);
  } else {
    const token = await getOneDriveToken();
    remote = await downloadOneDriveEdudoc(token, fileId);
  }
  const local = writeDoc({
    ...remote,
    id: keepLocalId || remote.id,
    cloud: {
      provider,
      fileId,
      folderId: '',
      path: `${FOLDER_HUB}/${FOLDER_DOCS}`,
      syncedAt: new Date().toISOString(),
      webUrl: '',
    },
    openedAt: new Date().toISOString(),
    trashedAt: null,
  });
  return local;
}

/**
 * List .edudoc files in Edu.Hub/Docs.
 */
export async function listCloudEdudocs(provider) {
  if (provider === 'google') {
    const token = await getGoogleWriteToken();
    const folderId = await ensureGoogleDocsFolder(token);
    const escaped = folderId.replace(/'/g, "\\'");
    const params = new URLSearchParams({
      q: `'${escaped}' in parents and trashed=false and name contains '.edudoc'`,
      fields: 'files(id,name,mimeType,webViewLink,modifiedTime)',
      pageSize: '50',
    });
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error('Could not list Drive Edu.Hub/Docs.');
    const data = await res.json();
    return (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      webUrl: f.webViewLink,
      modifiedTime: f.modifiedTime,
      provider: 'google',
    }));
  }

  const token = await getOneDriveToken();
  const folderId = await ensureOneDriveDocsFolder(token);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}/children`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not list OneDrive Edu.Hub/Docs.');
  const data = await res.json();
  return (data.value || [])
    .filter((f) => String(f.name || '').endsWith('.edudoc'))
    .map((f) => ({
      id: f.id,
      name: f.name,
      webUrl: f.webUrl,
      modifiedTime: f.lastModifiedDateTime,
      provider: 'onedrive',
    }));
}
