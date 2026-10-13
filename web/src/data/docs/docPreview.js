/**
 * Preview helpers from TipTap JSON (text + images for thumbnails).
 */

/**
 * @param {unknown} node
 * @param {string[]} out
 */
function walkText(node, out) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.text === 'string' && node.text) {
    out.push(node.text);
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) walkText(child, out);
  }
}

/**
 * Ordered preview blocks: text runs and images, document order.
 * @param {unknown} content TipTap doc JSON
 * @param {{ maxText?: number, maxImages?: number }} [opts]
 * @returns {{ type: 'text', text: string } | { type: 'image', src: string, alt: string }[]}
 */
export function docPreviewBlocks(content, opts = {}) {
  const maxText = opts.maxText ?? 280;
  const maxImages = opts.maxImages ?? 4;
  /** @type {{ type: 'text', text: string } | { type: 'image', src: string, alt: string }[]} */
  const blocks = [];
  let textBudget = maxText;
  let imageCount = 0;

  const pushText = (raw) => {
    if (textBudget <= 0) return;
    const cleaned = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    const slice =
      cleaned.length > textBudget
        ? `${cleaned.slice(0, textBudget).trim()}…`
        : cleaned;
    textBudget -= slice.length;
    const last = blocks[blocks.length - 1];
    if (last?.type === 'text') {
      last.text = `${last.text} ${slice}`.replace(/\s+/g, ' ').trim();
    } else {
      blocks.push({ type: 'text', text: slice });
    }
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'image') {
      const src = String(node.attrs?.src || '').trim();
      if (src && imageCount < maxImages) {
        blocks.push({
          type: 'image',
          src,
          alt: String(node.attrs?.alt || '').trim(),
        });
        imageCount += 1;
      }
      return;
    }
    if (typeof node.text === 'string' && node.text) {
      pushText(node.text);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  };

  walk(content);
  return blocks;
}

/**
 * TipTap content to preview — first section with body, else first section / legacy.
 * @param {{ content?: unknown, sections?: { content?: unknown }[] } | null | undefined} doc
 */
export function docPreviewSource(doc) {
  if (!doc || typeof doc !== 'object') return null;
  if (Array.isArray(doc.sections) && doc.sections.length) {
    for (const section of doc.sections) {
      if (section?.content && docHasBody(section.content)) return section.content;
    }
    return doc.sections[0]?.content || null;
  }
  return doc.content || null;
}

/**
 * Preview blocks for a full doc (all sections, in order, until budgets fill).
 * @param {{ content?: unknown, sections?: { content?: unknown }[] } | null | undefined} doc
 * @param {{ maxText?: number, maxImages?: number }} [opts]
 */
export function docPreviewBlocksFromDoc(doc, opts = {}) {
  const maxText = opts.maxText ?? 280;
  const maxImages = opts.maxImages ?? 4;
  if (!doc || typeof doc !== 'object') return [];
  const sources =
    Array.isArray(doc.sections) && doc.sections.length
      ? doc.sections.map((s) => s?.content).filter(Boolean)
      : doc.content
        ? [doc.content]
        : [];
  /** @type {ReturnType<typeof docPreviewBlocks>} */
  const merged = [];
  let textUsed = 0;
  let imagesUsed = 0;
  for (const content of sources) {
    if (textUsed >= maxText && imagesUsed >= maxImages) break;
    const part = docPreviewBlocks(content, {
      maxText: Math.max(0, maxText - textUsed),
      maxImages: Math.max(0, maxImages - imagesUsed),
    });
    for (const block of part) {
      if (block.type === 'text') textUsed += block.text.length;
      else imagesUsed += 1;
      merged.push(block);
    }
  }
  return merged;
}

/**
 * @param {unknown} content TipTap doc JSON
 * @param {number} [maxLen=280]
 */
export function docPreviewText(content, maxLen = 280) {
  const parts = [];
  walkText(content, parts);
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

/**
 * Whether the doc has any typed content or images.
 * @param {unknown} content
 */
export function docHasBody(content) {
  const blocks = docPreviewBlocks(content, { maxText: 8, maxImages: 1 });
  return blocks.length > 0;
}
