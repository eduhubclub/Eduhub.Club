import { describe, expect, it } from 'vitest';
import { buildPaperPdfBytes } from './paperPdf.js';

describe('buildPaperPdfBytes', () => {
  it('writes a PDF for lined Letter paper', async () => {
    const bytes = await buildPaperPdfBytes({
      type: 'lined',
      header: true,
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('writes a PDF at A4 when pageSize is set', async () => {
    const bytes = await buildPaperPdfBytes({
      type: 'grid',
      pageSize: 'a4',
      header: false,
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });
});
