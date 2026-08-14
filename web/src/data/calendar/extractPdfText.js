/**
 * Browser-side PDF text extraction (pdf.js).
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * @param {ArrayBuffer|Uint8Array} data
 * @returns {Promise<string>}
 */
export async function extractPdfText(data) {
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
  });
  const pdf = await loadingTask.promise;
  const parts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let pageText = '';
    let lastY = null;
    for (const item of content.items) {
      if (!item || typeof item.str !== 'string' || !item.str) continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY != null && y != null && Math.abs(lastY - y) > 2) {
        pageText += '\n';
      } else if (
        pageText &&
        !pageText.endsWith('\n') &&
        !pageText.endsWith(' ')
      ) {
        pageText += ' ';
      }
      pageText += item.str;
      if (y != null) lastY = y;
    }
    parts.push(pageText);
  }
  return parts.join('\n\n');
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractPdfTextFromFile(file) {
  const buf = await file.arrayBuffer();
  return extractPdfText(new Uint8Array(buf));
}
