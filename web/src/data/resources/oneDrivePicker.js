/**
 * Ephemeral OneDrive / Microsoft Graph search via MSAL browser (CDN).
 * Metadata only — no file download. Client ID from schedule cloud settings.
 */

const SETTINGS_KEY = 'eduHub.cloud.oauth';
const GRAPH_SCOPES = [
  'User.Read',
  'Files.Read',
  'Files.Read.All',
  'Files.ReadWrite',
];

export function readCloudOauthSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      googleClientId: String(raw.googleClientId || '').trim(),
      microsoftClientId: String(raw.microsoftClientId || '').trim(),
    };
  } catch {
    return { googleClientId: '', microsoftClientId: '' };
  }
}

export function writeCloudOauthSettings(partial) {
  const prev = readCloudOauthSettings();
  const next = {
    googleClientId:
      partial.googleClientId != null
        ? String(partial.googleClientId).trim()
        : prev.googleClientId,
    microsoftClientId:
      partial.microsoftClientId != null
        ? String(partial.microsoftClientId).trim()
        : prev.microsoftClientId,
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(
      new CustomEvent('eduHub.cloud.oauth.updated', { detail: next }),
    );
  } catch {
    /* ignore */
  }
  return next;
}

function loadMsal() {
  return new Promise((resolve, reject) => {
    if (window.msal?.PublicClientApplication) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-edu-msal="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Could not load Microsoft sign-in.')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js';
    script.async = true;
    script.dataset.eduMsal = 'true';
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Could not load Microsoft sign-in.'));
    document.head.appendChild(script);
  });
}

let msalApp = null;

async function getMsalApp(clientId) {
  await loadMsal();
  if (!msalApp || msalApp.config?.auth?.clientId !== clientId) {
    msalApp = new window.msal.PublicClientApplication({
      auth: {
        clientId,
        redirectUri: window.location.origin,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
    if (typeof msalApp.initialize === 'function') {
      await msalApp.initialize();
    }
  }
  return msalApp;
}

/**
 * @returns {Promise<string>} access token
 */
export async function getOneDriveToken(clientIdOverride) {
  const clientId =
    String(clientIdOverride || readCloudOauthSettings().microsoftClientId || '').trim();
  if (!clientId) {
    throw new Error(
      'Add a Microsoft app (client) ID in Planner settings to search OneDrive.',
    );
  }
  const app = await getMsalApp(clientId);
  const accounts = app.getAllAccounts();
  let account = accounts[0];
  if (!account) {
    const login = await app.loginPopup({ scopes: GRAPH_SCOPES });
    account = login.account;
  }
  try {
    const result = await app.acquireTokenSilent({
      scopes: GRAPH_SCOPES,
      account,
    });
    return result.accessToken;
  } catch {
    const result = await app.acquireTokenPopup({ scopes: GRAPH_SCOPES });
    return result.accessToken;
  }
}

function itemToPick(item) {
  const isFolder = Boolean(item.folder);
  const url =
    item.webUrl ||
    (isFolder
      ? `https://onedrive.live.com/?id=${encodeURIComponent(item.id)}`
      : `https://onedrive.live.com/?cid=&id=${encodeURIComponent(item.id)}`);
  return {
    id: item.id,
    name: item.name || 'Untitled',
    mimeType: item.file?.mimeType || (isFolder ? 'folder' : ''),
    url,
    isFolder,
  };
}

/**
 * Search OneDrive via Microsoft Graph.
 */
export async function searchOneDrive(query, { clientId, top = 25 } = {}) {
  const token = await getOneDriveToken(clientId);
  const q = String(query || '').trim() || '*';
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${encodeURIComponent(q)}')?$top=${top}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error('Could not search OneDrive. Check the Microsoft client ID and consent.');
  }
  const data = await res.json();
  const files = (Array.isArray(data.value) ? data.value : []).map(itemToPick);
  return { token, files };
}

/**
 * List children of a OneDrive item.
 */
export async function listOneDriveChildren(itemId, { token: existingToken, clientId } = {}) {
  const token = existingToken || (await getOneDriveToken(clientId));
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(itemId)}/children`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not list that OneDrive folder.');
  const data = await res.json();
  return {
    token,
    files: (Array.isArray(data.value) ? data.value : []).map(itemToPick),
  };
}
