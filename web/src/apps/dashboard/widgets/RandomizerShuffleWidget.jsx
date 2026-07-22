import { useEffect, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { useRandomizerActivePool } from '../../../data/randomizer/RandomizerPoolContext';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { EmptyState } from '../../../shared/EmptyState';
import { WidgetToolBar } from './WidgetToolBar';
import { AppPageShell } from '../../../shared/AppPageShell';
import { appFabClass, APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

/**
 * Dashboard teaching widget — shuffle picker (Randomizer mode).
 */
export function RandomizerShuffleWidget({ isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const {
    selectedClass,
    roster,
    activeStudents,
    setActiveStudents,
    resetActive,
  } = useRandomizerActivePool('Randomizer');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setSelectedStudent(null);
  }, [selectedClass?.id]);

  const pickRandomStudent = () => {
    if (isAnimating || activeStudents.length === 0) return;
    setIsAnimating(true);
    let shuffles = 0;
    const maxShuffles = 12;
    let finalPick = null;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * activeStudents.length);
      finalPick = activeStudents[randomIndex];
      setSelectedStudent(finalPick);
      shuffles += 1;
      if (shuffles >= maxShuffles) {
        clearInterval(interval);
        setIsAnimating(false);
        if (finalPick?.name) announce(`${finalPick.name} was picked`);
      }
    }, 75);
  };

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to use the Randomizer."
        isDarkMode={isDarkMode}
        illustration={<Shuffle size={36} className="text-slate-400" />}
      />
    );
  }

  const resetPool = () => {
    resetActive();
    setSelectedStudent(null);
  };

  return (
    <AppPageShell variant="scroll" className="relative w-full min-h-[60vh] flex flex-col">
      <WidgetToolBar
        activeStudents={activeStudents}
        roster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
        onReset={resetPool}
      />
      <div className="flex-1 flex flex-col items-center justify-center">
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
            <Shuffle
              size={40}
              className={isDarkMode ? 'text-slate-600' : 'text-slate-400'}
            />
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

        {activeStudents.length > 0 && selectedStudent && !isAnimating ? (
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveStudents((prev) =>
                  prev.filter((s) => s.id !== selectedStudent.id)
                );
                setSelectedStudent(null);
              }}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} border ${
                isDarkMode
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={pickRandomStudent}
        disabled={activeStudents.length === 0 || isAnimating}
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary} ${
          isAnimating ? 'animate-pulse' : ''
        }`}
        aria-label="Shuffle pick"
      >
        <Shuffle size={22} strokeWidth={2.5} />
      </button>
    </AppPageShell>
  );
}
