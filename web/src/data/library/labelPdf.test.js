import { describe, expect, it } from 'vitest';
import { buildLibraryLabelPayload, makeShortCode } from './labelPayload';
import { buildLibraryLabelsPdfBytes } from './labelPdf';

describe('library label PDF', () => {
  it('builds a PDF with a scannable copy label', async () => {
    const copy = {
      id: 'copy-1',
      titleId: 'title-1',
      copyNumber: 1,
      shortCode: makeShortCode('copy-1'),
      labelCode: buildLibraryLabelPayload('copy-1', 'LIB-TEST'),
    };
    const bytes = await buildLibraryLabelsPdfBytes([copy], {
      'title-1': { title: 'Frog and Toad Are Friends' },
    });
    const head = String.fromCharCode(...bytes.slice(0, 5));
    expect(head).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(500);
  });
});
