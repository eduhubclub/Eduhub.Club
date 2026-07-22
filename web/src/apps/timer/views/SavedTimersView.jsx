import { useState } from 'react';
import { Archive, Layers, Plus, Users, Timer as TimerIcon } from 'lucide-react';
import { labelFromDuration, minutesFromDuration } from '../timerUtils';
import { TimerCard } from '../components/TimerCard';
import { SavedRotationCard } from '../components/SavedRotationCard';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { APP_EMPTY_SLOT, appFabClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

export function SavedTimersView({
  isDarkMode,
  theme,
  isLeft,
  savedTimers,
  onRemove,
  onLoadRotation,
  onAddTimer,
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const rotations = savedTimers.filter((t) => t.type === 'rotation');
  const wholeClass = savedTimers.filter((t) => t.type !== 'rotation');

  return (
    <div className="relative flex-1 flex flex-col min-h-0 mt-2">
      {savedTimers.length > 0 ? (
        <div className="flex-1 overflow-y-auto pb-24 space-y-10">
          {rotations.length > 0 ? (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                >
                  <Layers size={18} />
                </div>
                <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  Saved Group Rotations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rotations.map((timer) => (
                  <SavedRotationCard
                    key={timer.id}
                    title={timer.label}
                    groups={timer.groups}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onClick={() => onLoadRotation(timer)}
                    onRemove={() => onRemove(timer.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {wholeClass.length > 0 ? (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                >
                  <Users size={18} />
                </div>
                <h3 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
                  Saved Whole Class Timers
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wholeClass.map((timer) => (
                  <TimerCard
                    key={timer.id}
                    title={timer.label}
                    initialMinutes={timer.min}
                    isDarkMode={isDarkMode}
                    theme={theme}
                    onClose={() => onRemove(timer.id)}
                    digitalOnly
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center text-center py-20 ${APP_EMPTY_SLOT} ${
            isDarkMode ? `${theme.colorOutline}` : `${theme.colorOutlineVariant}`
          } ${theme.colorOnSurfaceVariant}`}
        >
          <Archive size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className={`${TYPE.titleLg} mb-2 ${theme.colorOnSurface}`}>No Saved Timers</h3>
          <p className={`${TYPE.bodyMd} max-w-md`}>
            Create a saved timer with the + button below, or save a group rotation from
            Small Group.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsAddOpen(true)}
        className={`${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        title="Create saved timer"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <TimerSetupModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onStart={(min, sec) => {
          const m = parseInt(min, 10) || 0;
          const s = parseInt(sec, 10) || 0;
          if (m === 0 && s === 0) return;
          onAddTimer({
            id: `saved-${Date.now()}`,
            type: 'timer',
            label: labelFromDuration(min, sec),
            min: minutesFromDuration(min, sec),
          });
          setIsAddOpen(false);
        }}
        isDarkMode={isDarkMode}
        theme={theme}
        title="Saved Timer"
        icon={TimerIcon}
        startLabel="Save"
      />
    </div>
  );
}
