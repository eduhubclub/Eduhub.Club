import { normalizeLookup } from './spellingBank';

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
  return result.map((s) => s.replace(/(^"|"$)/g, '').trim());
}

/**
 * Parse pasted text or CSV into dictionary word entries.
 * Supports:
 * - one word per line
 * - comma-separated words
 * - CSV with word / note / definition headers
 *
 * @param {string} text
 * @returns {{ word: string, note: string, definition: string | null }[]}
 */
export function parseDictionaryWords(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (!lines.length) return [];

  const firstCols = parseCSVLine(lines[0]).map((c) => c.toLowerCase());
  const wordIdx = firstCols.findIndex(
    (h) => h === 'word' || h === 'words' || h === 'term' || h === 'vocabulary',
  );
  const noteIdx = firstCols.findIndex(
    (h) => h === 'note' || h === 'notes' || h === 'teacher note' || h === 'teacher_note',
  );
  const defIdx = firstCols.findIndex(
    (h) => h === 'definition' || h === 'meaning' || h === 'def',
  );
  const hasHeader = wordIdx >= 0;

  /** @type {{ word: string, note: string, definition: string | null }[]} */
  const entries = [];
  const seen = new Set();

  const push = (wordRaw, note = '', definition = null) => {
    const word = normalizeLookup(wordRaw);
    if (!word || seen.has(word) || /^\d+$/.test(word)) return;
    seen.add(word);
    entries.push({
      word,
      note: String(note || '').trim(),
      definition: definition ? String(definition).trim() : null,
    });
  };

  if (hasHeader) {
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      push(
        cols[wordIdx] || '',
        noteIdx >= 0 ? cols[noteIdx] || '' : '',
        defIdx >= 0 ? cols[defIdx] || null : null,
      );
    }
    return entries;
  }

  for (const line of lines) {
    for (const cell of parseCSVLine(line)) {
      push(cell);
    }
  }
  return entries;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {{ word?: string, partOfSpeech?: string | null, pronunciation?: string | null, definition?: string | null, note?: string }[]} words
 */
export function dictionaryEntriesToCsv(words) {
  const rows = [
    ['word', 'partOfSpeech', 'pronunciation', 'definition', 'note'].join(','),
  ];
  for (const entry of words || []) {
    const word = normalizeLookup(entry?.word);
    if (!word) continue;
    rows.push(
      [
        csvEscape(word),
        csvEscape(entry.partOfSpeech || ''),
        csvEscape(entry.pronunciation || ''),
        csvEscape(entry.definition || ''),
        csvEscape(entry.note || ''),
      ].join(','),
    );
  }
  return `${rows.join('\n')}\n`;
}
