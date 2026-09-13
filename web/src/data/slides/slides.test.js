import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildSlidesJoinPayload,
  parseSlidesJoinPayload,
  normalizeSlidesSettings,
} from './types';
import {
  addObject,
  addSlide,
  createDeck,
  deleteSlide,
  duplicateDeck,
  getDeck,
  readDecks,
  updateObject,
} from './storage';
import { findSessionByCode, readSession, startSession, setSessionSlide } from './session';
import { bytesToText, unzipArrayBuffer } from './unzip';
import { importPptxDeck } from './importPptx';

describe('slides', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('normalizes settings and join payloads', () => {
    expect(normalizeSlidesSettings({ aspect: '4:3', showJoinQr: false }).aspect).toBe('4:3');
    const payload = buildSlidesJoinPayload('session-1', 'AB12');
    expect(parseSlidesJoinPayload(payload)).toEqual({
      sessionId: 'session-1',
      code: 'AB12',
      v: 1,
    });
  });

  it('creates a deck with one title slide and can duplicate', () => {
    const deck = createDeck('Morning lesson');
    expect(deck.name).toBe('Morning lesson');
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].objects[0].kind).toBe('text');
    const copy = duplicateDeck(deck.id);
    expect(copy?.id).not.toBe(deck.id);
    expect(readDecks()).toHaveLength(2);
  });

  it('adds slides and objects; refuses to delete the last slide', () => {
    const deck = createDeck('Edit me');
    const slide = addSlide(deck.id, deck.slides[0].id);
    expect(getDeck(deck.id)?.slides).toHaveLength(2);
    const obj = addObject(deck.id, slide.id, {
      kind: 'shape',
      shape: 'ellipse',
      x: 10,
      y: 10,
      w: 20,
      h: 20,
    });
    expect(obj?.shape).toBe('ellipse');
    updateObject(deck.id, slide.id, obj.id, { x: 40 });
    expect(
      getDeck(deck.id)?.slides
        .find((s) => s.id === slide.id)
        ?.objects.find((o) => o.id === obj.id)?.x,
    ).toBe(40);
    expect(deleteSlide(deck.id, slide.id).ok).toBe(true);
    expect(deleteSlide(deck.id, getDeck(deck.id).slides[0].id).ok).toBe(false);
  });

  it('starts a session and looks it up by join code', () => {
    const deck = createDeck('Present me');
    const session = startSession({ deckId: deck.id, classId: 'class-1' });
    expect(session.joinCode).toHaveLength(4);
    expect(findSessionByCode(session.joinCode)?.id).toBe(session.id);
    setSessionSlide(2);
    expect(readSession()?.slideIndex).toBe(2);
  });

  it('unzips store-method files and maps PPTX text into objects', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:sp>
    <a:xfrm>
      <a:off x="1219200" y="1371600"/>
      <a:ext cx="9144000" cy="1828800"/>
    </a:xfrm>
    <a:t>Hello class</a:t>
  </p:sp>
</p:sld>`;
    const zip = makeStoreZip({
      'ppt/slides/slide1.xml': xml,
    });
    const files = await unzipArrayBuffer(zip);
    expect(bytesToText(files['ppt/slides/slide1.xml'])).toContain('Hello class');
    const deck = await importPptxDeck(zip, 'Lesson.pptx');
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].objects.some((o) => o.kind === 'text' && o.text === 'Hello class')).toBe(
      true,
    );
  });
});

function makeStoreZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const names = Object.keys(files);
  for (const name of names) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(files[name]);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const cdOffset = offset;
  const cdSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, names.length, true);
  ev.setUint16(10, names.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  const total = offset + cdSize + 22;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of [...localParts, ...centralParts, eocd]) {
    out.set(part, pos);
    pos += part.length;
  }
  return out.buffer;
}
