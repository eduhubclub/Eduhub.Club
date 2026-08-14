/**
 * Edu.Paper presets + last-used settings.
 */

import { defaultPaperSettings, normalizePaperSettings } from './paperModel';

const KEYS = {
  prefs: 'eduHub.paper.prefs',
  presets: 'eduHub.paper.presets',
  skipPrintHint: 'eduHub.paper.skipPrintHint',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function readPaperPrefs() {
  return normalizePaperSettings(readJson(KEYS.prefs, defaultPaperSettings()));
}

export function writePaperPrefs(settings) {
  const next = normalizePaperSettings(settings);
  writeJson(KEYS.prefs, next);
  return next;
}

export function readPaperPresets() {
  const raw = readJson(KEYS.presets, []);
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((p) => {
      if (!p || typeof p !== 'object') return null;
      const name = String(p.name || '').trim();
      if (!name) return null;
      return {
        id: String(p.id || `preset-${Date.now()}`),
        name,
        settings: normalizePaperSettings(p.settings),
      };
    })
    .filter(Boolean);
}

export function writePaperPresets(list) {
  writeJson(KEYS.presets, list);
  return readPaperPresets();
}

export function upsertPaperPreset(preset) {
  const list = readPaperPresets();
  const next = {
    id: String(preset.id || `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    name: String(preset.name || 'Preset').trim() || 'Preset',
    settings: normalizePaperSettings(preset.settings),
  };
  const idx = list.findIndex((p) => p.id === next.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  writePaperPresets(list);
  return next;
}

export function removePaperPreset(id) {
  writePaperPresets(readPaperPresets().filter((p) => p.id !== String(id)));
}

export function readSkipPrintHint() {
  try {
    return localStorage.getItem(KEYS.skipPrintHint) === '1';
  } catch {
    return false;
  }
}

export function writeSkipPrintHint(skip) {
  try {
    if (skip) localStorage.setItem(KEYS.skipPrintHint, '1');
    else localStorage.removeItem(KEYS.skipPrintHint);
  } catch {
    /* ignore */
  }
}
