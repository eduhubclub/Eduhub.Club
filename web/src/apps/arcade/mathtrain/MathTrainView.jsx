import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Dices, RotateCcw, Settings, Trophy, X } from 'lucide-react';
import { bestOnColor } from '../../../shared/colorContrast';
import { useClasses } from '../../../data/classes/ClassContext';
import { useAuth } from '../../../data/auth/AuthContext';
import { studentDisplayName } from '../../../data/students/displayName';
import {
  GAME_SCORES_UPDATED_EVENT,
  LOCAL_PLAYER_ID,
  MATH_TRAIN_GAME_ID,
  buildClassLeaderboard,
  getHighScore,
  hasPlayedRound,
  getPowerBank,
  savePowerBank,
  recordGameScore,
} from '../../../data/games/gameScores';
import { Modal } from '../../../shared/Modal';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import {
  GRID,
  START_TIME_OPTIONS,
  beginTrain,
  commitTrain,
  createGame,
  extendTrain,
  tickTimer,
  spendPowerup,
  startGame,
  isPowerupCell,
  cellValue,
} from './mathTrainLogic';
import { playMathTrainSound } from './mathTrainSounds';
import './MathTrain.css';

const TIME_KEY = 'edu-arcade-math-train-seconds';
const COUNT_UP_KEY = 'edu-arcade-math-train-count-up';
const MINUS_KEY = 'edu-arcade-math-train-minus';
const SOUND_KEY = 'edu-arcade-math-train-sound';

const DIGIT_COLORS = {
  1: '#2563eb',
  2: '#0f766e',
  3: '#15803d',
  4: '#a16207',
  5: '#c2410c',
  6: '#e11d48',
  7: '#dc2626',
  8: '#db2777',
  9: '#7c3aed',
};

const POWER_STYLES = {
  time: { bg: '#c2410c', on: bestOnColor('#c2410c'), label: '5 second time boost' },
  random: { bg: '#0f766e', on: bestOnColor('#0f766e'), label: 'Random numbers' },
  double: { bg: '#6d28d9', on: bestOnColor('#6d28d9'), label: 'Double points' },
};

function readStoredFlag(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === '0' || raw === 'false') return false;
    if (raw === '1' || raw === 'true') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeStoredFlag(key, value) {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function readStoredSeconds() {
  try {
    const n = Number(window.localStorage.getItem(TIME_KEY));
    if (START_TIME_OPTIONS.includes(n)) return n;
  } catch {
    /* ignore */
  }
  return 60;
}

function writeStoredSeconds(seconds) {
  try {
    window.localStorage.setItem(TIME_KEY, String(seconds));
  } catch {
    /* ignore */
  }
}

function cellFromPointer(grid, event, fromCell = null) {
  const rect = grid.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;

  const col = (x / rect.width) * GRID;
  const row = (y / rect.height) * GRID;
  const raw = {
    r: Math.min(GRID - 1, Math.floor(row)),
    c: Math.min(GRID - 1, Math.floor(col)),
  };
  if (!fromCell) return raw;

  // Sticky nearest-neighbor: pick among the tip and its 8 neighbors by distance
  // to cell centers, with hysteresis so diagonals don't flicker in and out.
  const sticky = fromCell;
  let best = sticky;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      const r = sticky.r + dr;
      const c = sticky.c + dc;
      if (r < 0 || c < 0 || r >= GRID || c >= GRID) continue;
      const dist = Math.hypot(col - (c + 0.5), row - (r + 0.5));
      if (dist < bestDist) {
        bestDist = dist;
        best = { r, c };
      }
    }
  }

  if (best.r === sticky.r && best.c === sticky.c) return sticky;
  const stickyDist = Math.hypot(col - (sticky.c + 0.5), row - (sticky.r + 0.5));
  // Must clearly cross toward the neighbor before leaving the tip.
  if (stickyDist - bestDist < 0.2) return sticky;
  return best;
}

function runningSum(game) {
  return game.train.reduce(
    (sum, step) => sum + cellValue(game.board[step.r][step.c]),
    0,
  );
}

function PowerGlyph({ type, color }) {
  if (type === 'time') return <Clock color={color} strokeWidth={2.25} />;
  if (type === 'random') return <Dices color={color} strokeWidth={2.25} />;
  return (
    <span className="math-train-x2" style={{ color }}>
      ×2
    </span>
  );
}

function resolvePlayer(selectedClass, selectedStudent, session) {
  const classId = selectedClass?.id || 'local';
  const roster = selectedClass?.studentList || [];

  if (selectedStudent?.id) {
    return {
      classId,
      playerId: String(selectedStudent.id),
      displayName: studentDisplayName(selectedStudent),
      roster,
    };
  }

  if (session?.role === 'student' && session.userId) {
    const match =
      roster.find((s) => String(s.id) === String(session.userId)) ||
      roster.find(
        (s) =>
          String(s.email || '').toLowerCase() ===
          String(session.email || '').toLowerCase(),
      );
    if (match) {
      return {
        classId,
        playerId: String(match.id),
        displayName: studentDisplayName(match),
        roster,
      };
    }
    return {
      classId,
      playerId: String(session.userId),
      displayName: session.displayName || 'You',
      roster,
    };
  }

  return {
    classId,
    playerId: LOCAL_PLAYER_ID,
    displayName: 'You',
    roster,
  };
}

/**
 * Math Train — phone-framed swipe sum (or minus) game.
 */
export function MathTrainView({ theme, isDarkMode }) {
  const { selectedClass, selectedStudent } = useClasses();
  const { session } = useAuth();
  const player = useMemo(
    () => resolvePlayer(selectedClass, selectedStudent, session),
    [selectedClass, selectedStudent, session],
  );

  const [startSeconds, setStartSeconds] = useState(readStoredSeconds);
  const [countUp, setCountUp] = useState(() => readStoredFlag(COUNT_UP_KEY, false));
  const [minusMode, setMinusMode] = useState(() => readStoredFlag(MINUS_KEY, false));
  const [soundOn, setSoundOn] = useState(() => readStoredFlag(SOUND_KEY, true));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [droppedIds, setDroppedIds] = useState([]);
  const [scoreTick, setScoreTick] = useState(0);
  const [newHigh, setNewHigh] = useState(false);
  const [game, setGame] = useState(() =>
    createGame({
      startSeconds: readStoredSeconds(),
      minusMode: readStoredFlag(MINUS_KEY, false),
    }),
  );

  const gridRef = useRef(null);
  const dragging = useRef(false);
  const gameRef = useRef(game);
  const soundRef = useRef(soundOn);
  const statusRef = useRef(game.status);
  const playerRef = useRef(player);
  const playerKeyRef = useRef(`${player.classId}:${player.playerId}`);
  if (!dragging.current) gameRef.current = game;
  soundRef.current = soundOn;
  playerRef.current = player;

  function persistBank(bank) {
    const who = playerRef.current;
    savePowerBank(
      who.classId,
      MATH_TRAIN_GAME_ID,
      who.playerId,
      bank,
      who.displayName,
    );
  }

  function dealSettings(bank) {
    return {
      startSeconds,
      minusMode,
      bank:
        bank ||
        getPowerBank(player.classId, MATH_TRAIN_GAME_ID, player.playerId),
    };
  }

  // Load this player's saved powerbank when identity settles or changes.
  useEffect(() => {
    const key = `${player.classId}:${player.playerId}`;
    const changed = key !== playerKeyRef.current;
    playerKeyRef.current = key;
    if (gameRef.current.status === 'playing') return;
    if (!changed && gameRef.current.status !== 'ready') return;
    const bank = getPowerBank(player.classId, MATH_TRAIN_GAME_ID, player.playerId);
    const cur = gameRef.current.bank;
    if (
      cur.time === bank.time &&
      cur.random === bank.random &&
      cur.double === bank.double
    ) {
      return;
    }
    const next = { ...gameRef.current, bank };
    gameRef.current = next;
    setGame(next);
  }, [player.classId, player.playerId]);

  const highScore = useMemo(() => {
    void scoreTick;
    return getHighScore(player.classId, MATH_TRAIN_GAME_ID, player.playerId);
  }, [player.classId, player.playerId, scoreTick]);

  const played = useMemo(() => {
    void scoreTick;
    return hasPlayedRound(player.classId, MATH_TRAIN_GAME_ID, player.playerId);
  }, [player.classId, player.playerId, scoreTick]);

  const leaderboard = useMemo(() => {
    void scoreTick;
    return buildClassLeaderboard(
      player.roster,
      player.classId,
      MATH_TRAIN_GAME_ID,
      studentDisplayName,
    );
  }, [player.roster, player.classId, scoreTick]);

  useEffect(() => {
    const bump = () => setScoreTick((n) => n + 1);
    window.addEventListener(GAME_SCORES_UPDATED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(GAME_SCORES_UPDATED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  useEffect(() => {
    if (settingsOpen || game.status !== 'playing') return undefined;
    const id = window.setInterval(() => {
      const next = tickTimer(gameRef.current);
      if (next === gameRef.current) return;
      gameRef.current = next;
      setGame(next);
    }, 1000);
    return () => window.clearInterval(id);
  }, [settingsOpen, game.status]);

  useEffect(() => {
    if (statusRef.current === 'playing' && game.status === 'over') {
      playMathTrainSound('over', soundRef.current);
      const who = playerRef.current;
      const result = recordGameScore(
        who.classId,
        MATH_TRAIN_GAME_ID,
        who.playerId,
        game.score,
        who.displayName,
        game.bank,
      );
      setNewHigh(result.isNewHigh);
      setScoreTick((n) => n + 1);
    }
    statusRef.current = game.status;
  }, [game.status, game.score, game.bank]);

  useEffect(() => {
    if (!droppedIds.length) return undefined;
    const id = window.setTimeout(() => setDroppedIds([]), 320);
    return () => window.clearTimeout(id);
  }, [droppedIds]);

  function publish(next) {
    gameRef.current = next;
    setGame(next);
  }

  function dealReady() {
    dragging.current = false;
    setNewHigh(false);
    publish(createGame(dealSettings(gameRef.current.bank)));
    setDroppedIds([]);
    setSettingsOpen(false);
  }

  function beginRound() {
    dragging.current = false;
    setNewHigh(false);
    const base =
      gameRef.current.status === 'ready'
        ? gameRef.current
        : createGame(dealSettings(gameRef.current.bank));
    publish(startGame(base));
    setDroppedIds([]);
    setSettingsOpen(false);
  }

  function onPointerDown(event) {
    if (settingsOpen || gameRef.current.status !== 'playing') return;
    const grid = gridRef.current;
    if (!grid) return;
    const cell = cellFromPointer(grid, event);
    if (!cell) return;
    grid.setPointerCapture(event.pointerId);
    dragging.current = true;
    const next = beginTrain(gameRef.current, cell);
    if (next !== gameRef.current) {
      publish(next);
      playMathTrainSound('tick', soundRef.current);
    }
  }

  function onPointerMove(event) {
    if (!dragging.current) return;
    const grid = gridRef.current;
    if (!grid) return;
    const prev = gameRef.current;
    const last = prev.train[prev.train.length - 1];
    const cell = cellFromPointer(grid, event, last || null);
    if (!cell) return;
    const next = extendTrain(prev, cell);
    if (next === prev) return;
    if (next.train.length > prev.train.length) {
      playMathTrainSound('tick', soundRef.current);
    }
    publish(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    const result = commitTrain(gameRef.current);
    publish(result.game);
    if (result.outcome === 'clear') {
      persistBank(result.game.bank);
      playMathTrainSound('clear', soundRef.current);
      if (result.collected > 0) playMathTrainSound('collect', soundRef.current);
      if (result.droppedIds.length) setDroppedIds(result.droppedIds);
    } else if (result.outcome === 'miss') {
      playMathTrainSound('miss', soundRef.current);
    }
  }

  function activate(type) {
    const next = spendPowerup(gameRef.current, type);
    if (next === gameRef.current) return;
    dragging.current = false;
    publish(next);
    persistBank(next.bank);
    playMathTrainSound('power', soundRef.current);
  }

  const running = runningSum(game);
  const shown = game.minusMode ? game.target - running : game.target;
  const onTrain = new Set(game.train.map((step) => `${step.r},${step.c}`));
  const linePoints = game.train
    .map((step) => `${(step.c + 0.5) * 25},${(step.r + 0.5) * 25}`)
    .join(' ');
  const showBoard = game.status === 'playing' || game.status === 'over';

  return (
    <div className="math-train-stage">
      <div
        className={`math-train-phone ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
      >
        <div className="math-train-hud">
          <div className="math-train-hud-side math-train-hud-left">
            <span className="math-train-label">Time</span>
            <span>{game.status === 'ready' ? startSeconds : game.timeLeft}</span>
          </div>
          <div className="math-train-hud-side math-train-hud-center">
            <span className="math-train-label">Score</span>
            <span>{game.score}</span>
            {game.doubleArmed ? <span className="math-train-label">×2</span> : null}
          </div>
          <div className="math-train-hud-right">
            {played ? (
              <div className="math-train-hud-side">
                <span className="math-train-label">High</span>
                <span>{highScore}</span>
              </div>
            ) : null}
            <button
              type="button"
              className={`edu-control math-train-trophy ${theme.colorOutline}`}
              aria-label="Class leaderboard"
              onClick={() => setLeaderboardOpen(true)}
            >
              <Trophy strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="math-train-target-wrap">
          <div className="math-train-target">{shown}</div>
          <p className={`math-train-count ${countUp && game.train.length ? '' : 'is-hidden'}`}>
            {running}
          </p>
        </div>

        <div className="math-train-board">
          {showBoard ? (
            <div
              ref={gridRef}
              className="math-train-grid"
              role="application"
              aria-label={
                game.minusMode
                  ? `Subtract numbers from ${game.target} to reach zero`
                  : `Drag numbers that add to ${game.target}`
              }
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={(event) => event.preventDefault()}
            >
              {game.train.length > 1 ? (
                <svg className="math-train-line" viewBox="0 0 100 100" aria-hidden="true">
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : null}
              {game.board.map((row, r) =>
                row.map((cell, c) => {
                  const on = onTrain.has(`${r},${c}`);
                  const drop = droppedIds.includes(cell.id);
                  if (isPowerupCell(cell)) {
                    const style = POWER_STYLES[cell.powerup];
                    return (
                      <div
                        key={cell.id}
                        className={`math-train-cell math-train-cell-power${on ? ' is-on' : ''}${
                          drop ? ' is-drop' : ''
                        }`}
                        style={{ backgroundColor: style.bg, color: style.on.hex }}
                        aria-label={style.label}
                      >
                        <span className="math-train-power-glyph">
                          <PowerGlyph type={cell.powerup} color={style.on.hex} />
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={cell.id}
                      className={`math-train-cell${on ? ' is-on' : ''}${drop ? ' is-drop' : ''}`}
                      style={{ color: DIGIT_COLORS[cell.value] || DIGIT_COLORS[1] }}
                    >
                      <span className="math-train-digit">{cell.value}</span>
                    </div>
                  );
                }),
              )}
            </div>
          ) : (
            <div className="math-train-ready">
              <p className="math-train-ready-title">Math Train</p>
              <p className="math-train-ready-copy">
                Swipe numbers that {minusMode ? 'reach zero' : 'add to the target'}
              </p>
              <button
                type="button"
                className={`edu-control math-train-primary ${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`}
                onClick={beginRound}
              >
                Start
              </button>
            </div>
          )}
        </div>

        <div className="math-train-bank">
          {(['time', 'random', 'double']).map((type) => {
            const style = POWER_STYLES[type];
            const count = game.bank[type];
            const armed = type === 'double' && game.doubleArmed;
            return (
              <button
                key={type}
                type="button"
                className={`edu-control math-train-power${armed ? ' is-armed' : ''}`}
                disabled={count < 1 || game.status !== 'playing'}
                aria-label={
                  armed
                    ? `${style.label}, armed, ${count} left`
                    : `${style.label}, ${count} available`
                }
                onClick={() => activate(type)}
              >
                <span
                  className="math-train-power-icon"
                  style={{ backgroundColor: style.bg, color: style.on.hex }}
                >
                  <PowerGlyph type={type} color={style.on.hex} />
                </span>
                <span className="math-train-power-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="math-train-chrome">
          <button
            type="button"
            className={`edu-control math-train-icon-btn ${theme.colorOutline}`}
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`edu-control math-train-icon-btn ${theme.colorOutline}`}
            aria-label="New game"
            onClick={dealReady}
          >
            <RotateCcw strokeWidth={2} />
          </button>
        </div>

        {settingsOpen ? (
          <div className="math-train-overlay">
            <div className={`math-train-sheet ${theme.colorSurface} ${theme.colorOutline}`}>
              <div className="math-train-sheet-head">
                <h2>Settings</h2>
                <button
                  type="button"
                  className={`edu-control math-train-icon-btn ${theme.colorOutline}`}
                  aria-label="Close settings"
                  onClick={() => setSettingsOpen(false)}
                >
                  <X strokeWidth={2} />
                </button>
              </div>

              <div className="math-train-field">
                <span className="math-train-field-label">Starting time · next game</span>
                <div className="math-train-times" role="group" aria-label="Starting time">
                  {START_TIME_OPTIONS.map((seconds) => {
                    const active = startSeconds === seconds;
                    return (
                      <button
                        key={seconds}
                        type="button"
                        className={`edu-control math-train-time ${theme.colorOutline} ${
                          active
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : theme.colorOnSurface
                        }`}
                        aria-pressed={active}
                        onClick={() => {
                          setStartSeconds(seconds);
                          writeStoredSeconds(seconds);
                        }}
                      >
                        {seconds}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                className={`edu-control math-train-toggle ${theme.colorOutline} ${
                  countUp ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                aria-pressed={countUp}
                onClick={() => {
                  const next = !countUp;
                  setCountUp(next);
                  writeStoredFlag(COUNT_UP_KEY, next);
                }}
              >
                <span>Count up</span>
                <span className="math-train-toggle-hint">{countUp ? 'On' : 'Off'}</span>
              </button>

              <button
                type="button"
                className={`edu-control math-train-toggle ${theme.colorOutline} ${
                  minusMode ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                aria-pressed={minusMode}
                onClick={() => {
                  const next = !minusMode;
                  setMinusMode(next);
                  writeStoredFlag(MINUS_KEY, next);
                }}
              >
                <span>Minus mode</span>
                <span className="math-train-toggle-hint">Next game</span>
              </button>

              <button
                type="button"
                className={`edu-control math-train-toggle ${theme.colorOutline} ${
                  soundOn ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
                aria-pressed={soundOn}
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  writeStoredFlag(SOUND_KEY, next);
                }}
              >
                <span>Sound effects</span>
                <span className="math-train-toggle-hint">{soundOn ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        ) : null}

        {game.status === 'over' && !settingsOpen ? (
          <div className="math-train-overlay">
            <div className={`math-train-sheet math-train-over ${theme.colorSurface} ${theme.colorOutline}`}>
              <h2>Time's up</h2>
              <div className="math-train-over-score">{game.score}</div>
              {newHigh ? (
                <p className="math-train-over-high">New high score</p>
              ) : null}
              <button
                type="button"
                className={`edu-control math-train-primary ${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`}
                onClick={dealReady}
              >
                Play again
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={leaderboardOpen}
        title="Leaderboard"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setLeaderboardOpen(false)}
        maxWidth="max-w-md"
        headerStart={<Trophy size={18} className={theme.colorOnPrimary} />}
      >
        <div className="p-4 sm:p-5">
          {leaderboard.length === 0 ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              Select a class to see classmate scores.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {leaderboard.map((row, index) => {
                const isYou = row.playerId === player.playerId;
                return (
                  <li
                    key={row.playerId}
                    className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 ${
                      theme.colorOutline
                    } ${isYou ? theme.colorSurfaceVariant : theme.colorSurface}`}
                  >
                    <span
                      className={`w-6 shrink-0 text-center tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    >
                      {index + 1}
                    </span>
                    <StudentAvatar student={row.student} theme={theme} size="sm" />
                    <p className={`min-w-0 flex-1 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}>
                      {row.name}
                      {isYou ? (
                        <span className={`ml-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={`shrink-0 tabular-nums ${TYPE.labelLg} ${
                        row.hasPlayed ? theme.colorOnSurface : theme.colorOnSurfaceVariant
                      }`}
                    >
                      {row.hasPlayed ? row.score : '—'}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Modal>
    </div>
  );
}
