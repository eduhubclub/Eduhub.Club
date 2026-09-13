/**
 * Letter-size PDF of unique library copy QR stickers.
 * Avoids window.print() in the app chrome (crashes some embedded browsers).
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { encode } from 'uqr';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 36;
const COLS = 3;
const ROWS = 4;
const GAP = 10;
const INK = rgb(0.09, 0.12, 0.16);
const MUTED = rgb(0.39, 0.45, 0.55);

function pdfSafe(text) {
  return String(text || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[^\t\n\r\x20-\x7E]/g, '');
}

function qrAt(text) {
  const qr = encode(String(text || ''), { ecc: 'M', border: 1 });
  const size = Number(qr.size) || 0;
  const data = qr.data;
  const at = (x, y) => {
    if (!size || x < 0 || y < 0 || x >= size || y >= size) return false;
    if (Array.isArray(data?.[0])) return Boolean(data[y][x]);
    return Boolean(data[y * size + x]);
  };
  return { size, at };
}

function drawQr(page, text, x, y, dim) {
  const { size, at } = qrAt(text);
  if (size < 8) return;
  const module = dim / size;
  page.drawRectangle({
    x,
    y,
    width: dim,
    height: dim,
    color: rgb(1, 1, 1),
  });
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!at(col, row)) continue;
      page.drawRectangle({
        x: x + col * module,
        y: y + (size - 1 - row) * module,
        width: module,
        height: module,
        color: rgb(0, 0, 0),
      });
    }
  }
}

/**
 * @param {Array<{ id: string, labelCode?: string, shortCode?: string, copyNumber?: number, titleId?: string }>} copies
 * @param {Record<string, { title?: string }>} titleById
 */
export async function buildLibraryLabelsPdfBytes(copies, titleById = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const perPage = COLS * ROWS;
  const cellW = (PAGE_W - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
  const cellH = (PAGE_H - MARGIN * 2 - 72 - GAP * (ROWS - 1)) / ROWS;
  const list = Array.isArray(copies) ? copies : [];
  const pages = Math.max(1, Math.ceil(list.length / perPage) || 1);

  for (let p = 0; p < pages; p += 1) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    const printed = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    page.drawText('Library copy labels', {
      x: MARGIN,
      y: PAGE_H - MARGIN - 16,
      size: 16,
      font: fontBold,
      color: INK,
    });
    page.drawText(
      pdfSafe(
        `${list.length} label${list.length === 1 ? '' : 's'} · Printed ${printed}`,
      ),
      {
        x: MARGIN,
        y: PAGE_H - MARGIN - 32,
        size: 9,
        font,
        color: MUTED,
      },
    );
    page.drawText(
      'Stick one label inside each book. Checkout scans this QR, not the publisher ISBN.',
      {
        x: MARGIN,
        y: PAGE_H - MARGIN - 46,
        size: 8,
        font,
        color: MUTED,
      },
    );

    const slice = list.slice(p * perPage, p * perPage + perPage);
    slice.forEach((copy, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = MARGIN + col * (cellW + GAP);
      const y = PAGE_H - MARGIN - 62 - (row + 1) * cellH - row * GAP;
      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        borderColor: rgb(0.8, 0.83, 0.86),
        borderWidth: 1,
      });
      const qrSize = Math.min(cellW - 24, cellH - 48);
      const qrX = x + (cellW - qrSize) / 2;
      const qrY = y + cellH - 12 - qrSize;
      drawQr(page, copy.labelCode || copy.shortCode || copy.id, qrX, qrY, qrSize);

      const title = pdfSafe(titleById[copy.titleId]?.title || 'Book');
      const code = pdfSafe(copy.shortCode || '');
      const copyLine = `Copy ${copy.copyNumber || ''}`;
      page.drawText(code, {
        x: x + 8,
        y: y + 28,
        size: 9,
        font: fontBold,
        color: INK,
      });
      page.drawText(title.length > 28 ? `${title.slice(0, 26)}...` : title, {
        x: x + 8,
        y: y + 16,
        size: 8,
        font,
        color: INK,
      });
      page.drawText(copyLine, {
        x: x + 8,
        y: y + 6,
        size: 8,
        font,
        color: MUTED,
      });
    });
  }

  return doc.save();
}

export async function downloadLibraryLabelsPdf(copies, titleById = {}) {
  const bytes = await buildLibraryLabelsPdfBytes(copies, titleById);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'library-labels.pdf';
  a.rel = 'noopener';
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
