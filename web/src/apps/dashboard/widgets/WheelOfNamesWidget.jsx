import { useEffect, useState } from 'react';
import { CircleDashed } from 'lucide-react';
import {
  AVATAR_TYPES,
  getAvatarInitials,
  normalizeAvatar,
} from '../../../data/classes/avatar';
import { useRandomizerActivePool } from '../../../data/randomizer/RandomizerPoolContext';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { EmptyState } from '../../../shared/EmptyState';
import { WidgetToolBar } from './WidgetToolBar';
import { AppPageShell } from '../../../shared/AppPageShell';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';
import {
  wheelSegmentFill,
  WHEEL_SEGMENT_OPACITY,
  wheelSvgChrome,
} from '../../../shared/wheelColors';

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
    const clipId = `dash-wheel-av-${student.id}`;
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
 * Dashboard teaching widget — Wheel of Names only (not the full Randomizer app).
 */
export function WheelOfNamesWidget({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const {
    selectedClass,
    roster,
    activeStudents,
    setActiveStudents,
    resetActive,
  } = useRandomizerActivePool('Wheel of Names');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelWinner, setWheelWinner] = useState(null);

  useEffect(() => {
    setWheelWinner(null);
    setWheelRotation(0);
  }, [selectedClass?.id]);

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

    setTimeout(() => {
      setIsSpinningWheel(false);
      setWheelWinner(winner);
      if (winner?.name) announce(`${winner.name} was picked`);
    }, 4000);
  };

  if (!selectedClass) {
    return (
      <EmptyState
        message="Pick a class from the sidebar to spin the Wheel of Names."
        isDarkMode={isDarkMode}
        illustration={<CircleDashed size={36} className="text-slate-400" />}
      />
    );
  }

  const resetPool = () => {
    resetActive();
    setWheelWinner(null);
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
            message="No students left on the wheel. Reset the pool or choose another class."
            isDarkMode={isDarkMode}
            illustration={<CircleDashed size={36} className="text-slate-400" />}
          />
        </div>
      </div>
    );
  }

  return (
    <AppPageShell variant="scroll" className="w-full min-h-[60vh] flex flex-col relative">
      <WidgetToolBar
        activeStudents={activeStudents}
        roster={roster}
        theme={theme}
        isDarkMode={isDarkMode}
        onReset={resetPool}
      />
      <div className="flex-1 flex flex-col items-center justify-center relative">
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
              const fontSize =
                activeStudents.length > 15 ? 10 : activeStudents.length > 10 ? 11 : 13;
              const avatarSize = activeStudents.length > 15 ? 12 : 16;
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

      {wheelWinner && !isSpinningWheel ? (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
            isDarkMode ? 'bg-slate-950/70' : 'bg-white/70'
          }`}
        >
          <div
            className={`flex flex-col items-center p-10 sm:p-12 ${APP_GRID_CARD} ${
              isDarkMode
                ? 'bg-slate-900 border-slate-700'
                : 'bg-white border-slate-300 shadow-xl'
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
                  setActiveStudents((prev) =>
                    prev.filter((s) => s.id !== wheelWinner.id)
                  );
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
    </AppPageShell>
  );
}
