import { useEffect, useState } from 'react';
import { GripHorizontal, Inbox, UserRound } from 'lucide-react';
import { useRandomizerActivePool } from '../../../data/randomizer/RandomizerPoolContext';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { EmptyState } from '../../../shared/EmptyState';
import { LogoIcon2x2 } from '../../../shared/Logo';
import { WidgetToolBar } from './WidgetToolBar';
import { AppPageShell } from '../../../shared/AppPageShell';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

/**
 * Dashboard teaching widget — Pull a Name.
 */
export function PullANameWidget({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const {
    selectedClass,
    roster,
    activeStudents,
    setActiveStudents,
    resetActive,
  } = useRandomizerActivePool('Pull A Name');
  const [pullDragY, setPullDragY] = useState(0);
  const [isPullDragging, setIsPullDragging] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [hasPulledName, setHasPulledName] = useState(false);
  const [stagedStudent, setStagedStudent] = useState(null);

  useEffect(() => {
    setHasPulledName(false);
    setPullDragY(0);
    setStagedStudent(null);
  }, [selectedClass?.id]);

  useEffect(() => {
    if (
      activeStudents.length > 0 &&
      !stagedStudent &&
      !hasPulledName
    ) {
      setStagedStudent(
        activeStudents[Math.floor(Math.random() * activeStudents.length)]
      );
    }
  }, [activeStudents, stagedStudent, hasPulledName]);

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

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to pull a name."
        isDarkMode={isDarkMode}
        illustration={<UserRound size={36} className="text-slate-400" />}
      />
    );
  }

  const resetPool = () => {
    resetActive();
    resetPull();
  };

  if (activeStudents.length === 0) {
    return (
      <div className="w-full min-h-[50vh] relative px-2">
        <WidgetToolBar
          activeStudents={activeStudents}
          roster={roster}
          theme={theme}
          isDarkMode={isDarkMode}
          onReset={resetPool}
        />
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <EmptyState
            message="No students left in the cup. Reset the pool or choose another class."
            isDarkMode={isDarkMode}
            illustration={<Inbox size={36} className="text-slate-400" />}
          />
        </div>
      </div>
    );
  }

  return (
    <AppPageShell
      variant="scroll"
      className="w-full min-h-[60vh] flex flex-col relative touch-none select-none"
      onMouseMove={onPullDragMove}
      onMouseUp={onPullDragEnd}
      onMouseLeave={onPullDragEnd}
      onTouchMove={onPullDragMove}
      onTouchEnd={onPullDragEnd}
    >
      <WidgetToolBar
        activeStudents={activeStudents}
        roster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
        onReset={resetPool}
      />
      <div className="flex-1 flex flex-col items-center justify-center">
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
      </div>
    </AppPageShell>
  );
}
