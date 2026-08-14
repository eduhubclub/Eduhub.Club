/**
 * Vector PDF export for Edu.Paper sheets.
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { hexToRgb01 } from './paperModel';
import { buildPaperSheet } from './paperGeometry';

function color(hex) {
  const { r, g, b } = hexToRgb01(hex);
  return rgb(r, g, b);
}

function drawPrimitive(page, height, p) {
  const flipY = (y) => height - y;
  const stroke = color(p.stroke || p.fill || '#334155');
  const borderWidth = p.width || 0.8;

  if (p.kind === 'line') {
    page.drawLine({
      start: { x: p.x1, y: flipY(p.y1) },
      end: { x: p.x2, y: flipY(p.y2) },
      thickness: borderWidth,
      color: stroke,
      ...(p.dash ? { dashArray: p.dash } : {}),
      ...(p.opacity != null ? { opacity: p.opacity } : {}),
    });
    return;
  }
  if (p.kind === 'circle') {
    page.drawCircle({
      x: p.cx,
      y: flipY(p.cy),
      size: p.r,
      color: color(p.fill || p.stroke || '#334155'),
    });
    return;
  }
  if (p.kind === 'rect') {
    const hasStroke = p.stroke && p.stroke !== 'none' && (p.width || 0) > 0;
    page.drawRectangle({
      x: p.x,
      y: flipY(p.y + p.h),
      width: p.w,
      height: p.h,
      ...(p.fill ? { color: color(p.fill) } : {}),
      ...(hasStroke
        ? { borderColor: stroke, borderWidth: p.width || 0.8 }
        : {}),
    });
    return;
  }
  if (p.kind === 'path') {
    page.drawSvgPath(p.d, {
      borderColor: stroke,
      borderWidth,
    });
    return;
  }
  if (p.kind === 'text') {
    const size = p.size || 9;
    const label = String(p.text || '');
    const approxW = label.length * size * 0.55;
    let x = p.x;
    if (p.anchor === 'end') x = p.x - approxW;
    else if (p.anchor === 'middle') x = p.x - approxW / 2;
    page.drawText(label, {
      x,
      y: flipY(p.y),
      size,
      color: color(p.fill || '#334155'),
    });
  }
}

export async function buildPaperPdfBytes(settings) {
  const sheet = buildPaperSheet(settings);
  const doc = await PDFDocument.create();
  const page = doc.addPage([sheet.width, sheet.height]);
  for (const p of sheet.primitives) {
    drawPrimitive(page, sheet.height, p);
  }
  return doc.save();
}

export async function downloadPaperPdf(settings, filename) {
  const bytes = await buildPaperPdfBytes(settings);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'edu-paper.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
