import { useEffect, useState } from 'react';
import {
  Check,
  Eraser,
  Lightbulb,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import {
  APP_STAGE_PAD,
  APP_STATIC_BOARD,
} from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  DIFFICULTY,
  DIFFICULTY_ORDER,
  SIZE,
  clearSelected,
  checkBoard,
  createSudokuGame,
  hasNote,
  inputDigit,
  isClue,
  remainingCount,
  selectCell,
  setNotesMode,
  applyHint,
} from './sudokuLogic';
import './Sudoku.css';

const DIFF_KEY = 'edu-arcade-sudoku-difficulty';

function readDifficulty() {
  try {
    const raw = window.localStorage.getItem(DIFF_KEY);
    if (raw && DIFFICULTY[raw]) return raw;
  } catch {
    /* ignore */
  }
  return 'easy';
}

function writeDifficulty(id) {
  try {
    window.localStorage.setItem(DIFF_KEY, id);
  } catch {
    /* ignore */
  }
}

function cellKey(r, c) {
  return `${r},${c}`;
}

/**
 * Sudoku — classic 9×9 with notes, hints, and difficulty.
 */
export function SudokuView({ isDarkMode, theme }) {
  const [difficulty, setDifficulty] = useState(readDifficulty);
  const [game, setGame] = useState(() => createSudokuGame(readDifficulty()));

  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const onSurface = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const clueTone = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const entryTone = isDarkMode ? 'text-sky-300' : 'text-sky-700';
  const selectedBg = isDarkMode ? 'bg-sky-500/25' : 'bg-sky-100';
  const peerBg = isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100';
  const conflictBg = isDarkMode ? 'bg-rose-500/30 text-rose-200' : 'bg-rose-100 text-rose-700';
  const padSurface = isDarkMode
    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300';

  const newPuzzle = (nextDiff = difficulty) => {
    writeDifficulty(nextDiff);
    setDifficulty(nextDiff);
    setGame(createSudokuGame(nextDiff));
  };

  const selected = game.selected;
  const selectedValue =
    selected != null ? game.board[selected.r][selected.c] : 0;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        setGame((g) => inputDigit(g, Number(e.key)));
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        setGame((g) => clearSelected(g));
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setGame((g) => setNotesMode(g, !g.notesMode));
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setGame((g) => applyHint(g));
        return;
      }
      if (!selected) return;
      let { r, c } = selected;
      if (e.key === 'ArrowUp') r -= 1;
      else if (e.key === 'ArrowDown') r += 1;
      else if (e.key === 'ArrowLeft') c -= 1;
      else if (e.key === 'ArrowRight') c += 1;
      else return;
      e.preventDefault();
      setGame((g) => selectCell(g, r, c));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const left = remainingCount(game);
  const diffLabel = DIFFICULTY[game.difficulty]?.label ?? 'Easy';

  return (
    <div className={`${APP_STATIC_BOARD} ${surface}`}>
      <div className={`sudoku-stage ${APP_STAGE_PAD}`}>
        <ButtonRow className="shrink-0">
          <button
            type="button"
            className={toolBtnClass(isDarkMode)}
            title="New puzzle"
            aria-label="New puzzle"
            onClick={() => newPuzzle(difficulty)}
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            <ButtonRowLabel>New</ButtonRowLabel>
          </button>
          {DIFFICULTY_ORDER.map((id) => {
            const active = difficulty === id;
            return (
              <button
                key={id}
                type="button"
                className={`${toolBtnClass(isDarkMode)} ${
                  active ? (isDarkMode ? '!bg-slate-600' : '!bg-slate-200') : ''
                }`}
                title={DIFFICULTY[id].label}
                aria-label={`${DIFFICULTY[id].label} difficulty`}
                aria-pressed={active}
                onClick={() => newPuzzle(id)}
              >
                {DIFFICULTY[id].label}
              </button>
            );
          })}
          <button
            type="button"
            className={`${toolBtnClass(isDarkMode)} ${
              game.notesMode ? (isDarkMode ? '!bg-slate-600' : '!bg-slate-200') : ''
            }`}
            title="Notes (N)"
            aria-label="Toggle notes mode"
            aria-pressed={game.notesMode}
            onClick={() => setGame((g) => setNotesMode(g, !g.notesMode))}
          >
            <Pencil size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Notes</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={toolBtnClass(isDarkMode)}
            title="Hint (H)"
            aria-label="Use hint"
            onClick={() => setGame((g) => applyHint(g))}
          >
            <Lightbulb size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Hint</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={toolBtnClass(isDarkMode)}
            title="Check conflicts"
            aria-label="Check conflicts"
            onClick={() => setGame((g) => checkBoard(g))}
          >
            <Check size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Check</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={toolBtnClass(isDarkMode)}
            title="Erase"
            aria-label="Erase cell"
            onClick={() => setGame((g) => clearSelected(g))}
          >
            <Eraser size={16} strokeWidth={2.5} />
            <ButtonRowLabel>Erase</ButtonRowLabel>
          </button>
        </ButtonRow>

        <div className={`flex shrink-0 items-center justify-between gap-3 ${TYPE.labelMd} ${muted}`}>
          <span>
            {diffLabel}
            {game.notesMode ? ' · Notes on' : ''}
          </span>
          <span className="tabular-nums">
            {game.status === 'won' ? 'Complete!' : `${left} left`}
            {game.hintsUsed > 0 ? ` · ${game.hintsUsed} hint${game.hintsUsed === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        <div className="sudoku-main">
          <div className={`sudoku-board-wrap ${onSurface}`} style={{ containerType: 'inline-size' }}>
            <div className="sudoku-grid" role="grid" aria-label="Sudoku board">
              {Array.from({ length: SIZE * SIZE }, (_, i) => {
                const r = Math.floor(i / SIZE);
                const c = i % SIZE;
                const value = game.board[r][c];
                const clue = isClue(game, r, c);
                const isSelected = selected?.r === r && selected?.c === c;
                const sameUnit =
                  selected &&
                  (selected.r === r ||
                    selected.c === c ||
                    (Math.floor(selected.r / 3) === Math.floor(r / 3) &&
                      Math.floor(selected.c / 3) === Math.floor(c / 3)));
                const sameDigit =
                  selectedValue !== 0 && value === selectedValue && !isSelected;
                const conflict =
                  game.showConflicts && game.conflicts.has(cellKey(r, c));
                const boxR = c === 2 || c === 5;
                const boxB = r === 2 || r === 5;
                const notesMask = game.notes[r][c];

                let tone = clue ? clueTone : entryTone;
                let bg = '';
                if (conflict) {
                  bg = conflictBg;
                  tone = '';
                } else if (isSelected) {
                  bg = selectedBg;
                } else if (sameDigit || sameUnit) {
                  bg = peerBg;
                }

                return (
                  <button
                    key={cellKey(r, c)}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={
                      value
                        ? `Row ${r + 1} column ${c + 1}, ${value}${clue ? ', clue' : ''}`
                        : `Row ${r + 1} column ${c + 1}, empty`
                    }
                    className={`edu-control sudoku-cell ${
                      clue ? 'sudoku-cell--clue' : ''
                    } ${boxR ? 'sudoku-cell--box-r' : ''} ${
                      boxB ? 'sudoku-cell--box-b' : ''
                    } ${bg} ${tone}`}
                    onClick={() => setGame((g) => selectCell(g, r, c))}
                  >
                    {value !== 0 ? (
                      <span className="sudoku-cell__digit">{value}</span>
                    ) : notesMask !== 0 ? (
                      <span className="sudoku-cell__notes" aria-hidden>
                        {Array.from({ length: 9 }, (_, n) => (
                          <span key={n}>
                            {hasNote(notesMask, n + 1) ? n + 1 : ''}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {game.status === 'won' ? (
              <div className={`sudoku-win ${onSurface}`}>
                <p className={TYPE.titleMd}>Puzzle complete</p>
                <p className={`${TYPE.bodySm} ${muted}`}>
                  {diffLabel}
                  {game.hintsUsed
                    ? ` · ${game.hintsUsed} hint${game.hintsUsed === 1 ? '' : 's'}`
                    : ' · no hints'}
                </p>
                <button
                  type="button"
                  className={`edu-control rounded-xl px-4 py-2 ${toolBtnClass(isDarkMode)}`}
                  onClick={() => newPuzzle(difficulty)}
                >
                  <RotateCcw size={16} strokeWidth={2.5} />
                  New puzzle
                </button>
              </div>
            ) : null}
          </div>

          <div className="sudoku-pad" role="group" aria-label="Number pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className={`edu-control sudoku-pad__btn rounded-xl ${TYPE.titleMd} tabular-nums ${padSurface}`}
                aria-label={game.notesMode ? `Toggle note ${n}` : `Enter ${n}`}
                onClick={() => setGame((g) => inputDigit(g, n))}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`edu-control sudoku-pad__btn rounded-xl ${padSurface}`}
              aria-label="Erase"
              onClick={() => setGame((g) => clearSelected(g))}
            >
              <Eraser size={18} strokeWidth={2.5} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
