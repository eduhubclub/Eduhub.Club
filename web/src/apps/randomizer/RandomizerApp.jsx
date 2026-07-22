import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleDashed,
  GripHorizontal,
  Inbox,
  Play,
  Shuffle,
  SquareStack,
} from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { AVATAR_TYPES, getAvatarInitials, normalizeAvatar } from '../../data/classes/avatar';
import { PageHeader } from '../../shared/PageHeader';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { LogoIcon2x2 } from '../../shared/Logo';
import { appFabClass, APP_GRID_CARD } from '../../shared/layout';
import { ButtonRow } from '../../shared/ButtonRow';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';
import { useAnnounce } from '../../shared/LiveAnnouncer';
import {
  RANDOMIZER_POOL_MODES,
  useRandomizerActivePool,
} from '../../data/randomizer/RandomizerPoolContext';
import { ActiveStudentsPopout } from './ActiveStudentsPopout';
import {
  wheelSegmentFill,
  WHEEL_SEGMENT_OPACITY,
  wheelSvgChrome,
} from '../../shared/wheelColors';

const CARD_SIZE_MIN = 96;
const CARD_SIZE_MAX = 220;

const RANDOMIZER_MODES = RANDOMIZER_POOL_MODES;

function CardSizeControl({ cardSize, onChange, theme, isDarkMode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={`${toolBtn} ${open ? theme.text : ''}`}
      >
        Card size
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Adjust card size"
          className={`absolute right-0 top-full mt-2 z-30 w-56 rounded-xl border shadow-lg p-3 ${
            isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`shrink-0 w-2.5 h-3.5 rounded-[2px] border ${
                isDarkMode ? 'border-slate-500 bg-slate-800' : 'border-slate-400 bg-slate-100'
              }`}
              aria-hidden
              title="Smaller"
            />
            <input
              id="randomizer-card-size"
              type="range"
              min={CARD_SIZE_MIN}
              max={CARD_SIZE_MAX}
              step={4}
              value={cardSize}
              onChange={(e) => onChange(Number(e.target.value))}
              className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer ${theme.text}
                [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:border-0
                [&::-webkit-slider-thumb]:bg-current
                [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0
                [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:bg-current
                ${
                  isDarkMode
                    ? '[&::-webkit-slider-runnable-track]:bg-slate-600 [&::-moz-range-track]:bg-slate-600 bg-slate-600'
                    : '[&::-webkit-slider-runnable-track]:bg-slate-200 [&::-moz-range-track]:bg-slate-200 bg-slate-200'
                }`}
              aria-valuemin={CARD_SIZE_MIN}
              aria-valuemax={CARD_SIZE_MAX}
              aria-valuenow={cardSize}
              aria-label="Card size"
            />
            <span
              className={`shrink-0 w-4 h-6 rounded-[3px] border ${
                isDarkMode ? 'border-slate-500 bg-slate-800' : 'border-slate-400 bg-slate-100'
              }`}
              aria-hidden
              title="Larger"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getWheelNameParts(student) {
  const parts = String(student?.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0] || '';
  const lastInitial =
    parts.length > 1 && parts[parts.length - 1][0]
      ? `${parts[parts.length - 1][0].toUpperCase()}.`
      : '';
  return { first, lastInitial };
}

function truncateWheelFirst(first, maxChars) {
  if (first.length <= maxChars) return first;
  if (maxChars <= 1) return first.slice(0, 1);
  return `${first.slice(0, maxChars - 1)}…`;
}

/** Always: truncated first + last initial. Avatar is drawn separately at the rim. */
function wheelNameLabel(student, fontSize, textEndX = 168, hubClearance = 58) {
  const { first, lastInitial } = getWheelNameParts(student);
  const lastPart = lastInitial ? ` ${lastInitial}` : '';
  const maxWidth = Math.max(24, textEndX - hubClearance);
  const charW = fontSize * 0.58;
  const maxChars = Math.max(1, Math.floor(maxWidth / charW));
  const maxFirst = Math.max(1, maxChars - lastPart.length);
  return `${truncateWheelFirst(first, maxFirst)}${lastPart}`;
}

function WheelSliceAvatar({ student, x, size, isDarkMode }) {
  const avatar = normalizeAvatar(student);
  const r = size / 2;
  const chrome = wheelSvgChrome(isDarkMode);

  if (
    (avatar.type === AVATAR_TYPES.upload || avatar.type === AVATAR_TYPES.library) &&
    avatar.imageUrl
  ) {
    const clipId = `wheel-av-${student.id}`;
    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <circle cx={x} cy={0} r={r} />
          </clipPath>
        </defs>
        <circle cx={x} cy={0} r={r} fill={chrome.surfaceVariant} />
        <image
          href={avatar.imageUrl}
          x={x - r}
          y={-r}
          width={size}
          height={size}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    );
  }

  if (avatar.type === AVATAR_TYPES.emoji && avatar.emoji) {
    return (
      <text
        x={x}
        y={0}
        fontSize={size * 0.92}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {avatar.emoji}
      </text>
    );
  }

  const initials = getAvatarInitials(student);
  return (
    <g>
      <circle cx={x} cy={0} r={r} fill={chrome.avatarWell} />
      <text
        x={x}
        y={0}
        fontSize={Math.max(7, size * 0.38)}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
        fill={chrome.onSurfaceMuted}
      >
        {initials}
      </text>
    </g>
  );
}

/**
 * Edu.Randomizer — four modes from the proof-of-concept, wired to class rosters.
 */
export function RandomizerApp({ activeTab, isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const { classes, selectedClass, selectClass } = useClasses();
  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes]
  );

  // Prefer the shared selection; fall back to the first active class.
  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  const modeKey = RANDOMIZER_MODES.includes(activeTab) ? activeTab : 'Randomizer';
  const { roster, activeStudents, setActiveStudents, resetActive: resetPool } =
    useRandomizerActivePool(modeKey);

  // —— Randomizer pick ——
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const shuffleIntervalRef = useRef(null);
  const wheelTimerRef = useRef(null);

  // —— Wheel ——
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelWinner, setWheelWinner] = useState(null);

  // —— Cards ——
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [flippedCards, setFlippedCards] = useState(() => new Set());
  const [cardSize, setCardSize] = useState(() => {
    try {
      const n = Number(localStorage.getItem('eduHub.randomizer.cardSize'));
      if (Number.isFinite(n) && n >= CARD_SIZE_MIN && n <= CARD_SIZE_MAX) return n;
    } catch {
      /* ignore */
    }
    return 140;
  });
  const cardRefs = useRef(new Map());

  const resetActive = () => {
    resetPool();
    if (modeKey === 'Pick a Card') setFlippedCards(new Set());
  };

  // Deck rebuilds on class change only — flipping updates Active without reshuffling.
  // Roster edits sync objects/membership in place so name/avatar changes don't wipe flips.
  useEffect(() => {
    setShuffledDeck([...(roster || [])].sort(() => Math.random() - 0.5));
    setFlippedCards(new Set());
  }, [selectedClass?.id]);

  useEffect(() => {
    setShuffledDeck((prev) => {
      const list = roster || [];
      const byId = new Map(list.map((s) => [s.id, s]));
      if (prev.length === 0) {
        return list.length ? [...list].sort(() => Math.random() - 0.5) : [];
      }
      const next = prev.map((s) => byId.get(s.id)).filter(Boolean);
      const have = new Set(next.map((s) => s.id));
      for (const s of list) {
        if (!have.has(s.id)) next.push(s);
      }
      return next;
    });
    setFlippedCards((prev) => {
      const ids = new Set((roster || []).map((s) => s.id));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
  }, [roster]);

  useEffect(() => {
    try {
      localStorage.setItem('eduHub.randomizer.cardSize', String(cardSize));
    } catch {
      /* ignore */
    }
  }, [cardSize]);

  // —— Pull a name ——
  const [pullDragY, setPullDragY] = useState(0);
  const [isPullDragging, setIsPullDragging] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [hasPulledName, setHasPulledName] = useState(false);
  const [stagedStudent, setStagedStudent] = useState(null);

  useEffect(() => {
    if (
      activeTab === 'Pull A Name' &&
      activeStudents.length > 0 &&
      !stagedStudent &&
      !hasPulledName
    ) {
      setStagedStudent(activeStudents[Math.floor(Math.random() * activeStudents.length)]);
    }
  }, [activeTab, activeStudents, stagedStudent, hasPulledName]);

  useEffect(() => {
    // Reset mode-local UI when switching class
    setSelectedStudent(null);
    setWheelWinner(null);
    setHasPulledName(false);
    setPullDragY(0);
    setStagedStudent(null);
  }, [selectedClass?.id]);

  useEffect(
    () => () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    },
    [],
  );

  const pickRandomStudent = () => {
    if (isAnimating || activeStudents.length === 0) return;
    setIsAnimating(true);
    let shuffles = 0;
    const maxShuffles = 12;
    let finalPick = null;
    if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    shuffleIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * activeStudents.length);
      finalPick = activeStudents[randomIndex];
      setSelectedStudent(finalPick);
      shuffles += 1;
      if (shuffles >= maxShuffles) {
        clearInterval(shuffleIntervalRef.current);
        shuffleIntervalRef.current = null;
        setIsAnimating(false);
        if (finalPick?.name) announce(`${finalPick.name} was picked`);
      }
    }, 75);
  };

  const spinWheel = () => {
    if (isSpinningWheel || activeStudents.length === 0) return;
    setIsSpinningWheel(true);
    setWheelWinner(null);

    const spinSpins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = wheelRotation + spinSpins * 360 + extraDegrees;
    setWheelRotation(totalRotation);

    const normalizedRotation = totalRotation % 360;
    const step = 360 / activeStudents.length;
    const pointerAngle = (360 - normalizedRotation + 90) % 360;
    const winningIndex = Math.floor(pointerAngle / step) % activeStudents.length;
    const winner = activeStudents[winningIndex];

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      wheelTimerRef.current = null;
      setIsSpinningWheel(false);
      setWheelWinner(winner);
      if (winner?.name) announce(`${winner.name} was picked`);
    }, 4000);
  };

  const handleShuffleDeck = () => {
    setShuffledDeck([...activeStudents].sort(() => Math.random() - 0.5));
    setFlippedCards(new Set());
  };

  const shuffleCardOrder = () => {
    setShuffledDeck((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const scrollToCard = (studentId) => {
    window.setTimeout(() => {
      const el = cardRefs.current.get(studentId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 60);
  };

  const setCardFlipped = (student, shouldFlip) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (shouldFlip) next.add(student.id);
      else next.delete(student.id);
      return next;
    });
    setActiveStudents((prev) => {
      if (shouldFlip) return prev.filter((s) => s.id !== student.id);
      if (prev.some((s) => s.id === student.id)) return prev;
      const fromRoster = roster.find((s) => s.id === student.id);
      return fromRoster ? [...prev, fromRoster] : prev;
    });
    if (shouldFlip && student?.name) announce(`${student.name} was revealed`);
  };

  const pickAndFlipCard = () => {
    if (activeStudents.length === 0) return;

    const remaining = shuffledDeck.filter(
      (s) => !flippedCards.has(s.id) && activeStudents.some((a) => a.id === s.id)
    );
    let pick;

    if (remaining.length === 0) {
      const deck = [...activeStudents].sort(() => Math.random() - 0.5);
      pick = deck[Math.floor(Math.random() * deck.length)];
      setShuffledDeck(deck);
      setFlippedCards(new Set([pick.id]));
      setActiveStudents((prev) => prev.filter((s) => s.id !== pick.id));
    } else {
      pick = remaining[Math.floor(Math.random() * remaining.length)];
      setFlippedCards((prev) => new Set(prev).add(pick.id));
      setActiveStudents((prev) => prev.filter((s) => s.id !== pick.id));
    }

    scrollToCard(pick.id);
    if (pick?.name) announce(`${pick.name} was picked`);
  };

  const onPullDragStart = (e) => {
    if (hasPulledName) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    setIsPullDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPullStartY(clientY - pullDragY);
  };

  const onPullDragMove = (e) => {
    if (!isPullDragging || hasPulledName) return;
    e.preventDefault?.();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let newY = clientY - pullStartY;
    if (newY > 0) newY = 0;
    setPullDragY(newY);
    if (newY < -250) {
      setHasPulledName(true);
      setIsPullDragging(false);
      setPullDragY(-600);
      window.getSelection()?.removeAllRanges();
      if (stagedStudent?.name) announce(`${stagedStudent.name} was pulled`);
    }
  };

  const onPullDragEnd = () => {
    if (!isPullDragging || hasPulledName) return;
    setIsPullDragging(false);
    if (pullDragY > -250) setPullDragY(0);
    window.getSelection()?.removeAllRanges();
  };

  const resetPull = () => {
    setHasPulledName(false);
    setPullDragY(0);
    setStagedStudent(null);
  };

  const handlePullRemove = () => {
    if (!stagedStudent) return;
    setActiveStudents((prev) => prev.filter((s) => s.id !== stagedStudent.id));
    resetPull();
  };

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Randomizer"
          description="Pick students randomly from your class rosters."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      variant="scroll"
      className={activeTab === 'Pull A Name' ? 'select-none' : ''}
    >
      <PageHeader
        title={activeTab || 'Randomizer'}
        description={
          !selectedClass
            ? 'Choose a class from the sidebar to get started.'
            : activeTab === 'Wheel of Names'
              ? 'Spin the wheel to choose a student.'
              : activeTab === 'Pick a Card'
                ? 'Flip a card to reveal a student.'
                : activeTab === 'Pull A Name'
                  ? 'Drag the cover up to reveal a name.'
                  : 'Shuffle through the roster and land on a student.'
        }
        isDarkMode={isDarkMode}
      />

      {RANDOMIZER_MODES.includes(activeTab) && activeTab !== 'Randomizer' ? (
        <ButtonRow>
          <ActiveStudentsPopout
            activeStudents={activeStudents}
            fullRoster={roster}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <button
            type="button"
            onClick={resetActive}
            disabled={activeStudents.length === roster.length}
            className={`${toolBtnClass(isDarkMode)} disabled:opacity-40 disabled:pointer-events-none`}
          >
            Reset all
          </button>
          {activeTab === 'Pick a Card' ? (
            <>
              <button
                type="button"
                onClick={shuffleCardOrder}
                disabled={shuffledDeck.length < 2}
                className={`${toolBtnClass(isDarkMode)} disabled:opacity-40 disabled:pointer-events-none`}
              >
                <Shuffle size={16} strokeWidth={2.5} />
                Shuffle
              </button>
              <CardSizeControl
                cardSize={cardSize}
                onChange={setCardSize}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </>
          ) : null}
        </ButtonRow>
      ) : null}

      {/* —— Randomizer —— */}
      {activeTab === 'Randomizer' && (
        <div className="flex items-center justify-center min-h-[55vh] px-2 relative">
          {selectedStudent ? (
            <div
              className={`flex flex-col items-center justify-center w-[20rem] sm:w-[22rem] h-[16.5rem] sm:h-[17.5rem] px-8 ${APP_GRID_CARD} transition-all duration-300 ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-300 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]'
              } ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}
            >
              <div className="mb-5 scale-[1.75] shrink-0">
                <StudentAvatar
                  student={selectedStudent}
                  theme={theme}
                  size="lg"
                  isDarkMode={isDarkMode}
                />
              </div>
              <h2
                className={`${TYPE.displaySm} text-center truncate w-full max-w-full ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
                title={selectedStudent.name}
              >
                {selectedStudent.name}
              </h2>
              <p
                className={`${TYPE.bodyMd} mt-2 h-5 truncate w-full text-center ${
                  selectedStudent.nickname
                    ? isDarkMode
                      ? 'text-slate-500'
                      : 'text-slate-400'
                    : 'invisible'
                }`}
              >
                “{selectedStudent.nickname || '—'}”
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-70">
              <Shuffle size={40} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
              <h3
                className={`${TYPE.titleLg} mt-6 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {!roster.length
                  ? 'This class has no students'
                  : !activeStudents.length
                    ? 'All students removed'
                    : 'Ready to pick a student'}
              </h3>
            </div>
          )}
        </div>
      )}

      {/* —— Wheel of Names —— */}
      {activeTab === 'Wheel of Names' && (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center relative px-2">
          {activeStudents.length > 0 ? (
            <div className="relative w-[300px] h-[300px] sm:w-[440px] sm:h-[440px]">
              <div
                className={`absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-0 h-0 border-y-[18px] border-y-transparent ${
                  isDarkMode ? 'border-r-white' : 'border-r-slate-800'
                }`}
                style={{ borderRightWidth: '32px' }}
              />
              <div
                className={`w-full h-full rounded-full overflow-hidden shadow-xl border-[6px] ${
                  isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-white bg-slate-50'
                }`}
              >
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinningWheel
                      ? 'transform 4s cubic-bezier(0.15, 0, 0, 1)'
                      : 'none',
                  }}
                >
                  {(() => {
                    const wheelChrome = wheelSvgChrome(isDarkMode);
                    return activeStudents.map((student, i) => {
                    const step = 360 / activeStudents.length;
                    const startAngle = i * step;
                    const endAngle = (i + 1) * step;
                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);
                    const x1 = 200 + 200 * Math.cos(startRad);
                    const y1 = 200 + 200 * Math.sin(startRad);
                    const x2 = 200 + 200 * Math.cos(endRad);
                    const y2 = 200 + 200 * Math.sin(endRad);
                    const pathD = `M 200 200 L ${x1} ${y1} A 200 200 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
                    const fontSize = activeStudents.length > 15 ? 10 : activeStudents.length > 10 ? 11 : 13;
                    const avatarSize = activeStudents.length > 15 ? 12 : 16;
                    // Name toward hub, avatar at the outer end (rim).
                    const avatarX = 186;
                    const textEndX = avatarX - avatarSize / 2 - 4;
                    const hubClearance = 58;
                    return (
                      <g key={student.id}>
                        <path
                          d={pathD}
                          fill={wheelSegmentFill(theme, i, activeStudents.length)}
                          fillOpacity={WHEEL_SEGMENT_OPACITY}
                          stroke={wheelChrome.segmentStroke}
                          strokeWidth="1"
                        />
                        <g
                          transform={`translate(200, 200) rotate(${(startAngle + endAngle) / 2 - 90})`}
                        >
                          <text
                            x={textEndX}
                            y="0"
                            fill={wheelChrome.label}
                            fontSize={fontSize}
                            fontWeight="bold"
                            dominantBaseline="central"
                            textAnchor="end"
                          >
                            {wheelNameLabel(student, fontSize, textEndX, hubClearance)}
                          </text>
                          <WheelSliceAvatar
                            student={student}
                            x={avatarX}
                            size={avatarSize}
                            isDarkMode={isDarkMode}
                          />
                        </g>
                      </g>
                    );
                  });
                  })()}
                </svg>
              </div>
              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinningWheel}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-[6px] flex items-center justify-center z-10 font-black text-sm sm:text-base ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                SPIN
              </button>
            </div>
          ) : (
            <EmptyPool isDarkMode={isDarkMode} icon={CircleDashed} />
          )}

          {wheelWinner && !isSpinningWheel ? (
            <div
              className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
                isDarkMode ? 'bg-slate-950/70' : 'bg-white/70'
              }`}
            >
              <div
                className={`flex flex-col items-center p-10 sm:p-12 ${APP_GRID_CARD} ${
                  isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-xl'
                }`}
              >
                <div className="scale-[1.5] mb-4">
                  <StudentAvatar
                    student={wheelWinner}
                    theme={theme}
                    size="lg"
                    isDarkMode={isDarkMode}
                  />
                </div>
                <h2
                  className={`${TYPE.displaySm} text-center mt-4 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {wheelWinner.name}
                </h2>
                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStudents((prev) => prev.filter((s) => s.id !== wheelWinner.id));
                      setWheelWinner(null);
                    }}
                    className={`px-6 py-2.5 rounded-xl ${TYPE.labelLg} border transition-colors ${
                      isDarkMode
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setWheelWinner(null)}
                    className={`px-6 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
                  >
                    Keep & close
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* —— Pick a Card —— */}
      {activeTab === 'Pick a Card' && (
        <div className="w-full relative min-h-[55vh]">
          {roster.length > 0 ? (
            <div
              className="grid gap-4 sm:gap-5 pt-2 pb-8"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
              }}
            >
              {shuffledDeck.map((student) => {
                const isFlipped = flippedCards.has(student.id);
                const avatarSize = cardSize >= 180 ? 'lg' : cardSize >= 130 ? 'md' : 'sm';
                return (
                  <button
                    key={student.id}
                    type="button"
                    ref={(el) => {
                      if (el) cardRefs.current.set(student.id, el);
                      else cardRefs.current.delete(student.id);
                    }}
                    onClick={() => setCardFlipped(student, !isFlipped)}
                    aria-label={
                      isFlipped
                        ? `Hide ${student.name}`
                        : `Reveal ${student.name}`
                    }
                    className={`aspect-[3/4.2] text-left transition-all duration-500 [transform-style:preserve-3d] relative rounded-2xl ${
                      isFlipped
                        ? '[transform:rotateY(180deg)]'
                        : 'hover:-translate-y-1 hover:shadow-lg shadow-sm'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl border-[5px] flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-600'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      <LogoIcon2x2 className="w-[42%] h-[42%] opacity-90" />
                    </div>
                    <div
                      className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border-[5px] flex flex-col items-center justify-center p-3 sm:p-4 ${
                        isDarkMode
                          ? 'bg-slate-900 text-white border-slate-600'
                          : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    >
                      <StudentAvatar
                        student={student}
                        theme={theme}
                        size={avatarSize}
                        isDarkMode={isDarkMode}
                      />
                      <div className={`${TYPE.labelMicro} text-center mt-2 sm:mt-3`}>
                        {student.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyPool isDarkMode={isDarkMode} icon={SquareStack} />
          )}
        </div>
      )}

      {/* —— Pull A Name —— */}
      {activeTab === 'Pull A Name' && (
        <div
          className="w-full min-h-[60vh] flex flex-col items-center justify-center relative touch-none select-none"
          onMouseMove={onPullDragMove}
          onMouseUp={onPullDragEnd}
          onMouseLeave={onPullDragEnd}
          onTouchMove={onPullDragMove}
          onTouchEnd={onPullDragEnd}
        >
          {activeStudents.length > 0 ? (
            <div className="relative w-72 sm:w-80 h-[400px] sm:h-[420px] flex flex-col items-center justify-end">
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-8 border-4 rounded-[2rem] z-0 ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-900'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {stagedStudent ? (
                  <>
                    <div
                      className={`transition-all duration-700 delay-300 ${
                        hasPulledName ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                      }`}
                    >
                      <StudentAvatar
                        student={stagedStudent}
                        theme={theme}
                        size="lg"
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    <h2
                      className={`${TYPE.displaySm} text-center mt-5 transition-all duration-700 delay-400 ${
                        hasPulledName
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-4 opacity-0'
                      } ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    >
                      {stagedStudent.name}
                    </h2>
                    <div
                      className={`mt-8 flex flex-col w-full gap-3 transition-all duration-500 delay-700 ${
                        hasPulledName
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-4 pointer-events-none'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={handlePullRemove}
                        className={`w-full py-2.5 rounded-xl ${TYPE.labelLg} border ${
                          isDarkMode
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={resetPull}
                        className={`w-full py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
                      >
                        Keep & next
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <div
                onMouseDown={onPullDragStart}
                onTouchStart={onPullDragStart}
                className={`absolute inset-0 w-full h-full rounded-[2rem] border-[6px] shadow-xl flex flex-col items-center justify-center z-10 cursor-grab active:cursor-grabbing select-none ${
                  !isPullDragging && !hasPulledName
                    ? 'transition-transform duration-300'
                    : hasPulledName
                      ? 'transition-all duration-700 ease-in-out'
                      : 'duration-0'
                } ${theme.colorPrimary} ${theme.border}`}
                style={{
                  transform: `translateY(${pullDragY}px) ${
                    hasPulledName ? 'rotate(-5deg) scale(0.9)' : ''
                  }`,
                  opacity: hasPulledName ? 0 : 1,
                  pointerEvents: hasPulledName ? 'none' : 'auto',
                }}
              >
                <div className="absolute top-6 w-14 h-1.5 bg-white/40 rounded-full" />
                <LogoIcon2x2 className="w-22 h-22 text-white mb-5 drop-shadow-md" monochrome />
                <div className="text-white font-black text-xl tracking-widest uppercase drop-shadow-sm">
                  Pull a name
                </div>
                <div className="absolute bottom-10 flex flex-col items-center opacity-80">
                  <GripHorizontal className="text-white mb-2" size={22} />
                  <span className={`text-white ${TYPE.labelMicro}`}>
                    Drag up
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyPool isDarkMode={isDarkMode} icon={Inbox} />
          )}
        </div>
      )}

      {activeTab !== 'Pull A Name' && (
        <button
          type="button"
          onClick={
            activeTab === 'Randomizer'
              ? pickRandomStudent
              : activeTab === 'Wheel of Names'
                ? spinWheel
                : activeTab === 'Pick a Card'
                  ? pickAndFlipCard
                  : handleShuffleDeck
          }
          disabled={
            (activeTab !== 'Randomizer' && activeStudents.length === 0) ||
            (activeTab === 'Randomizer' && activeStudents.length === 0) ||
            isAnimating ||
            isSpinningWheel
          }
          className={`${appFabClass(isLeft)} ${theme.colorOnPrimary} ${theme.colorPrimary} ${
            isAnimating || isSpinningWheel ? 'animate-pulse' : ''
          }`}
          aria-label={
            activeTab === 'Randomizer'
              ? 'Pick a student'
              : activeTab === 'Wheel of Names'
                ? 'Spin the wheel'
                : activeTab === 'Pick a Card'
                  ? 'Pick a card'
                  : 'Shuffle cards'
          }
        >
          {activeTab === 'Wheel of Names' ? (
            <Play size={22} strokeWidth={2.5} fill="currentColor" />
          ) : (
            <Shuffle size={22} strokeWidth={2.5} />
          )}
        </button>
      )}
    </AppPageShell>
  );
}

function EmptyPool({ isDarkMode, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center opacity-70 py-16">
      <div
        className={`w-20 h-20 mb-5 rounded-full flex items-center justify-center ${
          isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
        }`}
      >
        <Icon size={32} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
      </div>
      <h3 className={`${TYPE.titleLg} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        All students removed
      </h3>
      <p className={`${TYPE.bodyMd} mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        Reset the active list to continue.
      </p>
    </div>
  );
}
