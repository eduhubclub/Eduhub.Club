import { useId, useMemo } from 'react';

import circleOutline from '../assets/brand/logo-glyphs/outline/circle.svg?raw';
import triangleOutline from '../assets/brand/logo-glyphs/outline/triangle.svg?raw';
import squareOutline from '../assets/brand/logo-glyphs/outline/square.svg?raw';
import scribbleOutline from '../assets/brand/logo-glyphs/outline/scribble.svg?raw';

import circleTextured from '../assets/brand/logo-glyphs/textured/circle.svg?raw';
import triangleTextured from '../assets/brand/logo-glyphs/textured/triangle.svg?raw';
import squareTextured from '../assets/brand/logo-glyphs/textured/square.svg?raw';
import scribbleTextured from '../assets/brand/logo-glyphs/textured/scribble.svg?raw';

/** Glyph fill styles beyond the flat Default marks. */
export const GLYPH_STYLES = [
  { id: 'default', label: 'Default' },
  { id: 'outline', label: 'Outline' },
  { id: 'textured', label: 'Textured' },
];

export const DEFAULT_GLYPH_STYLE_ID = 'default';

const RAW = {
  outline: {
    circle: circleOutline,
    triangle: triangleOutline,
    square: squareOutline,
    scribble: scribbleOutline,
  },
  textured: {
    circle: circleTextured,
    triangle: triangleTextured,
    square: squareTextured,
    scribble: scribbleTextured,
  },
};

/** Illustrator clipPath shape ids used to pick the primary glyph from a multi-glyph export. */
const TEXTURED_CLIP_SHAPE_ID = {
  circle: 'Circle_Default',
  triangle: 'Triangle_Default',
  square: 'Square_Default',
};

function extractTopLevelGroups(html) {
  const groups = [];
  let i = 0;
  while (i < html.length) {
    const open = html.slice(i).match(/<g\b[^>]*>/);
    if (!open) break;
    const start = i + open.index;
    let pos = start + open[0].length;
    let depth = 1;
    while (depth > 0 && pos < html.length) {
      const next = html.slice(pos).match(/<\/?g\b[^>]*>/);
      if (!next) break;
      const at = pos + next.index;
      if (next[0].startsWith('</')) {
        depth -= 1;
        pos = at + next[0].length;
        if (depth === 0) {
          groups.push(html.slice(start, pos));
          i = pos;
          break;
        }
      } else {
        depth += 1;
        pos = at + next[0].length;
      }
    }
    if (depth !== 0) break;
  }
  return groups;
}

/**
 * Textured Illustrator exports often include neighboring artboard glyphs.
 * Keep defs + only the group clipped to this glyph (or the first layer for scribble).
 */
function isolateTexturedGlyph(inner, glyphId) {
  const defsMatch = inner.match(/<defs>[\s\S]*?<\/defs>/i);
  const defs = defsMatch ? defsMatch[0] : '';
  const afterDefs = defsMatch ? inner.slice(defsMatch.index + defsMatch[0].length) : inner;
  const groups = extractTopLevelGroups(afterDefs.trim());
  if (groups.length <= 1) return inner;

  if (glyphId === 'scribble') {
    // Prefer the masked layer (visible squiggle). The other layer is clipped off-artboard.
    const styleMatch = defs.match(/<style>([\s\S]*?)<\/style>/i);
    const style = styleMatch ? styleMatch[1] : '';
    const maskClass = style.match(/\.(cls-\d+)\s*\{[^}]*mask:\s*url\(#mask\)/i)?.[1];
    const masked = maskClass
      ? groups.find((g) => new RegExp(`class="${maskClass}"`).test(g))
      : null;
    return `${defs}\n${masked || groups[groups.length - 1] || groups[0]}`;
  }

  const shapeId = TEXTURED_CLIP_SHAPE_ID[glyphId];
  if (!shapeId || !defs) return `${defs}\n${groups[0]}`;

  // Match shape id only inside its own clipPath (do not span across siblings).
  const clipBlocks = [...defs.matchAll(/<clipPath id="([^"]+)">([\s\S]*?)<\/clipPath>/gi)];
  const clipHit = clipBlocks.find((m) => m[2].includes(`id="${shapeId}"`));
  if (!clipHit) return `${defs}\n${groups[0]}`;

  const clipPathId = clipHit[1];
  const styleMatch = defs.match(/<style>([\s\S]*?)<\/style>/i);
  const style = styleMatch ? styleMatch[1] : '';
  const classMatch = style.match(
    new RegExp(`\\.(cls-\\d+)\\s*\\{[^}]*clip-path:\\s*url\\(#${clipPathId}\\)`, 'i')
  );
  if (!classMatch) return `${defs}\n${groups[0]}`;

  const primaryClass = classMatch[1];
  const primary = groups.find((g) =>
    new RegExp(`^<g\\b[^>]*class="${primaryClass}"`, 'i').test(g.trim())
  );
  return `${defs}\n${primary || groups[0]}`;
}

function parseSvg(raw, { styleId, glyphId } = {}) {
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] || '0 0 100 100';
  let inner = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)?.[1]?.trim() || '';
  if (styleId === 'textured' && glyphId) {
    inner = isolateTexturedGlyph(inner, glyphId);
  }
  return { viewBox, inner };
}

const PARSED = {
  outline: Object.fromEntries(
    Object.entries(RAW.outline).map(([id, raw]) => [id, parseSvg(raw, { styleId: 'outline', glyphId: id })])
  ),
  textured: Object.fromEntries(
    Object.entries(RAW.textured).map(([id, raw]) => [id, parseSvg(raw, { styleId: 'textured', glyphId: id })])
  ),
};

export function getGlyphStyleViewBox(styleId, glyphId) {
  if (styleId === 'default') return null;
  return PARSED[styleId]?.[glyphId]?.viewBox || null;
}

// Illustrator exports share these def ids; uniquify so four glyphs can coexist.
const REWRITE_IDS = [
  'mask',
  'clippath',
  'clippath-1',
  'clippath-2',
  'luminosity-invert',
];

function uniquifyDefs(html, uid) {
  let out = html;
  // Longer names first so `clippath` does not partially rewrite `clippath-1`.
  const names = [...REWRITE_IDS].sort((a, b) => b.length - a.length);
  for (const name of names) {
    out = out
      .replaceAll(`id="${name}"`, `id="${name}-${uid}"`)
      .replaceAll(`url(#${name})`, `url(#${name}-${uid})`);
  }
  // Scope Illustrator `.cls-*` rules — nested <style> leaks document-wide in HTML.
  out = out.replace(/\.cls-(\d+)/g, `.cls-$1-${uid}`);
  out = out.replace(/class="([^"]*)"/g, (_match, classes) => {
    const next = classes
      .split(/\s+/)
      .filter(Boolean)
      .map((c) => (c.startsWith('cls-') ? `${c}-${uid}` : c))
      .join(' ');
    return `class="${next}"`;
  });
  // Brand color through currentColor instead of Illustrator black.
  out = out
    .replaceAll('fill: #202020', 'fill: currentColor')
    .replaceAll('fill:#202020', 'fill:currentColor')
    .replaceAll('fill="#202020"', 'fill="currentColor"');
  return out;
}

/**
 * Outline or textured mark for one glyph slot.
 * Parent nested svg should set viewBox via getGlyphStyleViewBox + fill currentColor.
 */
export function GlyphStyleMark({ styleId, glyphId, className }) {
  const uid = useId().replace(/:/g, '');
  const parsed = PARSED[styleId]?.[glyphId];
  const html = useMemo(() => {
    if (!parsed) return '';
    return uniquifyDefs(parsed.inner, `${glyphId}-${uid}`);
  }, [parsed, glyphId, uid]);

  if (!html) return null;
  return <g className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
