import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { paperSizeById } from '../../data/paper/paperModel';
import { PaperSheet } from './PaperSheet';

/**
 * Print-only sheet. Copies come from the system print dialog.
 *
 * Chrome still paginates `visibility: hidden` nodes, so siblings of this
 * portal are `display: none` and the sheet is an in-flow page-size box.
 */
export function PaperPrintPortal({
  sheet,
  orientation = 'portrait',
  pageSizeId = 'letter',
}) {
  const landscape = orientation === 'landscape';
  const size = paperSizeById(pageSizeId);
  const wIn = landscape ? size.heightIn : size.widthIn;
  const hIn = landscape ? size.widthIn : size.heightIn;
  const w = `${wIn}in`;
  const h = `${hIn}in`;
  const named = ['letter', 'legal', 'tabloid', 'a4'].includes(pageSizeId);
  const pageSizeCss = named
    ? `${pageSizeId}${landscape ? ' landscape' : ''}`
    : `${wIn}in ${hIn}in`;

  useEffect(() => {
    const id = 'edu-paper-print-page';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `
@media print {
  @page { size: ${pageSizeCss}; margin: 0; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: ${w} !important;
    height: ${h} !important;
    overflow: hidden !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body > *:not(.edu-paper-print) {
    display: none !important;
  }
  .edu-paper-print {
    display: block !important;
    position: static !important;
    width: ${w} !important;
    height: ${h} !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: white !important;
  }
  .edu-paper-sheet,
  .edu-paper-sheet svg {
    display: block !important;
    width: ${w} !important;
    height: ${h} !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    page-break-after: auto !important;
    break-after: auto !important;
    page-break-inside: avoid !important;
  }
}`;
    return () => {
      el?.remove();
    };
  }, [w, h, pageSizeCss]);

  if (typeof document === 'undefined') return null;

  const stack = (
    <div className="edu-paper-print" aria-hidden="true">
      <div className="edu-paper-sheet bg-white">
        <PaperSheet sheet={sheet} width={w} height={h} className="block" />
      </div>
    </div>
  );

  return createPortal(stack, document.body);
}
