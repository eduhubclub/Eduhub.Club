import { useEffect, useRef, useState } from 'react';
import { Shuffle, SquareStack } from 'lucide-react';
import { useRandomizerActivePool } from '../../../data/randomizer/RandomizerPoolContext';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { EmptyState } from '../../../shared/EmptyState';
import { LogoIcon2x2 } from '../../../shared/Logo';
import { WidgetToolBar } from './WidgetToolBar';
import { AppPageShell } from '../../../shared/AppPageShell';
import { appFabClass } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import { studentDisplayName } from '../../../data/students/displayName';

/**
 * Dashboard teaching widget — Pick a Card.
 */
export function PickACardWidget({ isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const {
    selectedClass,
    roster,
    activeStudents,
    setActiveStudents,
    resetActive,
  } = useRandomizerActivePool('Pick a Card');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [flippedCards, setFlippedCards] = useState(() => new Set());
  const cardRefs = useRef(new Map());
  const cardSize = 140;

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
    if (shouldFlip) announce(`${studentDisplayName(student)} was revealed`);
  };

  const scrollToCard = (studentId) => {
    window.setTimeout(() => {
      const el = cardRefs.current.get(studentId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 60);
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
    if (pick) announce(`${studentDisplayName(pick)} was picked`);
  };

  const resetAll = () => {
    resetActive();
    setShuffledDeck([...(roster || [])].sort(() => Math.random() - 0.5));
    setFlippedCards(new Set());
  };

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to deal cards."
        isDarkMode={isDarkMode}
        illustration={<SquareStack size={36} className="text-slate-400" />}
      />
    );
  }

  if (!roster.length) {
    return (
      <EmptyState
        message="This class has no students yet."
        isDarkMode={isDarkMode}
        illustration={<SquareStack size={36} className="text-slate-400" />}
      />
    );
  }

  return (
    <AppPageShell variant="scroll" className="relative w-full min-h-[60vh]">
      <WidgetToolBar
        activeStudents={activeStudents}
        roster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
        onReset={resetAll}
      >
        <button
          type="button"
          onClick={() =>
            setShuffledDeck((prev) => [...prev].sort(() => Math.random() - 0.5))
          }
          disabled={shuffledDeck.length < 2}
          className={`${toolBtnClass(isDarkMode)} disabled:opacity-40 disabled:pointer-events-none`}
        >
          <Shuffle size={16} strokeWidth={2.5} />
          Shuffle
        </button>
      </WidgetToolBar>

      <div
        className="grid gap-4 sm:gap-5 pt-2 pb-8"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
        }}
      >
        {shuffledDeck.map((student) => {
          const isFlipped = flippedCards.has(student.id);
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
                isFlipped ? `Hide ${studentDisplayName(student)}` : `Reveal ${studentDisplayName(student)}`
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
                  size="md"
                  isDarkMode={isDarkMode}
                />
                <div className={`${TYPE.labelMicro} text-center mt-2 sm:mt-3`}>
                  {studentDisplayName(student)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={pickAndFlipCard}
        disabled={activeStudents.length === 0}
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        aria-label="Pick a card"
      >
        <Shuffle size={22} strokeWidth={2.5} />
      </button>
    </AppPageShell>
  );
}
