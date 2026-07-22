import { useState } from 'react';
import { Plus, Timer as TimerIcon, X } from 'lucide-react';
import { DEFAULT_WHOLE_CLASS_PRESETS } from '../constants';
import { labelFromDuration, minutesFromDuration } from '../timerUtils';
import { TimerCard } from '../components/TimerCard';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { appFabClass, APP_GRID_CARD } from '../../../shared/layout';

export function WholeClassView({ isDarkMode, theme, isLeft }) {
  const [presets, setPresets] = useState(DEFAULT_WHOLE_CLASS_PRESETS);
  const [activeTimer, setActiveTimer] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleSave = (min, sec) => {
    const m = parseInt(min, 10) || 0;
    const s = parseInt(sec, 10) || 0;
    if (m === 0 && s === 0) return;
    setPresets((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: labelFromDuration(min, sec),
        min: minutesFromDuration(min, sec),
        isCustom: true,
      },
    ]);
    setIsCustomModalOpen(false);
  };

  const handleStart = (min, sec) => {
    const m = parseInt(min, 10) || 0;
    const s = parseInt(sec, 10) || 0;
    if (m === 0 && s === 0) return;
    setIsCustomModalOpen(false);
    setActiveTimer({
      id: `custom-${Date.now()}`,
      label: labelFromDuration(min, sec),
      min: minutesFromDuration(min, sec),
      autoStart: true,
    });
  };

  const removePreset = (id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {!activeTimer ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 pt-2 pb-20 overflow-y-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActiveTimer(preset)}
              className={`relative py-4 pl-5 ${preset.isCustom ? 'pr-10' : 'pr-5'} ${APP_GRID_CARD} flex items-center justify-start transition-all hover:scale-[1.02] active:scale-[0.98] group ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <TimerIcon
                size={24}
                className={`mr-3 shrink-0 opacity-80 ${theme.colorOnSurfaceVariant} group-hover:opacity-100`}
              />
              <p
                className={`text-xl md:text-2xl font-mono font-black whitespace-nowrap ${theme.colorOnSurface}`}
              >
                {preset.label}
              </p>
              {preset.isCustom ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreset(preset.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      removePreset(preset.id);
                    }
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors z-20 ${theme.colorOnSurfaceVariant} hover:text-rose-500`}
                >
                  <X size={18} />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full pb-2 min-h-0">
          <TimerCard
            key={activeTimer.label}
            title={activeTimer.label}
            initialMinutes={activeTimer.min}
            isDarkMode={isDarkMode}
            theme={theme}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onClose={() => {
              setActiveTimer(null);
              setIsFullscreen(false);
            }}
            large
            autoStart={activeTimer.autoStart}
          />
        </div>
      )}

      {!activeTimer ? (
        <button
          type="button"
          onClick={() => setIsCustomModalOpen(true)}
          className={`${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          title="Create custom timer"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      ) : null}

      <TimerSetupModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSave}
        onStart={handleStart}
        isDarkMode={isDarkMode}
        theme={theme}
        title="Custom Timer"
        icon={TimerIcon}
        showSavePreset
      />
    </div>
  );
}
