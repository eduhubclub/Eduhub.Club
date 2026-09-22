/**
 * Sudoku — generate unique puzzles, edit cells / notes, hints, conflict check.
 */

export const SIZE = 9;
export const BOX = 3;

/** Clue counts by difficulty (more clues = easier). */
export const DIFFICULTY = {
  easy: { id: 'easy', label: 'Easy', clues: 40 },
  medium: { id: 'medium', label: 'Medium', clues: 32 },
  hard: { id: 'hard', label: 'Hard', clues: 26 },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

function emptyGrid(fill = 0) {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(fill));
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function shuffle(list, rng) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function digitBit(n) {
  return 1 << (n - 1);
}

export function hasNote(mask, n) {
  return n >= 1 && n <= 9 && (mask & digitBit(n)) !== 0;
}

export function toggleNoteBit(mask, n) {
  if (n < 1 || n > 9) return mask;
  return mask ^ digitBit(n);
}

/** True if `n` can sit at (r,c) without row/col/box clash (ignores that cell). */
export function isValidPlacement(board, r, c, n) {
  if (n < 1 || n > 9) return false;
  for (let i = 0; i < SIZE; i += 1) {
    if (i !== c && board[r][i] === n) return false;
    if (i !== r && board[i][c] === n) return false;
  }
  const br = Math.floor(r / BOX) * BOX;
  const bc = Math.floor(c / BOX) * BOX;
  for (let rr = br; rr < br + BOX; rr += 1) {
    for (let cc = bc; cc < bc + BOX; cc += 1) {
      if ((rr !== r || cc !== c) && board[rr][cc] === n) return false;
    }
  }
  return true;
}

function findEmpty(board) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] === 0) return { r, c };
    }
  }
  return null;
}

/**
 * Mutates `board` to a solved grid. Returns false if unsolvable.
 * @param {number[][]} board
 * @param {() => number} [rng]
 */
export function solveBoard(board, rng = Math.random) {
  const empty = findEmpty(board);
  if (!empty) return true;
  const { r, c } = empty;
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  for (const n of nums) {
    if (!isValidPlacement(board, r, c, n)) continue;
    board[r][c] = n;
    if (solveBoard(board, rng)) return true;
    board[r][c] = 0;
  }
  return false;
}

/**
 * Count solutions up to `limit` (default 2). Does not mutate the input.
 * @param {number[][]} board
 * @param {number} [limit]
 */
export function countSolutions(board, limit = 2) {
  const work = cloneGrid(board);
  let count = 0;

  function dfs() {
    if (count >= limit) return;
    const empty = findEmpty(work);
    if (!empty) {
      count += 1;
      return;
    }
    const { r, c } = empty;
    for (let n = 1; n <= 9; n += 1) {
      if (!isValidPlacement(work, r, c, n)) continue;
      work[r][c] = n;
      dfs();
      work[r][c] = 0;
      if (count >= limit) return;
    }
  }

  dfs();
  return count;
}

/** Full valid solution grid. */
export function generateCompleteBoard(rng = Math.random) {
  const board = emptyGrid(0);
  solveBoard(board, rng);
  return board;
}

/**
 * Remove cells until `clues` remain, keeping a unique solution.
 * @param {number[][]} solution
 * @param {number} clues
 * @param {() => number} [rng]
 */
export function carvePuzzle(solution, clues, rng = Math.random) {
  const puzzle = cloneGrid(solution);
  const cells = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => ({
      r: Math.floor(i / SIZE),
      c: i % SIZE,
    })),
    rng,
  );

  let filled = SIZE * SIZE;
  const target = Math.max(17, Math.min(SIZE * SIZE, clues));

  for (const { r, c } of cells) {
    if (filled <= target) break;
    const keep = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2) === 1) {
      filled -= 1;
    } else {
      puzzle[r][c] = keep;
    }
  }

  return puzzle;
}

/**
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {() => number} [rng]
 */
export function createPuzzle(difficulty = 'easy', rng = Math.random) {
  const spec = DIFFICULTY[difficulty] ?? DIFFICULTY.easy;
  const solution = generateCompleteBoard(rng);
  const puzzle = carvePuzzle(solution, spec.clues, rng);
  return { puzzle, solution, difficulty: spec.id };
}

function emptyNotes() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cellKey(r, c) {
  return `${r},${c}`;
}

/** Cells that clash with another same digit in row, col, or box. */
export function findConflicts(board) {
  const bad = new Set();
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const n = board[r][c];
      if (n === 0) continue;
      if (!isValidPlacement(board, r, c, n)) bad.add(cellKey(r, c));
    }
  }
  return bad;
}

export function isBoardComplete(board, solution) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function clueCount(puzzle) {
  let n = 0;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (puzzle[r][c] !== 0) n += 1;
    }
  }
  return n;
}

/**
 * @param {'easy'|'medium'|'hard'} [difficulty]
 * @param {() => number} [rng]
 */
export function createSudokuGame(difficulty = 'easy', rng = Math.random) {
  const { puzzle, solution, difficulty: diff } = createPuzzle(difficulty, rng);
  return {
    puzzle: cloneGrid(puzzle),
    board: cloneGrid(puzzle),
    notes: emptyNotes(),
    solution: cloneGrid(solution),
    difficulty: diff,
    selected: null,
    notesMode: false,
    conflicts: new Set(),
    showConflicts: false,
    status: 'playing',
    hintsUsed: 0,
  };
}

export function isClue(game, r, c) {
  return game.puzzle[r][c] !== 0;
}

export function selectCell(game, r, c) {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return game;
  return { ...game, selected: { r, c } };
}

export function setNotesMode(game, on) {
  return { ...game, notesMode: Boolean(on) };
}

function refreshWin(game) {
  if (isBoardComplete(game.board, game.solution)) {
    return {
      ...game,
      status: 'won',
      conflicts: new Set(),
      showConflicts: false,
    };
  }
  return { ...game, status: 'playing' };
}

function withConflicts(game, board) {
  if (!game.showConflicts) return { ...game, board };
  return { ...game, board, conflicts: findConflicts(board) };
}

/**
 * Place digit, clear, or toggle note on the selected cell.
 * @param {ReturnType<typeof createSudokuGame>} game
 * @param {number} digit 1–9, or 0 to erase
 */
export function inputDigit(game, digit) {
  if (game.status === 'won') return game;
  const sel = game.selected;
  if (!sel) return game;
  const { r, c } = sel;
  if (isClue(game, r, c)) return game;

  if (game.notesMode && digit >= 1 && digit <= 9) {
    const notes = cloneGrid(game.notes);
    const board = cloneGrid(game.board);
    board[r][c] = 0;
    notes[r][c] = toggleNoteBit(notes[r][c], digit);
    return withConflicts({ ...game, board, notes }, board);
  }

  const board = cloneGrid(game.board);
  const notes = cloneGrid(game.notes);
  if (digit === 0) {
    board[r][c] = 0;
    notes[r][c] = 0;
  } else if (digit >= 1 && digit <= 9) {
    board[r][c] = digit;
    notes[r][c] = 0;
  } else {
    return game;
  }

  return refreshWin(withConflicts({ ...game, board, notes }, board));
}

export function clearSelected(game) {
  return inputDigit(game, 0);
}

/** Reveal the correct digit for the selected empty / wrong cell. */
export function applyHint(game) {
  if (game.status === 'won') return game;
  const sel = game.selected;
  if (!sel) return game;
  const { r, c } = sel;
  if (isClue(game, r, c)) return game;
  if (game.board[r][c] === game.solution[r][c]) return game;

  const board = cloneGrid(game.board);
  const notes = cloneGrid(game.notes);
  board[r][c] = game.solution[r][c];
  notes[r][c] = 0;

  return refreshWin(
    withConflicts(
      { ...game, board, notes, hintsUsed: game.hintsUsed + 1 },
      board,
    ),
  );
}

export function checkBoard(game) {
  const conflicts = findConflicts(game.board);
  return { ...game, showConflicts: true, conflicts };
}

export function clearConflictHighlight(game) {
  return { ...game, showConflicts: false, conflicts: new Set() };
}

/** Empty playable cells still wrong / blank — for HUD. */
export function remainingCount(game) {
  let n = 0;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (game.board[r][c] !== game.solution[r][c]) n += 1;
    }
  }
  return n;
}
