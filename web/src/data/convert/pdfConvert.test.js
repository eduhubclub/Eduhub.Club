import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  parsePageRanges,
  mergePdfs,
  splitPdf,
  rotatePdf,
  reorderPdfPages,
  deletePdfPages,
  addPdfPageNumbers,
  addPdfWatermark,
  stampPdf,
  imagesToPdf,
  getPdfPageCount,
} from './pdfConvert.js';

async function makePdf(pageCount = 1) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) {
    doc.addPage([200, 200]);
  }
  return doc.save();
}

/** Tiny 1×1 PNG */
function tinyPngBytes() {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

describe('parsePageRanges', () => {
  it('returns all pages when empty', () => {
    expect(parsePageRanges('', 4)).toEqual([0, 1, 2, 3]);
  });

  it('parses singles and ranges (1-based → 0-based)', () => {
    expect(parsePageRanges('1,3-4', 5)).toEqual([0, 2, 3]);
    expect(parsePageRanges('4-2', 5)).toEqual([1, 2, 3]);
  });

  it('rejects out-of-range pages', () => {
    expect(() => parsePageRanges('9', 3)).toThrow(/out of range/);
  });
});

describe('mergePdfs', () => {
  it('concatenates pages from multiple PDFs', async () => {
    const a = await makePdf(2);
    const b = await makePdf(1);
    const merged = await mergePdfs([a, b]);
    expect(merged.pageCount).toBe(3);
    expect(merged.filename).toBe('merged.pdf');
    expect(String.fromCharCode(...merged.bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('requires at least two PDFs', async () => {
    await expect(mergePdfs([await makePdf(1)])).rejects.toThrow(/two/);
  });
});

describe('splitPdf', () => {
  it('extracts a page range into one PDF', async () => {
    const src = await makePdf(4);
    const result = await splitPdf(src, { mode: 'extract', ranges: '2-3', baseName: 'unit' });
    expect(result.files).toHaveLength(1);
    expect(result.files[0].pageCount).toBe(2);
    expect(result.files[0].filename).toBe('unit-pages.pdf');
  });

  it('splits each page into its own PDF', async () => {
    const src = await makePdf(3);
    const result = await splitPdf(src, { mode: 'each', ranges: '1,3', baseName: 'doc' });
    expect(result.files).toHaveLength(2);
    expect(result.files[0].filename).toBe('doc-page-1.pdf');
    expect(result.files[1].filename).toBe('doc-page-3.pdf');
  });
});

describe('rotatePdf', () => {
  it('rotates selected pages and keeps page count', async () => {
    const src = await makePdf(2);
    const out = await rotatePdf(src, { degrees: 90, ranges: '1', baseName: 'hw' });
    expect(out.pageCount).toBe(2);
    expect(out.filename).toBe('hw-rotated.pdf');
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
  });
});

describe('reorder and delete', () => {
  it('reorders pages', async () => {
    const src = await makePdf(3);
    const out = await reorderPdfPages(src, [2, 0, 1], { baseName: 'unit' });
    expect(out.pageCount).toBe(3);
    expect(out.filename).toBe('unit-edited.pdf');
  });

  it('deletes pages by range', async () => {
    const src = await makePdf(4);
    const out = await deletePdfPages(src, '2,4', { baseName: 'trim' });
    expect(out.pageCount).toBe(2);
  });
});

describe('stamp helpers', () => {
  it('adds page numbers', async () => {
    const src = await makePdf(2);
    const out = await addPdfPageNumbers(src, { startAt: 5, baseName: 'hw' });
    expect(out.pageCount).toBe(2);
    expect(out.filename).toBe('hw-numbered.pdf');
  });

  it('adds a watermark', async () => {
    const src = await makePdf(1);
    const out = await addPdfWatermark(src, { text: 'DRAFT', baseName: 'hw' });
    expect(out.filename).toBe('hw-watermarked.pdf');
  });

  it('stamps numbers and watermark together', async () => {
    const src = await makePdf(2);
    const out = await stampPdf(src, {
      pageNumbers: true,
      watermark: 'CLASS ONLY',
      baseName: 'packet',
    });
    expect(out.pageCount).toBe(2);
    expect(out.filename).toContain('stamped');
  });
});

describe('getPdfPageCount', () => {
  it('counts pages', async () => {
    expect(await getPdfPageCount(await makePdf(5))).toBe(5);
  });
});

describe('imagesToPdf', () => {
  it('embeds PNG pages into a PDF', async () => {
    const file = new File([tinyPngBytes()], 'dot.png', { type: 'image/png' });
    const out = await imagesToPdf([file], { baseName: 'photos' });
    expect(out.pageCount).toBe(1);
    expect(out.filename).toBe('photos.pdf');
    expect(String.fromCharCode(...out.bytes.slice(0, 5))).toBe('%PDF-');
  });
});
