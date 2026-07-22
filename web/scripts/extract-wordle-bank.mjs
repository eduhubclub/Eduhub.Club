import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloads = path.join(
  process.env.USERPROFILE,
  'OneDrive - Tahoma School District',
  'Downloads',
);

const files = [
  { key: 'fry', file: 'fry_complete_1000.pdf' },
  { key: 'dolch', file: 'Copy of Dolch-Words-Flash-Cards.pdf' },
  { key: 'heart', file: 'Copy of Heart-Words.pdf' },
  { key: 'irregular', file: 'Copy of Irregular-Words-Flash-Cards.pdf' },
];

function extractWords(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words = [];
  for (const line of lines) {
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;
    if (/^list\s+\d+$/i.test(line)) continue;
    if (/fry words/i.test(line)) continue;
    if (/copyright/i.test(line)) continue;
    if (/k12reader/i.test(line)) continue;
    if (/dolch words/i.test(line)) continue;
    if (/flash cards/i.test(line)) continue;
    if (/pre-?primer/i.test(line)) continue;
    if (/^(primer|first grade|second grade|third grade)$/i.test(line)) continue;
    if (/irregular/i.test(line) && line.length > 20) continue;
    if (/heart.?words/i.test(line) && line.length > 15) continue;
    if (line.length > 24) continue;
    if (!/^[A-Za-z][A-Za-z']*$/.test(line)) continue;
    const clean = line.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length < 2 || clean.length > 8) continue;
    words.push(clean);
  }
  return words;
}

async function pdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const result = await parser.getText();
    return result?.text || '';
  } finally {
    await parser.destroy?.();
  }
}

const bySource = {};
const all = new Set();

for (const { key, file } of files) {
  const text = await pdfText(path.join(downloads, file));
  const words = extractWords(text);
  bySource[key] = [...new Set(words)].sort();
  for (const w of bySource[key]) all.add(w);
}

const byLength = {};
for (let n = 2; n <= 8; n++) byLength[n] = [];
for (const w of [...all].sort()) {
  if (byLength[w.length]) byLength[w.length].push(w);
}

const outDir = path.join(__dirname, '..', 'src', 'apps', 'games', 'wordle');
fs.mkdirSync(outDir, { recursive: true });

const meta = {
  generatedAt: new Date().toISOString(),
  sources: Object.fromEntries(Object.entries(bySource).map(([k, v]) => [k, v.length])),
  totalUnique: all.size,
  byLengthCounts: Object.fromEntries(
    Object.entries(byLength).map(([k, v]) => [k, v.length]),
  ),
};

const heartWords = [
  ...new Set([...(bySource.heart || []), ...(bySource.irregular || [])]),
].sort();
const highFrequency = [
  ...new Set([...(bySource.fry || []), ...(bySource.dolch || [])]),
].sort();

const fileBody = `/** Auto-generated high-frequency + heart/irregular word bank for Wordle (2–8 letters). */
export const WORD_BANK_META = ${JSON.stringify(meta, null, 2)};

/** Words grouped by length (lowercase, a–z only). */
export const WORDS_BY_LENGTH = ${JSON.stringify(byLength, null, 2)};

/** Heart / irregular words (subset). */
export const HEART_WORDS = new Set(${JSON.stringify(heartWords)});

/** Fry + Dolch high-frequency words. */
export const HIGH_FREQUENCY_WORDS = new Set(${JSON.stringify(highFrequency)});

export function wordsForLength(len) {
  return WORDS_BY_LENGTH[len] || [];
}

export function pickRandomWord(len) {
  const list = wordsForLength(len);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
`;

fs.writeFileSync(path.join(outDir, 'wordBank.js'), fileBody);
console.log(JSON.stringify(meta, null, 2));
console.log('sample5', byLength[5]?.slice(0, 20));
