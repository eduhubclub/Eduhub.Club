/**
 * Local-first decks, slides, and objects.
 */

import {
  EMBED_KINDS,
  OBJECT_KINDS,
  SHAPE_KINDS,
  SLIDES_UPDATED_EVENT,
  newId,
} from './types';

const DECKS_KEY = 'eduHub.slides.decks';
const ACTIVE_KEY = 'eduHub.slides.activeDeckId';

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
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SLIDES_UPDATED_EVENT));
  }
}

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function normalizeObject(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const kind = OBJECT_KINDS.includes(src.kind) ? src.kind : 'text';
  const base = {
    id: String(src.id || newId('obj')),
    kind,
    x: clamp(src.x, 0, 100),
    y: clamp(src.y, 0, 100),
    w: clamp(src.w ?? 30, 2, 100),
    h: clamp(src.h ?? 12, 2, 100),
    rotation: clamp(src.rotation ?? 0, -180, 180),
  };
  if (kind === 'text') {
    return {
      ...base,
      text: String(src.text ?? 'Text'),
      fontSize: clamp(src.fontSize ?? 32, 12, 160),
      color: String(src.color || '#0f172a'),
      align: src.align === 'center' || src.align === 'right' ? src.align : 'left',
      fontId: String(src.fontId || 'default'),
    };
  }
  if (kind === 'image') {
    return {
      ...base,
      src: String(src.src || ''),
    };
  }
  if (kind === 'shape') {
    return {
      ...base,
      shape: SHAPE_KINDS.includes(src.shape) ? src.shape : 'rect',
      fill: String(src.fill || '#fb7185'),
      stroke: String(src.stroke || '#9f1239'),
    };
  }
  return {
    ...base,
    embedType: EMBED_KINDS.includes(src.embedType) ? src.embedType : 'timer',
    durationSec: clamp(src.durationSec ?? 60, 5, 3600),
  };
}

export function normalizeSlide(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    id: String(src.id || newId('slide')),
    notes: String(src.notes || ''),
    background: {
      color: String(src.background?.color || '#ffffff'),
      imageUrl: String(src.background?.imageUrl || ''),
    },
    objects: Array.isArray(src.objects) ? src.objects.map(normalizeObject) : [],
  };
}

export function normalizeDeck(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const now = new Date().toISOString();
  const slides = Array.isArray(src.slides) && src.slides.length
    ? src.slides.map(normalizeSlide)
    : [blankSlide()];
  return {
    id: String(src.id || newId('deck')),
    name: String(src.name || 'Untitled lesson').trim() || 'Untitled lesson',
    createdAt: String(src.createdAt || now),
    updatedAt: String(src.updatedAt || now),
    slides,
  };
}

export function blankSlide() {
  return normalizeSlide({
    objects: [
      {
        kind: 'text',
        x: 8,
        y: 38,
        w: 84,
        h: 20,
        text: 'Click to add title',
        fontSize: 56,
        align: 'center',
      },
    ],
  });
}

export function readDecks() {
  const list = readJson(DECKS_KEY, []);
  return Array.isArray(list) ? list.map(normalizeDeck) : [];
}

function writeDecks(list) {
  writeJson(DECKS_KEY, list);
}

export function readActiveDeckId() {
  return String(readJson(ACTIVE_KEY, '') || '');
}

export function writeActiveDeckId(id) {
  writeJson(ACTIVE_KEY, String(id || ''));
}

export function getDeck(id) {
  return readDecks().find((d) => d.id === String(id)) || null;
}

export function getActiveDeck() {
  const id = readActiveDeckId();
  const decks = readDecks();
  return decks.find((d) => d.id === id) || decks[0] || null;
}

export function createDeck(name = 'Untitled lesson') {
  const deck = normalizeDeck({
    name,
    slides: [blankSlide()],
  });
  writeDecks([deck, ...readDecks()]);
  writeActiveDeckId(deck.id);
  return deck;
}

export function duplicateDeck(deckId) {
  const src = getDeck(deckId);
  if (!src) return null;
  const copy = normalizeDeck({
    ...src,
    id: newId('deck'),
    name: `${src.name} copy`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slides: src.slides.map((s) =>
      normalizeSlide({
        ...s,
        id: newId('slide'),
        objects: s.objects.map((o) => ({ ...o, id: newId('obj') })),
      }),
    ),
  });
  writeDecks([copy, ...readDecks()]);
  writeActiveDeckId(copy.id);
  return copy;
}

export function deleteDeck(deckId) {
  const next = readDecks().filter((d) => d.id !== String(deckId));
  writeDecks(next);
  if (readActiveDeckId() === String(deckId)) {
    writeActiveDeckId(next[0]?.id || '');
  }
  return { ok: true };
}

export function updateDeck(deckId, patch) {
  const id = String(deckId);
  let updated = null;
  const next = readDecks().map((d) => {
    if (d.id !== id) return d;
    updated = normalizeDeck({
      ...d,
      ...patch,
      id: d.id,
      createdAt: d.createdAt,
      updatedAt: new Date().toISOString(),
      slides: patch.slides ? patch.slides.map(normalizeSlide) : d.slides,
    });
    return updated;
  });
  if (!updated) return null;
  writeDecks(next);
  return updated;
}

export function addSlide(deckId, afterId) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const slide = blankSlide();
  const slides = [...deck.slides];
  const idx = afterId ? slides.findIndex((s) => s.id === String(afterId)) : slides.length - 1;
  slides.splice(idx + 1, 0, slide);
  updateDeck(deck.id, { slides });
  return slide;
}

export function duplicateSlide(deckId, slideId) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const idx = deck.slides.findIndex((s) => s.id === String(slideId));
  if (idx < 0) return null;
  const src = deck.slides[idx];
  const copy = normalizeSlide({
    ...src,
    id: newId('slide'),
    objects: src.objects.map((o) => ({ ...o, id: newId('obj') })),
  });
  const slides = [...deck.slides];
  slides.splice(idx + 1, 0, copy);
  updateDeck(deck.id, { slides });
  return copy;
}

export function deleteSlide(deckId, slideId) {
  const deck = getDeck(deckId);
  if (!deck) return { ok: false, error: 'Deck not found.' };
  if (deck.slides.length <= 1) return { ok: false, error: 'A deck needs at least one slide.' };
  const slides = deck.slides.filter((s) => s.id !== String(slideId));
  updateDeck(deck.id, { slides });
  return { ok: true };
}

export function updateSlide(deckId, slideId, patch) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const slides = deck.slides.map((s) =>
    s.id === String(slideId) ? normalizeSlide({ ...s, ...patch, id: s.id }) : s,
  );
  return updateDeck(deck.id, { slides });
}

export function addObject(deckId, slideId, input) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const obj = normalizeObject(input);
  const slides = deck.slides.map((s) =>
    s.id === String(slideId) ? { ...s, objects: [...s.objects, obj] } : s,
  );
  updateDeck(deck.id, { slides });
  return obj;
}

export function updateObject(deckId, slideId, objectId, patch) {
  const deck = getDeck(deckId);
  if (!deck) return null;
  const slides = deck.slides.map((s) => {
    if (s.id !== String(slideId)) return s;
    return {
      ...s,
      objects: s.objects.map((o) =>
        o.id === String(objectId) ? normalizeObject({ ...o, ...patch, id: o.id }) : o,
      ),
    };
  });
  return updateDeck(deck.id, { slides });
}

export function deleteObject(deckId, slideId, objectId) {
  const deck = getDeck(deckId);
  if (!deck) return { ok: false };
  const slides = deck.slides.map((s) =>
    s.id === String(slideId)
      ? { ...s, objects: s.objects.filter((o) => o.id !== String(objectId)) }
      : s,
  );
  updateDeck(deck.id, { slides });
  return { ok: true };
}

export function importDeckFromSlides(name, slides) {
  const deck = normalizeDeck({
    name: name || 'Imported lesson',
    slides: (slides || []).map(normalizeSlide),
  });
  if (!deck.slides.length) deck.slides = [blankSlide()];
  writeDecks([deck, ...readDecks()]);
  writeActiveDeckId(deck.id);
  return deck;
}
