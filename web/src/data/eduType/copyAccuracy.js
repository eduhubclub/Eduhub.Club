/**
 * Compare a teacher reference passage to student writing for
 * words, punctuation, and capitalization.
 */

const WORD_RE = /[\p{L}\p{N}'’]+/gu;
const PUNCT_RE = /[^\p{L}\p{N}\s]/gu;

function clampRatio(correct, total) {
  if (total <= 0) return 1;
  return Math.round((correct / total) * 10000) / 10000;
}

/**
 * @param {string} text
 * @param {'word'|'punct'} kind
 * @returns {{ value: string, index: number }[]}
 */
export function extractTokens(text, kind) {
  const source = String(text || '');
  if (kind === 'word') {
    const out = [];
    let match;
    const scanner = new RegExp(WORD_RE.source, WORD_RE.flags);
    while ((match = scanner.exec(source))) {
      out.push({ value: match[0], index: match.index });
    }
    return out;
  }

  // Punctuation only outside word spans (keeps world's apostrophe with the word).
  const covered = new Set();
  for (const word of extractTokens(source, 'word')) {
    for (let i = 0; i < word.value.length; i += 1) {
      covered.add(word.index + i);
    }
  }
  const out = [];
  let match;
  const scanner = new RegExp(PUNCT_RE.source, PUNCT_RE.flags);
  while ((match = scanner.exec(source))) {
    if (covered.has(match.index)) continue;
    out.push({ value: match[0], index: match.index });
  }
  return out;
}

/**
 * Needleman–Wunsch-style alignment for short classroom passages.
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @param {(x: T, y: T) => boolean} equals
 * @returns {({ a: T|null, b: T|null })[]}
 */
export function alignSequences(a, b, equals) {
  const n = a.length;
  const m = b.length;
  const score = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const MOVE_DIAG = 0;
  const MOVE_UP = 1;
  const MOVE_LEFT = 2;
  const ptr = Array.from({ length: n + 1 }, () => Array(m + 1).fill(MOVE_DIAG));

  for (let i = 1; i <= n; i += 1) {
    score[i][0] = -i;
    ptr[i][0] = MOVE_UP;
  }
  for (let j = 1; j <= m; j += 1) {
    score[0][j] = -j;
    ptr[0][j] = MOVE_LEFT;
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const match = equals(a[i - 1], b[j - 1]) ? 1 : -1;
      const diag = score[i - 1][j - 1] + match;
      const up = score[i - 1][j] - 1;
      const left = score[i][j - 1] - 1;
      if (diag >= up && diag >= left) {
        score[i][j] = diag;
        ptr[i][j] = MOVE_DIAG;
      } else if (up >= left) {
        score[i][j] = up;
        ptr[i][j] = MOVE_UP;
      } else {
        score[i][j] = left;
        ptr[i][j] = MOVE_LEFT;
      }
    }
  }

  const pairs = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const move = ptr[i][j];
    if (i > 0 && j > 0 && move === MOVE_DIAG) {
      pairs.push({ a: a[i - 1], b: b[j - 1] });
      i -= 1;
      j -= 1;
    } else if (i > 0 && (j === 0 || move === MOVE_UP)) {
      pairs.push({ a: a[i - 1], b: null });
      i -= 1;
    } else {
      pairs.push({ a: null, b: b[j - 1] });
      j -= 1;
    }
  }
  pairs.reverse();
  return pairs;
}

function scoreWords(expected, student) {
  const exp = extractTokens(expected, 'word');
  const act = extractTokens(student, 'word');
  const pairs = alignSequences(
    exp,
    act,
    (x, y) => x.value.toLocaleLowerCase() === y.value.toLocaleLowerCase(),
  );
  let correct = 0;
  const total = exp.length;
  for (const pair of pairs) {
    if (
      pair.a &&
      pair.b &&
      pair.a.value.toLocaleLowerCase() === pair.b.value.toLocaleLowerCase()
    ) {
      correct += 1;
    }
  }
  return {
    correct,
    total,
    extra: Math.max(0, act.length - correct),
    ratio: clampRatio(correct, total),
    pairs,
  };
}

function scorePunctuation(expected, student) {
  const exp = extractTokens(expected, 'punct');
  const act = extractTokens(student, 'punct');
  const pairs = alignSequences(exp, act, (x, y) => x.value === y.value);
  let correct = 0;
  const total = exp.length;
  for (const pair of pairs) {
    if (pair.a && pair.b && pair.a.value === pair.b.value) correct += 1;
  }
  return {
    correct,
    total,
    extra: Math.max(0, act.length - correct),
    ratio: clampRatio(correct, total),
    pairs,
  };
}

function scoreCapitalization(wordPairs) {
  let correct = 0;
  let total = 0;
  for (const pair of wordPairs) {
    if (!pair.a || !pair.b) continue;
    if (pair.a.value.toLocaleLowerCase() !== pair.b.value.toLocaleLowerCase()) {
      continue;
    }
    const a = pair.a.value;
    const b = pair.b.value;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      if (!/\p{L}/u.test(a[i])) continue;
      total += 1;
      if (a[i] === b[i]) correct += 1;
    }
  }
  return {
    correct,
    total,
    ratio: clampRatio(correct, total),
  };
}

/**
 * Character-level alignment for a marked preview of the student text.
 * @returns {{ text: string, status: 'ok'|'wrong'|'extra'|'miss' }[]}
 */
export function buildStudentDiffSpans(expected, student) {
  const a = Array.from(String(expected || ''));
  const b = Array.from(String(student || ''));
  const pairs = alignSequences(a, b, (x, y) => x === y);
  /** @type {{ text: string, status: 'ok'|'wrong'|'extra'|'miss' }[]} */
  const spans = [];
  const push = (text, status) => {
    if (!text) return;
    const last = spans[spans.length - 1];
    if (last && last.status === status) {
      last.text += text;
      return;
    }
    spans.push({ text, status });
  };

  for (const pair of pairs) {
    if (pair.a != null && pair.b != null) {
      push(pair.b, pair.a === pair.b ? 'ok' : 'wrong');
    } else if (pair.b != null) {
      push(pair.b, 'extra');
    } else if (pair.a != null) {
      push(pair.a, 'miss');
    }
  }
  return spans;
}

/**
 * @param {string} expected Teacher reference / source doc
 * @param {string} student Student writing to check
 */
export function compareCopyAccuracy(expected, student) {
  const words = scoreWords(expected, student);
  const punctuation = scorePunctuation(expected, student);
  const capitalization = scoreCapitalization(words.pairs);
  const hasContent =
    String(expected || '').trim().length > 0 ||
    String(student || '').trim().length > 0;

  const overall =
    words.total + punctuation.total + capitalization.total <= 0
      ? hasContent
        ? 0
        : 1
      : clampRatio(
          words.correct + punctuation.correct + capitalization.correct,
          words.total + punctuation.total + capitalization.total,
        );

  const allSpans = buildStudentDiffSpans(expected, student);
  return {
    words: {
      correct: words.correct,
      total: words.total,
      extra: words.extra,
      ratio: words.ratio,
    },
    punctuation: {
      correct: punctuation.correct,
      total: punctuation.total,
      extra: punctuation.extra,
      ratio: punctuation.ratio,
    },
    capitalization: {
      correct: capitalization.correct,
      total: capitalization.total,
      ratio: capitalization.ratio,
    },
    overall,
    studentSpans: allSpans.filter((s) => s.status !== 'miss'),
    missingSpans: allSpans.filter((s) => s.status === 'miss'),
  };
}

export function formatAccuracyPercent(ratio) {
  return `${Math.round((Number(ratio) || 0) * 100)}%`;
}
