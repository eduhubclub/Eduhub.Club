import { createDefaultAvatar } from './avatar';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result.map((s) => s.replace(/(^"|"$)/g, ''));
}

/**
 * Parse roster rows from CSV / spreadsheet text.
 * Accepts common header names (name, first/last, student name).
 */
export function parseSpreadsheetStudents(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0].toLowerCase());
  const nameColIdx = headers.findIndex(
    (h) => h === 'name' || h === 'student name' || h === 'student'
  );
  const firstColIdx = headers.findIndex((h) => h.includes('first'));
  const lastColIdx = headers.findIndex((h) => h.includes('last'));

  const hasHeaderRow =
    nameColIdx !== -1 ||
    firstColIdx !== -1 ||
    lastColIdx !== -1 ||
    headers.some((h) => h.includes('id') || h.includes('course'));
  const startIndex = hasHeaderRow ? 1 : 0;

  const parsed = [];
  const baseId = Date.now();

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    let studentName = '';

    if (firstColIdx !== -1 && lastColIdx !== -1) {
      studentName = `${cols[firstColIdx]} ${cols[lastColIdx]}`;
    } else if (nameColIdx !== -1) {
      studentName = cols[nameColIdx];
    } else {
      for (const col of cols) {
        const cleanCol = col.replace(/['"-]/g, '').trim();
        if (/^[a-zA-Z]+ [a-zA-Z]+( [a-zA-Z]+)?$/.test(cleanCol) && cleanCol.length < 30) {
          studentName = col;
          break;
        }
      }
    }

    if (!studentName?.trim() || studentName.toLowerCase().includes('undefined')) continue;

    const student = {
      id: `csv-${baseId}-${i}`,
      name: studentName.trim(),
      avatar: createDefaultAvatar(),
    };

    if (hasHeaderRow) {
      headers.forEach((h, idx) => {
        if (idx !== nameColIdx && idx !== firstColIdx && idx !== lastColIdx && cols[idx]) {
          const cleanKey = h.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
          if (cleanKey) student[cleanKey] = cols[idx].trim();
        }
      });
    }

    parsed.push(student);
  }

  return parsed;
}
