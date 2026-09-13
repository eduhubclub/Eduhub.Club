/**
 * Google Slides → export PPTX via Drive API, then reuse the PPTX importer.
 * Requires a Google OAuth client ID in Slides settings (GIS token client).
 */

import { importPptxDeck } from './importPptx';
import { importPdfDeck } from './importPdf';
import { readSlidesSettings } from './settings';

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const SLIDES_MIME = 'application/vnd.google-apps.presentation';
const PDF_MIME = 'application/pdf';

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-edu-gis="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Google sign-in.')));
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
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (resp) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error(resp?.error || 'Google sign-in was cancelled.'));
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Google sign-in failed.'));
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * @returns {Promise<{ id: string, name: string }[]>}
 */
export async function listGoogleSlidesDecks() {
  const clientId = readSlidesSettings().googleClientId;
  if (!clientId) {
    throw new Error('Add a Google OAuth client ID in Settings, or upload a .pptx / .pdf export.');
  }
  await loadGis();
  const token = await requestToken(clientId);
  const q = encodeURIComponent(`mimeType='${SLIDES_MIME}' and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=25&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Could not list Google Slides. Check the client ID and Drive access.');
  const data = await res.json();
  return { token, files: Array.isArray(data.files) ? data.files : [] };
}

/**
 * @param {string} fileId
 * @param {string} name
 * @param {string} token
 */
export async function importGoogleSlideFile(fileId, name, token) {
  const pptxRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId,
    )}/export?mimeType=${encodeURIComponent(PPTX_MIME)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (pptxRes.ok) {
    const buf = await pptxRes.arrayBuffer();
    return importPptxDeck(buf, name || 'Google Slides');
  }
  const pdfRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId,
    )}/export?mimeType=${encodeURIComponent(PDF_MIME)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!pdfRes.ok) {
    throw new Error('Google could not export that deck. Download it as PowerPoint or PDF and import the file.');
  }
  const buf = await pdfRes.arrayBuffer();
  return importPdfDeck(buf, name || 'Google Slides');
}
