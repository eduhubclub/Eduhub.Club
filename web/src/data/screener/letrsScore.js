import { gridFor } from './letrsBank';

function scoreCell(cell, target, answer) {
  const ans = String(answer || '').trim().toLowerCase();
  const tgt = String(target || '').toLowerCase();
  if (cell.kind === 'word') return ans === tgt;
  if (ans === tgt) return true;
  if (!ans) return false;
  return cell.re ? cell.re.test(ans) : false;
}

/**
 * Score a finished LETRS spelling list.
 * A whole word match marks every feature in that column correct.
 * Pattern rows under 80% become instructional targets.
 *
 * @param {string[]} answers
 * @param {'basic' | 'advanced'} level
 */
export function scoreLetrs(answers, level) {
  const grid = gridFor(level);
  const words = grid.words;
  const ansList = words.map((_, i) =>
    answers && answers[i] != null ? String(answers[i]) : '',
  );

  const featureResults = grid.features.map((feat) => {
    let earned = 0;
    /** @type {Record<number, { label: string, ok: boolean, kind: string }[]>} */
    const byWord = {};
    feat.cells.forEach((cell) => {
      const ok = scoreCell(cell, words[cell.w], ansList[cell.w]);
      if (ok) earned += 1;
      if (!byWord[cell.w]) byWord[cell.w] = [];
      byWord[cell.w].push({
        label: cell.label,
        ok,
        kind: cell.kind || 'feature',
      });
    });
    return { name: feat.name, max: feat.max, earned, byWord };
  });

  let wordsCorrect = 0;
  const wordRows = words.map((word, idx) => {
    const answer = String(ansList[idx] || '').trim();
    const correct = answer.toLowerCase() === word;
    if (correct) wordsCorrect += 1;
    return { target: word, answer, correct };
  });

  let featurePoints = 0;
  let featurePossible = 0;
  /** @type {Record<string, { earned: number, possible: number }>} */
  const categoryScores = {};
  const concerns = [];

  featureResults.forEach((row) => {
    if (row.name === 'Word Correct') return;
    featurePoints += row.earned;
    featurePossible += row.max;
    categoryScores[row.name] = { earned: row.earned, possible: row.max };
    const pct = row.max ? (row.earned / row.max) * 100 : 100;
    if (pct < 80) {
      concerns.push({
        name: row.name,
        earned: row.earned,
        max: row.max,
        pct: Math.round(pct),
      });
    }
  });

  return {
    level: level === 'advanced' ? 'advanced' : 'basic',
    words,
    featureResults,
    wordsCorrect,
    wordsTotal: words.length,
    grandEarned: wordsCorrect + featurePoints,
    grandMax: words.length + featurePossible,
    concerns,
    categoryScores,
    wordRows,
  };
}
