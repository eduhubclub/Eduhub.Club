import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fileBase(run) {
  const parts = [run.schoolName || 'school', run.gradeBand || 'band', 'draft']
    .join('-')
    .replace(/[^\w.-]+/g, '_')
    .toLowerCase();
  return parts || 'class-creator-draft';
}

function runSubtitle(run) {
  return [run.schoolName, run.gradeBand === 'k6' ? 'K–6' : 'K–5', run.yearLabel]
    .filter(Boolean)
    .join(' · ');
}

/** PNG roster card via canvas (no html2canvas dependency). */
export async function downloadDraftPng(run) {
  const teachers = run.destinationTeachers || [];
  const colW = 280;
  const pad = 24;
  const rowH = 18;
  const headerH = 72;
  const cols = Math.min(3, Math.max(1, teachers.length));
  const rows = Math.ceil(teachers.length / cols) || 1;
  let maxList = 1;
  for (const teacher of teachers) {
    maxList = Math.max(maxList, (run.draftClasses?.[teacher.id] || []).length);
  }
  const cardH = 48 + maxList * rowH + 16;
  const width = pad * 2 + cols * colW + (cols - 1) * 16;
  const height = pad * 2 + headerH + rows * (cardH + 16);

  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Class Creator draft', pad, pad + 22);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(runSubtitle(run), pad, pad + 44);

  teachers.forEach((teacher, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = pad + col * (colW + 16);
    const y = pad + headerH + row * (cardH + 16);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, colW, cardH);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    const ids = run.draftClasses?.[teacher.id] || [];
    ctx.fillText(
      `${teacher.name}${teacher.destinationGrade ? ` · ${teacher.destinationGrade}` : ''}${
        teacher.isProvisional ? ' (Open)' : ''
      } (${ids.length})`,
      x + 12,
      y + 24,
    );
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#334155';
    ids.forEach((id, i) => {
      ctx.fillText(run.students[id]?.name || id, x + 12, y + 48 + i * rowH);
    });
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob) downloadBlob(blob, `${fileBase(run)}.png`);
}

/** Multi-page PDF of draft class lists. */
export async function downloadDraftPdf(run) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (need) => {
    if (y - need < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const draw = (text, size, bold = false) => {
    ensureSpace(size + 8);
    page.drawText(String(text || ''), {
      x: margin,
      y: y - size,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.05, 0.08, 0.15),
    });
    y -= size + 6;
  };

  draw('Class Creator draft', 18, true);
  draw(runSubtitle(run), 11);
  y -= 8;

  for (const teacher of run.destinationTeachers || []) {
    const ids = run.draftClasses?.[teacher.id] || [];
    ensureSpace(40 + ids.length * 14);
    draw(
      `${teacher.name}${teacher.destinationGrade ? ` · ${teacher.destinationGrade}` : ''}${
        teacher.isProvisional ? ' (Open)' : ''
      } — ${ids.length}`,
      13,
      true,
    );
    for (const id of ids) {
      draw(`  ${run.students[id]?.name || id}`, 11);
    }
    y -= 6;
  }

  if (run.unassigned?.length) {
    draw(`Unassigned — ${run.unassigned.length}`, 13, true);
    for (const id of run.unassigned) {
      draw(`  ${run.students[id]?.name || id}`, 11);
    }
  }

  const bytes = await pdf.save();
  downloadBlob(
    new Blob([bytes], { type: 'application/pdf' }),
    `${fileBase(run)}.pdf`,
  );
}
