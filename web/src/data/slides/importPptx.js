/**
 * PPTX → deck: text boxes, pictures, and a solid background when present.
 */

import { bytesToDataUrl, bytesToText, unzipArrayBuffer } from './unzip';
import { importDeckFromSlides } from './storage';

const EMU_SLIDE_W = 12192000;
const EMU_SLIDE_H = 6858000;

const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

function attr(el, name) {
  if (!el) return '';
  const local = name.includes(':') ? name.split(':')[1] : name;
  return (
    el.getAttribute?.(name) ||
    el.getAttributeNS?.(null, name) ||
    el.getAttributeNS?.(R_NS, local) ||
    el.getAttribute?.(local) ||
    ''
  );
}

function byLocal(root, localName) {
  return [...root.getElementsByTagName('*')].filter((n) => n.localName === localName);
}

function emuPct(x, y, cx, cy) {
  return {
    x: (Number(x) / EMU_SLIDE_W) * 100,
    y: (Number(y) / EMU_SLIDE_H) * 100,
    w: (Number(cx) / EMU_SLIDE_W) * 100,
    h: (Number(cy) / EMU_SLIDE_H) * 100,
  };
}

function parseRels(xml) {
  if (typeof DOMParser === 'undefined') return {};
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const map = {};
  for (const rel of byLocal(doc, 'Relationship')) {
    map[attr(rel, 'Id')] = attr(rel, 'Target');
  }
  return map;
}

function resolveMedia(target, files) {
  if (!target) return '';
  const clean = target.replace(/^\.\.\//, 'ppt/').replace(/^\//, '');
  const path = clean.startsWith('ppt/') ? clean : `ppt/slides/${clean}`.replace('/slides/../', '/');
  const bytes = files[path] || files[clean] || files[`ppt/${clean.replace(/^ppt\//, '')}`];
  if (!bytes) return '';
  const lower = path.toLowerCase();
  const mime = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
      ? 'image/jpeg'
      : lower.endsWith('.gif')
        ? 'image/gif'
        : 'image/png';
  return bytesToDataUrl(bytes, mime);
}

function shapeBox(sp) {
  const xfrm = byLocal(sp, 'xfrm')[0];
  if (!xfrm) return { x: 8, y: 8, w: 40, h: 16 };
  const off = byLocal(xfrm, 'off')[0];
  const ext = byLocal(xfrm, 'ext')[0];
  return emuPct(
    attr(off, 'x') || 0,
    attr(off, 'y') || 0,
    attr(ext, 'cx') || EMU_SLIDE_W / 3,
    attr(ext, 'cy') || EMU_SLIDE_H / 6,
  );
}

function collectText(el) {
  return byLocal(el, 't')
    .map((n) => n.textContent || '')
    .join('')
    .trim();
}

function parseSlideXml(xml, rels, files) {
  if (typeof DOMParser === 'undefined') {
    const texts = [...String(xml).matchAll(/<(?:a:)?t\b[^>]*>([^<]*)<\/(?:a:)?t>/g)].map(
      (m) => m[1],
    );
    return {
      notes: '',
      background: { color: '#ffffff', imageUrl: '' },
      objects: texts.filter(Boolean).map((text, i) => ({
        kind: 'text',
        text,
        fontSize: 28,
        x: 8,
        y: 12 + i * 16,
        w: 84,
        h: 14,
      })),
    };
  }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const objects = [];
  const skipped = [];

  for (const pic of byLocal(doc, 'pic')) {
    const blip = byLocal(pic, 'blip')[0];
    const embed = attr(blip, 'r:embed') || attr(blip, 'embed');
    const src = resolveMedia(rels[embed], files);
    if (!src) {
      skipped.push('picture');
      continue;
    }
    objects.push({ kind: 'image', src, ...shapeBox(pic) });
  }

  for (const sp of byLocal(doc, 'sp')) {
    const text = collectText(sp);
    if (!text) continue;
    objects.push({
      kind: 'text',
      text,
      fontSize: 28,
      ...shapeBox(sp),
    });
  }

  if (!objects.length && skipped.length) {
    skipped.push('SmartArt/charts were skipped');
  }

  return {
    notes: skipped.length ? `Skipped: ${[...new Set(skipped)].join(', ')}.` : '',
    background: { color: '#ffffff', imageUrl: '' },
    objects,
  };
}

function slidePaths(files) {
  return Object.keys(files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = Number((a.match(/slide(\d+)/i) || [])[1] || 0);
      const nb = Number((b.match(/slide(\d+)/i) || [])[1] || 0);
      return na - nb;
    });
}

/**
 * @param {ArrayBuffer} data
 * @param {string} [name]
 */
export async function importPptxDeck(data, name = 'Imported PowerPoint') {
  const files = await unzipArrayBuffer(data);
  const paths = slidePaths(files);
  if (!paths.length) throw new Error('No slides found in that PowerPoint file.');
  const slides = [];
  for (const path of paths) {
    const xml = bytesToText(files[path]);
    const relPath = path.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relXml = files[relPath] ? bytesToText(files[relPath]) : '';
    const rels = relXml ? parseRels(relXml) : {};
    slides.push(parseSlideXml(xml, rels, files));
  }
  return importDeckFromSlides(name.replace(/\.pptx$/i, '') || 'Imported PowerPoint', slides);
}
