/**
 * Browser-only PDF tools for Edu.Convert (pdf-lib + pdf.js).
 * Files never leave the device.
 */

import { PDFDocument, StandardFonts, degrees as pdfDegrees, rgb, PageSizes } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { downloadBlob, zipBlobs } from './imageConvert.js';

GlobalWorkerOptions.workerSrc = pdfWorker;

export { downloadBlob, zipBlobs };

/** @typedef {'jpeg' | 'png' | 'webp'} ImageFormatId */

const IMAGE_MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const PDF_COMPRESS_PRESETS = {
  email: { id: 'email', label: 'Email', scale: 1.0, quality: 0.65 },
  classroom: { id: 'classroom', label: 'Classroom', scale: 1.25, quality: 0.75 },
  print: { id: 'print', label: 'Print', scale: 1.75, quality: 0.88 },
};

/**
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @returns {Promise<Uint8Array>}
 */
export async function toPdfBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input && typeof input.arrayBuffer === 'function') {
    return new Uint8Array(await input.arrayBuffer());
  }
  throw new Error('Expected a PDF file or bytes.');
}

/**
 * Parse 1-based page ranges like "1-3,5,8-9". Empty → all pages.
 * @param {string} text
 * @param {number} pageCount
 * @returns {number[]} 0-based indices
 */
export function parsePageRanges(text, pageCount) {
  const n = Math.max(0, Math.floor(Number(pageCount) || 0));
  if (n === 0) return [];
  const raw = String(text || '').trim();
  if (!raw) {
    return Array.from({ length: n }, (_, i) => i);
  }
  /** @type {Set<number>} */
  const set = new Set();
  for (const part of raw.split(/[,;\s]+/)) {
    if (!part) continue;
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = Number(m[1]);
      let b = Number(m[2]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error(`Invalid page range “${part}”.`);
      }
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p += 1) {
        if (p < 1 || p > n) throw new Error(`Page ${p} is out of range (1–${n}).`);
        set.add(p - 1);
      }
      continue;
    }
    if (!/^\d+$/.test(part)) throw new Error(`Invalid page “${part}”.`);
    const p = Number(part);
    if (p < 1 || p > n) throw new Error(`Page ${p} is out of range (1–${n}).`);
    set.add(p - 1);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 */
export async function getPdfPageCount(input) {
  const bytes = await toPdfBytes(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Merge PDFs in order.
 * @param {(ArrayBuffer | Uint8Array | File | Blob)[]} inputs
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, filename: string }>}
 */
export async function mergePdfs(inputs) {
  const list = Array.isArray(inputs) ? inputs.filter(Boolean) : [];
  if (list.length < 2) throw new Error('Add at least two PDFs to merge.');
  const out = await PDFDocument.create();
  for (const input of list) {
    const bytes = await toPdfBytes(input);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  const bytes = await out.save();
  return {
    bytes,
    pageCount: out.getPageCount(),
    filename: 'merged.pdf',
  };
}

/**
 * Extract selected pages into one PDF, or each page as its own PDF.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   mode?: 'extract' | 'each',
 *   ranges?: string,
 *   baseName?: string,
 * }} [options]
 */
export async function splitPdf(input, options = {}) {
  const bytes = await toPdfBytes(input);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = src.getPageCount();
  if (!count) throw new Error('That PDF has no pages.');
  const indices = parsePageRanges(options.ranges || '', count);
  if (!indices.length) throw new Error('No pages selected.');
  const base =
    String(options.baseName || 'pages')
      .replace(/\.pdf$/i, '')
      .trim() || 'pages';
  const mode = options.mode === 'each' ? 'each' : 'extract';

  if (mode === 'extract') {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    for (const page of copied) out.addPage(page);
    const outBytes = await out.save();
    return {
      mode: 'extract',
      files: [
        {
          bytes: outBytes,
          filename: `${base}-pages.pdf`,
          pageCount: out.getPageCount(),
        },
      ],
    };
  }

  /** @type {{ bytes: Uint8Array, filename: string, pageCount: number }[]} */
  const files = [];
  for (const idx of indices) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [idx]);
    out.addPage(page);
    files.push({
      bytes: await out.save(),
      filename: `${base}-page-${idx + 1}.pdf`,
      pageCount: 1,
    });
  }
  return { mode: 'each', files };
}

/**
 * Rotate selected pages by 90 / 180 / 270 (clockwise).
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{ degrees: 90 | 180 | 270, ranges?: string, baseName?: string }} options
 */
export async function rotatePdf(input, options) {
  const deg = Number(options?.degrees);
  if (![90, 180, 270].includes(deg)) {
    throw new Error('Rotation must be 90, 180, or 270 degrees.');
  }
  const bytes = await toPdfBytes(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = doc.getPageCount();
  if (!count) throw new Error('That PDF has no pages.');
  const indices = parsePageRanges(options.ranges || '', count);
  const pages = doc.getPages();
  for (const idx of indices) {
    const page = pages[idx];
    const current = page.getRotation().angle || 0;
    page.setRotation(pdfDegrees((current + deg) % 360));
  }
  const outBytes = await doc.save();
  const base =
    String(options.baseName || 'rotated')
      .replace(/\.pdf$/i, '')
      .trim() || 'rotated';
  return {
    bytes: outBytes,
    pageCount: count,
    filename: `${base}-rotated.pdf`,
  };
}

/**
 * Rebuild a PDF using an explicit 0-based page order (omit indices to delete).
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {number[]} order 0-based indices in the desired order
 * @param {{ baseName?: string }} [options]
 */
export async function reorderPdfPages(input, order, options = {}) {
  const bytes = await toPdfBytes(input);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = src.getPageCount();
  if (!count) throw new Error('That PDF has no pages.');
  const list = Array.isArray(order) ? order.map((n) => Number(n)) : [];
  if (!list.length) throw new Error('Keep at least one page.');
  for (const idx of list) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= count) {
      throw new Error(`Page index ${idx + 1} is out of range.`);
    }
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, list);
  for (const page of copied) out.addPage(page);
  const outBytes = await out.save();
  const base =
    String(options.baseName || 'edited')
      .replace(/\.pdf$/i, '')
      .trim() || 'edited';
  return {
    bytes: outBytes,
    pageCount: out.getPageCount(),
    filename: `${base}-edited.pdf`,
  };
}

/**
 * Delete pages matching a range string; keep the rest in order.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {string} ranges pages to remove (1-based)
 * @param {{ baseName?: string }} [options]
 */
export async function deletePdfPages(input, ranges, options = {}) {
  const bytes = await toPdfBytes(input);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = src.getPageCount();
  const remove = new Set(parsePageRanges(ranges, count));
  if (!remove.size) throw new Error('Choose pages to delete (e.g. 2,4-5).');
  const keep = Array.from({ length: count }, (_, i) => i).filter((i) => !remove.has(i));
  if (!keep.length) throw new Error('That would delete every page.');
  return reorderPdfPages(bytes, keep, {
    baseName: options.baseName || 'trimmed',
  });
}

/**
 * Draw page numbers on selected pages.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   position?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center',
 *   startAt?: number,
 *   fontSize?: number,
 *   ranges?: string,
 *   baseName?: string,
 * }} [options]
 */
export async function addPdfPageNumbers(input, options = {}) {
  const bytes = await toPdfBytes(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = doc.getPageCount();
  if (!count) throw new Error('That PDF has no pages.');
  const indices = parsePageRanges(options.ranges || '', count);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = Math.min(24, Math.max(8, Number(options.fontSize) || 11));
  const startAt = Number.isFinite(Number(options.startAt))
    ? Math.floor(Number(options.startAt))
    : 1;
  const position = options.position || 'bottom-center';
  const pages = doc.getPages();
  const margin = 28;

  indices.forEach((idx, i) => {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const label = String(startAt + i);
    const textW = font.widthOfTextAtSize(label, fontSize);
    let x = (width - textW) / 2;
    let y = margin;
    if (position === 'bottom-right') {
      x = width - margin - textW;
      y = margin;
    } else if (position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (position === 'top-center') {
      x = (width - textW) / 2;
      y = height - margin - fontSize;
    }
    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.25, 0.25, 0.28),
    });
  });

  const outBytes = await doc.save();
  const base =
    String(options.baseName || 'numbered')
      .replace(/\.pdf$/i, '')
      .trim() || 'numbered';
  return {
    bytes: outBytes,
    pageCount: count,
    filename: `${base}-numbered.pdf`,
  };
}

/**
 * Draw a diagonal text watermark across pages.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   text: string,
 *   opacity?: number,
 *   fontSize?: number,
 *   ranges?: string,
 *   baseName?: string,
 * }} options
 */
export async function addPdfWatermark(input, options) {
  const text = String(options?.text || '').trim();
  if (!text) throw new Error('Enter watermark text.');
  const bytes = await toPdfBytes(input);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = doc.getPageCount();
  if (!count) throw new Error('That PDF has no pages.');
  const indices = parsePageRanges(options.ranges || '', count);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const opacity = Math.min(0.6, Math.max(0.08, Number(options.opacity) || 0.22));
  const pages = doc.getPages();

  for (const idx of indices) {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const fontSize =
      Number(options.fontSize) ||
      Math.max(18, Math.min(72, Math.floor(Math.min(width, height) / 8)));
    const textW = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textW) / 2,
      y: height / 2 - fontSize / 2,
      size: fontSize,
      font,
      color: rgb(0.45, 0.45, 0.48),
      opacity,
      rotate: pdfDegrees(35),
    });
  }

  const outBytes = await doc.save();
  const base =
    String(options.baseName || 'watermarked')
      .replace(/\.pdf$/i, '')
      .trim() || 'watermarked';
  return {
    bytes: outBytes,
    pageCount: count,
    filename: `${base}-watermarked.pdf`,
  };
}

/**
 * Apply page numbers and/or watermark in one pass.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   pageNumbers?: boolean,
 *   position?: Parameters<typeof addPdfPageNumbers>[1]['position'],
 *   startAt?: number,
 *   watermark?: string,
 *   watermarkOpacity?: number,
 *   ranges?: string,
 *   baseName?: string,
 * }} [options]
 */
export async function stampPdf(input, options = {}) {
  let bytes = await toPdfBytes(input);
  const base = options.baseName || 'stamped';
  const wantNumbers = Boolean(options.pageNumbers);
  const watermark = String(options.watermark || '').trim();
  if (!wantNumbers && !watermark) {
    throw new Error('Turn on page numbers and/or enter a watermark.');
  }
  if (watermark) {
    const w = await addPdfWatermark(bytes, {
      text: watermark,
      opacity: options.watermarkOpacity,
      ranges: options.ranges,
      baseName: base,
    });
    bytes = w.bytes;
  }
  if (wantNumbers) {
    const n = await addPdfPageNumbers(bytes, {
      position: options.position,
      startAt: options.startAt,
      ranges: options.ranges,
      baseName: base,
    });
    bytes = n.bytes;
  }
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    bytes,
    pageCount: doc.getPageCount(),
    filename: `${String(base).replace(/\.pdf$/i, '') || 'stamped'}-stamped.pdf`,
  };
}

/**
 * Rasterize pages to JPEG and rebuild a smaller PDF (lossy “compress”).
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   scale?: number,
 *   quality?: number,
 *   ranges?: string,
 *   baseName?: string,
 *   preset?: keyof typeof PDF_COMPRESS_PRESETS,
 * }} [options]
 */
export async function compressPdf(input, options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('PDF compress needs a browser canvas.');
  }
  const preset = options.preset ? PDF_COMPRESS_PRESETS[options.preset] : null;
  const scale = Math.min(
    3,
    Math.max(0.4, Number(options.scale) || preset?.scale || 1.2),
  );
  const quality = Math.min(
    1,
    Math.max(0.3, Number(options.quality) || preset?.quality || 0.72),
  );
  const srcBytes = await toPdfBytes(input);
  const rendered = await pdfToImages(srcBytes, {
    format: 'jpeg',
    quality,
    scale,
    ranges: options.ranges,
    baseName: 'page',
  });

  const doc = await PDFDocument.create();
  for (const img of rendered.images) {
    const jpg = await doc.embedJpg(new Uint8Array(await img.blob.arrayBuffer()));
    const page = doc.addPage([jpg.width, jpg.height]);
    page.drawImage(jpg, {
      x: 0,
      y: 0,
      width: jpg.width,
      height: jpg.height,
    });
  }
  const outBytes = await doc.save();
  const base =
    String(options.baseName || 'compressed')
      .replace(/\.pdf$/i, '')
      .trim() || 'compressed';
  return {
    bytes: outBytes,
    pageCount: doc.getPageCount(),
    filename: `${base}-compressed.pdf`,
    originalBytes: srcBytes.byteLength,
    outputBytes: outBytes.byteLength,
  };
}

/**
 * Render PDF pages to image blobs via pdf.js + canvas.
 * @param {ArrayBuffer | Uint8Array | File | Blob} input
 * @param {{
 *   format?: ImageFormatId,
 *   quality?: number,
 *   scale?: number,
 *   ranges?: string,
 *   baseName?: string,
 * }} [options]
 */
export async function pdfToImages(input, options = {}) {
  const bytes = await toPdfBytes(input);
  const format = options.format && IMAGE_MIME[options.format] ? options.format : 'jpeg';
  const mime = IMAGE_MIME[format];
  const quality =
    format === 'png'
      ? undefined
      : Math.min(1, Math.max(0.05, Number(options.quality) || 0.85));
  const scale = Math.min(3, Math.max(0.5, Number(options.scale) || 1.5));
  const base =
    String(options.baseName || 'page')
      .replace(/\.pdf$/i, '')
      .trim() || 'page';
  const ext = format === 'jpeg' ? 'jpg' : format;

  if (typeof document === 'undefined') {
    throw new Error('PDF → images needs a browser canvas.');
  }

  const loadingTask = getDocument({
    data: bytes,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const indices = parsePageRanges(options.ranges || '', pdf.numPages);
  if (!indices.length) throw new Error('No pages selected.');

  /** @type {{ blob: Blob, filename: string, page: number, width: number, height: number }[]} */
  const images = [];
  for (const idx of indices) {
    const page = await pdf.getPage(idx + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create a drawing surface.');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Could not encode page image.'))),
        mime,
        quality,
      );
    });
    images.push({
      blob,
      filename: `${base}-page-${idx + 1}.${ext}`,
      page: idx + 1,
      width: canvas.width,
      height: canvas.height,
    });
  }
  return { images, pageCount: pdf.numPages };
}

/**
 * Build a PDF from image files (one page each, letter-sized fit).
 * @param {(File | Blob)[]} files
 * @param {{ baseName?: string, pageSize?: [number, number] }} [options]
 */
export async function imagesToPdf(files, options = {}) {
  const list = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!list.length) throw new Error('Add at least one image.');
  const doc = await PDFDocument.create();
  const pageSize = options.pageSize || PageSizes.Letter;
  const [pageW, pageH] = pageSize;

  for (const file of list) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    let image;
    if (type.includes('png') || name.endsWith('.png')) {
      image = await doc.embedPng(bytes);
    } else if (
      type.includes('jpeg') ||
      type.includes('jpg') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg')
    ) {
      image = await doc.embedJpg(bytes);
    } else {
      // Try JPG then PNG for unknown types (e.g. WEBP fails — convert first).
      try {
        image = await doc.embedJpg(bytes);
      } catch {
        try {
          image = await doc.embedPng(bytes);
        } catch {
          throw new Error(
            `“${file.name || 'Image'}” must be JPG or PNG. Convert WEBP in Images first.`,
          );
        }
      }
    }

    const page = doc.addPage([pageW, pageH]);
    const margin = 36;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: (pageW - w) / 2,
      y: (pageH - h) / 2,
      width: w,
      height: h,
    });
  }

  const outBytes = await doc.save();
  const base =
    String(options.baseName || 'images')
      .replace(/\.pdf$/i, '')
      .trim() || 'images';
  return {
    bytes: outBytes,
    pageCount: doc.getPageCount(),
    filename: `${base}.pdf`,
  };
}

/**
 * @param {Uint8Array} bytes
 * @param {string} filename
 */
export function downloadPdfBytes(bytes, filename) {
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), filename || 'document.pdf');
}

/**
 * Download one PDF or a ZIP of many.
 * @param {{ bytes: Uint8Array, filename: string }[]} files
 * @param {string} [zipName]
 */
export async function downloadPdfFiles(files, zipName = 'edu-convert-pdfs.zip') {
  const list = Array.isArray(files) ? files.filter((f) => f?.bytes) : [];
  if (!list.length) throw new Error('Nothing to download.');
  if (list.length === 1) {
    downloadPdfBytes(list[0].bytes, list[0].filename);
    return;
  }
  const zip = await zipBlobs(
    list.map((f) => ({
      name: f.filename,
      blob: new Blob([f.bytes], { type: 'application/pdf' }),
    })),
  );
  downloadBlob(zip, zipName);
}
