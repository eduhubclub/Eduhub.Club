/**
 * Sudoku rules — generate unique puzzles, place digits, hints, conflicts.
 */
import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY,
  SIZE,
  carvePuzzle,
  checkBoard,
  countSolutions,
  createPuzzle,
  createSudokuGame,
  findConflicts,
  generateCompleteBoard,
  hasNote,
  inputDigit,
  isBoardComplete,
  isValidPlacement,
  remainingCount,
  selectCell,
  setNotesMode,
  solveBoard,
  applyHint,
} from './sudokuLogic.js';

/** Deterministic LCG for reproducible generation in tests. */
function makeRng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('isValidPlacement / solveBoard', () => {
  it('rejects duplicates in row, column, and box', () => {
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    board[0][0] = 5;
    expect(isValidPlacement(board, 0, 1, 5)).toBe(false);
    expect(isValidPlacement(board, 1, 0, 5)).toBe(false);
    expect(isValidPlacement(board, 1, 1, 5)).toBe(false);
    expect(isValidPlacement(board, 1, 3, 5)).toBe(true);
  });

  it('solves an empty board into a full valid grid', () => {
    const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    expect(solveBoard(board, makeRng(7))).toBe(true);
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const n = board[r][c];
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9);
        board[r][c] = 0;
        expect(isValidPlacement(board, r, c, n)).toBe(true);
        board[r][c] = n;
      }
    }
  });
});

describe('generate + carve', () => {
  it('builds a unique easy puzzle that matches its solution', () => {
    const { puzzle, solution, difficulty } = createPuzzle('easy', makeRng(42));
    expect(difficulty).toBe('easy');
    expect(countSolutions(puzzle, 2)).toBe(1);
    expect(isBoardComplete(solution, solution)).toBe(true);

    let clues = 0;
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (puzzle[r][c] !== 0) {
          clues += 1;
          expect(puzzle[r][c]).toBe(solution[r][c]);
        }
      }
    }
    expect(clues).toBeGreaterThanOrEqual(DIFFICULTY.easy.clues - 4);
    expect(clues).toBeLessThanOrEqual(DIFFICULTY.easy.clues + 2);
  });

  it('keeps uniqueness when carving from a complete board', () => {
    const solution = generateCompleteBoard(makeRng(99));
    const puzzle = carvePuzzle(solution, 36, makeRng(99));
    expect(countSolutions(puzzle, 2)).toBe(1);
  });
});

describe('gameplay', () => {
  it('places digits, blocks clues, and wins when filled correctly', () => {
    let game = createSudokuGame('easy', makeRng(3));
    expect(game.status).toBe('playing');

    // Find a clue and an empty cell.
    let clue = null;
    let empty = null;
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (game.puzzle[r][c] !== 0 && !clue) clue = { r, c };
        if (game.puzzle[r][c] === 0 && !empty) empty = { r, c };
      }
    }
    expect(clue).toBeTruthy();
    expect(empty).toBeTruthy();

    game = selectCell(game, clue.r, clue.c);
    game = inputDigit(game, 9);
    expect(game.board[clue.r][clue.c]).toBe(game.puzzle[clue.r][clue.c]);

    // Fill every empty cell with the solution.
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (game.puzzle[r][c] !== 0) continue;
        game = selectCell(game, r, c);
        game = inputDigit(game, game.solution[r][c]);
      }
    }
    expect(game.status).toBe('won');
    expect(remainingCount(game)).toBe(0);
  });

  it('toggles notes without writing a digit', () => {
    let game = createSudokuGame('easy', makeRng(5));
    let empty = null;
    outer: for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (game.puzzle[r][c] === 0) {
          empty = { r, c };
          break outer;
        }
      }
    }
    game = setNotesMode(game, true);
    game = selectCell(game, empty.r, empty.c);
    game = inputDigit(game, 4);
    expect(game.board[empty.r][empty.c]).toBe(0);
    expect(hasNote(game.notes[empty.r][empty.c], 4)).toBe(true);
    game = inputDigit(game, 4);
    expect(hasNote(game.notes[empty.r][empty.c], 4)).toBe(false);
  });

  it('hints fill the selected cell from the solution', () => {
    let game = createSudokuGame('easy', makeRng(11));
    let empty = null;
    outer: for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (game.puzzle[r][c] === 0) {
          empty = { r, c };
          break outer;
        }
      }
    }
    game = selectCell(game, empty.r, empty.c);
    game = applyHint(game);
    expect(game.board[empty.r][empty.c]).toBe(game.solution[empty.r][empty.c]);
    expect(game.hintsUsed).toBe(1);
  });

  it('checkBoard flags conflicting digits', () => {
    let game = createSudokuGame('easy', makeRng(13));
    // Force a row clash in two empties if possible; else overwrite via board.
    game = {
      ...game,
      board: game.board.map((row) => row.slice()),
    };
    game.board[0][0] = 1;
    game.board[0][1] = 1;
    game = checkBoard(game);
    expect(findConflicts(game.board).size).toBeGreaterThan(0);
    expect(game.conflicts.size).toBeGreaterThan(0);
  });
});
