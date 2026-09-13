/**
 * PDF → deck: each page becomes a 16:9 background image slide.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { importDeckFromSlides } from './storage';

GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * @param {ArrayBuffer} data
 * @param {string} [name]
 */
export async function importPdfDeck(data, name = 'Imported PDF') {
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const slides = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1280 / viewport.width, 720 / viewport.height);
    const vp = page.getViewport({ scale: Math.max(Math.min(scale, 1.6), 0.4) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    slides.push({
      notes: '',
      background: {
        color: '#ffffff',
        imageUrl: canvas.toDataURL('image/jpeg', 0.72),
      },
      objects: [],
    });
  }
  if (!slides.length) throw new Error('That PDF has no pages we could read.');
  return importDeckFromSlides(name.replace(/\.pdf$/i, '') || 'Imported PDF', slides);
}
