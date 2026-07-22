import { useEffect, useMemo, useRef, useState } from 'react';
import { Swords, Trophy, User, Users } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { ButtonRow } from '../../../shared/ButtonRow';
import { EmptyState } from '../../../shared/EmptyState';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import {
  APP_BOARD_MAX_WIDTH,
  APP_EMPTY_SLOT,
  appFabClass,
  APP_GRID_CARD,
  APP_NESTED_CARD,
} from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

function shuffleRoster(roster) {
  const next = [...roster];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * 1v1 student matchup + class split into Team A / Team B.
 */
export function StudentShowdownView({ isDarkMode, theme, isLeft }) {
  const announce = useAnnounce();
  const { selectedClass } = useClasses();
  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass]
  );

  const [mode, setMode] = useState('1v1'); // '1v1' | 'team'
  const [isShufflingShowdown, setIsShufflingShowdown] = useState(false);
  const [showdownCompetitors, setShowdownCompetitors] = useState([]);
  const [isShufflingClass, setIsShufflingClass] = useState(false);
  const [classTeams, setClassTeams] = useState({ teamA: [], teamB: [] });
  const [rowWinners, setRowWinners] = useState({});
  const showdownIntervalRef = useRef(null);
  const classIntervalRef = useRef(null);

  const clearShowdownInterval = () => {
    if (showdownIntervalRef.current) {
      clearInterval(showdownIntervalRef.current);
      showdownIntervalRef.current = null;
    }
  };

  const clearClassInterval = () => {
    if (classIntervalRef.current) {
      clearInterval(classIntervalRef.current);
      classIntervalRef.current = null;
    }
  };

  useEffect(() => {
    clearShowdownInterval();
    clearClassInterval();
    setIsShufflingShowdown(false);
    setIsShufflingClass(false);
    setShowdownCompetitors([]);
    setClassTeams({ teamA: [], teamB: [] });
    setRowWinners({});
  }, [selectedClass?.id]);

  useEffect(() => () => {
    clearShowdownInterval();
    clearClassInterval();
  }, []);

  const handleStudentShowdown = () => {
    if (roster.length < 2 || isShufflingShowdown) return;
    clearShowdownInterval();
    setIsShufflingShowdown(true);
    let count = 0;
    let finalPair = [];
    showdownIntervalRef.current = setInterval(() => {
      const shuffled = shuffleRoster(roster);
      finalPair = shuffled.slice(0, 2);
      setShowdownCompetitors(finalPair);
      count += 1;
      if (count > 15) {
        clearShowdownInterval();
        setIsShufflingShowdown(false);
        const a = finalPair[0]?.name;
        const b = finalPair[1]?.name;
        if (a && b) announce(`${a} versus ${b}`);
      }
    }, 80);
  };

  const handleClassShowdown = () => {
    if (roster.length < 2 || isShufflingClass) return;
    clearClassInterval();
    setIsShufflingClass(true);
    setRowWinners({});
    let count = 0;
    let finalTeams = { teamA: [], teamB: [] };
    classIntervalRef.current = setInterval(() => {
      const shuffled = shuffleRoster(roster);
      const half = Math.ceil(shuffled.length / 2);
      finalTeams = {
        teamA: shuffled.slice(0, half),
        teamB: shuffled.slice(half),
      };
      setClassTeams(finalTeams);
      count += 1;
      if (count > 15) {
        clearClassInterval();
        setIsShufflingClass(false);
        announce(
          `Teams ready. Team A has ${finalTeams.teamA.length}, Team B has ${finalTeams.teamB.length}.`,
        );
      }
    }, 80);
  };

  const handleDragStart = (e, student, team) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ id: student.id, sourceTeam: team })
    );
  };

  const handleDropContainer = (e, targetTeam) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.sourceTeam === targetTeam) return;
      const student = classTeams[data.sourceTeam].find((s) => s.id === data.id);
      if (!student) return;
      setClassTeams((prev) => ({
        ...prev,
        [data.sourceTeam]: prev[data.sourceTeam].filter((s) => s.id !== data.id),
        [targetTeam]: [...prev[targetTeam], student],
      }));
      setRowWinners({});
    } catch {
      /* ignore */
    }
  };

  const handleDropItem = (e, targetTeam, targetStudentId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.id === targetStudentId) return;
      const student = classTeams[data.sourceTeam].find((s) => s.id === data.id);
      if (!student) return;

      setClassTeams((prev) => {
        let newSource = [...prev[data.sourceTeam]];
        let newTarget =
          data.sourceTeam === targetTeam ? newSource : [...prev[targetTeam]];
        newSource = newSource.filter((s) => s.id !== data.id);
        if (data.sourceTeam === targetTeam) newTarget = newSource;
        const targetIndex = newTarget.findIndex((s) => s.id === targetStudentId);
        newTarget.splice(targetIndex, 0, student);
        return {
          ...prev,
          [data.sourceTeam]: newSource,
          [targetTeam]: newTarget,
        };
      });
      setRowWinners({});
    } catch {
      /* ignore */
    }
  };

  const toggleRowWinner = (rowIndex, team) => {
    const prevWinner = rowWinners[rowIndex];
    const nextWinner = prevWinner === team ? null : team;
    const student =
      team === 'teamA'
        ? classTeams.teamA[rowIndex]
        : classTeams.teamB[rowIndex];
    setRowWinners((prev) => ({
      ...prev,
      [rowIndex]: nextWinner,
    }));
    if (nextWinner && student?.name) {
      announce(`${student.name} wins the matchup`);
    } else if (!nextWinner) {
      announce(`Row ${rowIndex + 1} cleared`);
    }
  };

  const teamAScore = Object.values(rowWinners).filter((v) => v === 'teamA').length;
  const teamBScore = Object.values(rowWinners).filter((v) => v === 'teamB').length;

  const surface = isDarkMode
    ? 'bg-slate-900 border-slate-700'
    : 'bg-white border-slate-200';

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to run a showdown."
        isDarkMode={isDarkMode}
        illustration={<Swords size={36} className="text-slate-400" />}
      />
    );
  }

  if (roster.length < 2) {
    return (
      <EmptyState
        message="This class needs at least two students for a showdown."
        isDarkMode={isDarkMode}
        illustration={<Users size={36} className="text-slate-400" />}
      />
    );
  }

  const isBusy = isShufflingShowdown || isShufflingClass;
  const handleFab = () => {
    if (isBusy) return;
    if (mode === '1v1') handleStudentShowdown();
    else handleClassShowdown();
  };

  return (
    <>
    <div className={`w-full ${APP_BOARD_MAX_WIDTH} mx-auto flex flex-col`}>
      <ButtonRow>
        <div
          className={`relative grid grid-cols-2 p-1 rounded-xl ${
            isDarkMode
              ? 'bg-slate-800'
              : 'bg-white border border-slate-300'
          }`}
          role="group"
          aria-label="Showdown mode"
        >
          <span
            aria-hidden
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-out ${theme.colorPrimary} ${
              mode === 'team' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            aria-pressed={mode === '1v1'}
            onClick={() => setMode('1v1')}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg ${TYPE.labelMd} transition-colors ${
              mode === '1v1'
                ? theme.colorOnPrimary
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <User size={16} strokeWidth={2.5} />
            1 v 1
          </button>
          <button
            type="button"
            aria-pressed={mode === 'team'}
            onClick={() => setMode('team')}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg ${TYPE.labelMd} transition-colors ${
              mode === 'team'
                ? theme.colorOnPrimary
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users size={16} strokeWidth={2.5} />
            Team
          </button>
        </div>
      </ButtonRow>

      {mode === '1v1' ? (
        <div
          className={`${APP_GRID_CARD} p-6 md:p-8 flex flex-col items-center relative overflow-hidden ${surface}`}
        >
          <h2
            className={`${TYPE.titleLg} mb-6 text-center ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            1 v 1 Matchup
          </h2>

          {showdownCompetitors.length > 0 ? (
            <div
              className={`w-full flex-1 flex justify-around items-center transition-all duration-150 min-h-[180px] ${
                isShufflingShowdown
                  ? 'blur-sm scale-95 opacity-50'
                  : 'opacity-100 scale-100'
              }`}
            >
              {showdownCompetitors.map((student, i) => (
                <div key={student.id} className="flex flex-col items-center relative w-1/2 px-2">
                  <div
                    className={`w-full max-w-[10.5rem] ${APP_NESTED_CARD} px-3 py-4 flex flex-col items-center ${
                      isDarkMode
                        ? 'bg-slate-800/60 border-slate-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <StudentAvatar
                      student={student}
                      theme={theme}
                      size="lg"
                      isDarkMode={isDarkMode}
                    />
                    <div
                      className={`mt-3 ${TYPE.titleSm} text-center ${
                        i === 0
                          ? theme.text
                          : isDarkMode
                            ? 'text-rose-300'
                            : 'text-rose-600'
                      }`}
                    >
                      {student.name}
                    </div>
                  </div>
                  {i === 0 ? (
                    <div className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className={`bg-slate-900 text-white ${TYPE.labelMicro} px-3 py-1.5 rounded-full border-2 border-white shadow-xl`}>
                        VS
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 opacity-40 py-10 min-h-[180px]">
              <User size={56} className="mb-3" />
              <p className={`${TYPE.titleSm} text-center px-6`}>Ready for a head-to-head?</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`${APP_GRID_CARD} p-6 md:p-8 flex flex-col items-center relative overflow-hidden ${surface}`}
        >
          {teamAScore > 0 || teamBScore > 0 ? (
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full ${TYPE.labelMicro} shadow-sm z-20 flex items-center gap-5 border-2 ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className={`${theme.text} flex items-center gap-2`}>
                <Trophy size={14} /> {teamAScore}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-500 flex items-center gap-2">
                {teamBScore} <Trophy size={14} />
              </span>
            </div>
          ) : null}

          <h2
            className={`${TYPE.titleLg} mb-6 mt-2 text-center ${theme.colorOnPrimaryContainer}`}
          >
            Team Versus
          </h2>

          {classTeams.teamA.length > 0 || classTeams.teamB.length > 0 ? (
            <div
              className={`w-full flex-1 transition-all duration-150 ${
                isShufflingClass ? 'blur-sm scale-95 opacity-50' : 'opacity-100 scale-100'
              }`}
            >
              <TeamVersusBoard
                teamA={classTeams.teamA}
                teamB={classTeams.teamB}
                rowWinners={rowWinners}
                theme={theme}
                isDarkMode={isDarkMode}
                onDragStart={handleDragStart}
                onDropContainer={handleDropContainer}
                onDropItem={handleDropItem}
                onToggleWinner={toggleRowWinner}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 opacity-40 py-10 min-h-[180px]">
              <Users size={56} className="mb-3" />
              <p className={`${TYPE.titleSm} text-center px-6`}>
                Split the class into two teams
              </p>
            </div>
          )}
        </div>
      )}
    </div>

      <button
        type="button"
        onClick={handleFab}
        disabled={isBusy}
        aria-label={
          mode === '1v1'
            ? isBusy
              ? 'Selecting students'
              : 'Pick 2 students'
            : isBusy
              ? 'Splitting teams'
              : 'Split class teams'
        }
        title={mode === '1v1' ? 'Pick 2 Students' : 'Split Class Teams'}
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
      >
        <Swords size={24} />
      </button>
    </>
  );
}

function TeamVersusBoard({
  teamA,
  teamB,
  rowWinners,
  theme,
  isDarkMode,
  onDragStart,
  onDropContainer,
  onDropItem,
  onToggleWinner,
}) {
  const shell = isDarkMode
    ? 'bg-slate-800/60 border-slate-600'
    : 'bg-slate-50 border-slate-200';
  const rowCount = Math.max(teamA.length, teamB.length);
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="w-full flex items-stretch gap-2 min-h-[160px]">
      <TeamColumnCard
        title="Team A"
        titleClass={theme.text}
        teamKey="teamA"
        students={teamA}
        rowCount={rowCount}
        rowWinners={rowWinners}
        theme={theme}
        isDarkMode={isDarkMode}
        shell={shell}
        onDragStart={onDragStart}
        onDropContainer={onDropContainer}
        onDropItem={onDropItem}
        onToggleWinner={onToggleWinner}
      />

      {/* Match team cards: border-2 top + p-3, then h-4 title + mb-3 */}
      <div className="w-8 sm:w-10 shrink-0 flex flex-col border-t-2 border-transparent pt-3 pb-3">
        <div className="h-4 mb-3 shrink-0" aria-hidden />
        <div className="flex flex-col gap-2">
          {rows.map((i) => (
            <div key={`vs-${i}`} className="h-12 flex items-center justify-center">
              <span className={`${TYPE.labelMicro} text-slate-400`}>VS</span>
            </div>
          ))}
        </div>
      </div>

      <TeamColumnCard
        title="Team B"
        titleClass={isDarkMode ? 'text-rose-300' : 'text-rose-600'}
        teamKey="teamB"
        students={teamB}
        rowCount={rowCount}
        rowWinners={rowWinners}
        theme={theme}
        isDarkMode={isDarkMode}
        shell={shell}
        onDragStart={onDragStart}
        onDropContainer={onDropContainer}
        onDropItem={onDropItem}
        onToggleWinner={onToggleWinner}
      />
    </div>
  );
}

function TeamColumnCard({
  title,
  titleClass,
  teamKey,
  students,
  rowCount,
  rowWinners,
  theme,
  isDarkMode,
  shell,
  onDragStart,
  onDropContainer,
  onDropItem,
  onToggleWinner,
}) {
  return (
    <div
      className={`flex-1 min-w-0 ${APP_NESTED_CARD} p-3 flex flex-col ${shell}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropContainer(e, teamKey)}
    >
      <h4
        className={`h-4 mb-3 ${TYPE.labelMicro} text-center leading-4 ${titleClass}`}
      >
        {title}
      </h4>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rowCount }).map((_, i) => (
          <TeamStudentSlot
            key={`${teamKey}-${students[i]?.id ?? `empty-${i}`}`}
            student={students[i] ?? null}
            teamKey={teamKey}
            rowIndex={i}
            rowWinners={rowWinners}
            theme={theme}
            isDarkMode={isDarkMode}
            onDragStart={onDragStart}
            onDropContainer={onDropContainer}
            onDropItem={onDropItem}
            onToggleWinner={onToggleWinner}
          />
        ))}
      </div>
    </div>
  );
}

function TeamStudentSlot({
  student,
  teamKey,
  rowIndex,
  rowWinners,
  theme,
  isDarkMode,
  onDragStart,
  onDropContainer,
  onDropItem,
  onToggleWinner,
}) {
  if (!student) {
    return (
      <div
        className={`h-12 ${APP_EMPTY_SLOT} ${
          isDarkMode ? 'border-slate-600' : 'border-slate-300'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.stopPropagation();
          onDropContainer(e, teamKey);
        }}
      />
    );
  }

  const isWinner = rowWinners[rowIndex] === teamKey;
  const isLoser = rowWinners[rowIndex] && rowWinners[rowIndex] !== teamKey;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, student, teamKey)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDropItem(e, teamKey, student.id)}
      onClick={() => onToggleWinner(rowIndex, teamKey)}
      className={`flex items-center h-12 w-full min-w-0 ${TYPE.labelMd} px-2.5 rounded-2xl shadow-sm border-2 cursor-grab active:cursor-grabbing transition-all ${
        isWinner
          ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent shadow-md z-10`
          : isLoser
            ? isDarkMode
              ? 'bg-slate-900 text-slate-500 border-slate-600 opacity-40'
              : 'bg-white text-slate-400 border-slate-200 opacity-40'
            : isDarkMode
              ? 'bg-slate-900 text-slate-200 border-slate-600 hover:border-slate-600'
              : 'bg-white text-slate-700 border-slate-200 hover:shadow-md'
      }`}
      title={student.name}
    >
      <StudentAvatar
        student={student}
        theme={theme}
        size="xs"
        isDarkMode={isDarkMode}
      />
      <span className="ml-2 truncate pointer-events-none">{student.name}</span>
    </div>
  );
}
