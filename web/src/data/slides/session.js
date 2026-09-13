/**
 * Live present session + BroadcastChannel for same-origin follow.
 */

import {
  SLIDES_CHANNEL,
  SLIDES_SESSION_EVENT,
  makeJoinCode,
  newId,
} from './types';

const SESSION_KEY = 'eduHub.slides.session';

function readJson(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

let channel = null;

function getChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!channel) {
    try {
      channel = new BroadcastChannel(SLIDES_CHANNEL);
    } catch {
      channel = null;
    }
  }
  return channel;
}

export function broadcastLive(payload) {
  const ch = getChannel();
  ch?.postMessage(payload);
  if (typeof window !== 'undefined' && payload?.type === 'session') {
    window.dispatchEvent(new CustomEvent(SLIDES_SESSION_EVENT, { detail: payload }));
  }
}

export function broadcastSession(session) {
  broadcastLive({ type: 'session', session });
}

export function broadcastNotes({ notes, meta, slideIndex, slideCount }) {
  broadcastLive({
    type: 'notes',
    notes: String(notes || ''),
    meta: String(meta || ''),
    slideIndex: Number(slideIndex) || 0,
    slideCount: Number(slideCount) || 0,
  });
}

export function readSession() {
  const row = readJson(SESSION_KEY, null);
  if (!row || typeof row !== 'object' || !row.id) return null;
  return {
    id: String(row.id),
    deckId: String(row.deckId || ''),
    slideIndex: Math.max(0, Number(row.slideIndex) || 0),
    joinCode: String(row.joinCode || '').toUpperCase(),
    classId: String(row.classId || ''),
    startedAt: String(row.startedAt || ''),
  };
}

export function startSession({ deckId, classId = '' }) {
  const current = readSession();
  const session = {
    id: current?.deckId === String(deckId) ? current.id : newId('session'),
    deckId: String(deckId || ''),
    slideIndex: current?.deckId === String(deckId) ? current.slideIndex : 0,
    joinCode: current?.deckId === String(deckId) ? current.joinCode : makeJoinCode(),
    classId: String(classId || ''),
    startedAt: new Date().toISOString(),
  };
  writeJson(SESSION_KEY, session);
  broadcastSession(session);
  return session;
}

export function setSessionSlide(slideIndex) {
  const session = readSession();
  if (!session) return null;
  const next = { ...session, slideIndex: Math.max(0, Number(slideIndex) || 0) };
  writeJson(SESSION_KEY, next);
  broadcastSession(next);
  return next;
}

export function endSession() {
  writeJson(SESSION_KEY, null);
  broadcastSession(null);
}

export function findSessionByCode(code) {
  const session = readSession();
  if (!session) return null;
  const needle = String(code || '').trim().toUpperCase();
  if (session.joinCode === needle || session.id === needle) return session;
  return null;
}

/**
 * Subscribe to live session updates (BroadcastChannel + custom event).
 * @param {(session: object | null) => void} onChange
 */
export function subscribeSession(onChange) {
  const ch = getChannel();
  const fromMessage = (e) => {
    if (e?.data?.type === 'session') onChange(e.data.session || null);
  };
  const fromEvent = (e) => onChange(e?.detail?.session ?? readSession());
  const onStorage = (e) => {
    if (e.key && e.key !== SESSION_KEY) return;
    onChange(readSession());
  };
  ch?.addEventListener('message', fromMessage);
  if (typeof window !== 'undefined') {
    window.addEventListener(SLIDES_SESSION_EVENT, fromEvent);
    window.addEventListener('storage', onStorage);
  }
  return () => {
    ch?.removeEventListener('message', fromMessage);
    if (typeof window !== 'undefined') {
      window.removeEventListener(SLIDES_SESSION_EVENT, fromEvent);
      window.removeEventListener('storage', onStorage);
    }
  };
}
