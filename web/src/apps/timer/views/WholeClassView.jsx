import { useState } from 'react';
import { Pencil, Plus, Timer as TimerIcon, Trash2 } from 'lucide-react';
import { DEFAULT_WHOLE_CLASS_PRESETS } from '../constants';
import { labelFromDuration, minutesFromDuration } from '../timerUtils';
import { TimerCard } from '../components/TimerCard';
import { TimerSetupModal } from '../components/TimerSetupModal';
import { appFabClass, APP_GRID_CARD } from '../../../shared/layout';

/** Split fractional minutes into modal min/sec fields. */
function partsFromMinutes(totalMin) {
  const totalSec = Math.round(Number(totalMin) * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return {
    min: m > 0 ? String(m) : '',
    sec: s > 0 ? String(s) : m === 0 ? '0' : '',
  };
}

export function WholeClassView({ isDarkMode, theme, isLeft }) {
  const [presets, setPresets] = useState(DEFAULT_WHOLE_CLASS_PRESETS);
  const [activeTimer, setActiveTimer] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState(null);

  const editingPreset = editingPresetId
    ? presets.find((p) => p.id === editingPresetId)
    : null;
  const editParts = editingPreset ? partsFromMinutes(editingPreset.min) : null;

  const closeSetupModal = () => {
    setIsCustomModalOpen(false);
    setEditingPresetId(null);
  };

  const handleSave = (min, sec) => {
    const m = parseInt(min, 10) || 0;
    const s = parseInt(sec, 10) || 0;
    if (m === 0 && s === 0) return;
    const next = {
      label: labelFromDuration(min, sec),
      min: minutesFromDuration(min, sec),
      isCustom: true,
    };
    if (editingPresetId) {
      setPresets((prev) =>
        prev.map((p) => (p.id === editingPresetId ? { ...p, ...next } : p)),
      );
    } else {
      setPresets((prev) => [...prev, { id: `custom-${Date.now()}`, ...next }]);
    }
    closeSetupModal();
  };

  const handleStart = (min, sec) => {
    const m = parseInt(min, 10) || 0;
    const s = parseInt(sec, 10) || 0;
    if (m === 0 && s === 0) return;
    closeSetupModal();
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

  const openCreate = () => {
    setEditingPresetId(null);
    setIsCustomModalOpen(true);
  };

  const openEdit = (preset) => {
    setEditingPresetId(preset.id);
    setIsCustomModalOpen(true);
  };

  const actionBtn = `edu-control p-1.5 rounded-lg transition-colors ${theme.colorOnSurfaceVariant} hover:opacity-100`;

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-full">
      {!activeTimer ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 overflow-y-auto p-1 pt-2 pb-20">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setActiveTimer(preset)}
              className={`relative py-4 pl-5 ${preset.isCustom ? 'pr-16' : 'pr-5'} ${APP_GRID_CARD} flex items-center justify-start transition-all hover:scale-[1.02] active:scale-[0.98] group ${theme.colorSurface} ${theme.colorOutline}`}
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
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-20"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openEdit(preset)}
                    className={`${actionBtn} hover:bg-slate-100 dark:hover:bg-slate-800`}
                    title={`Edit ${preset.label}`}
                    aria-label={`Edit ${preset.label}`}
                  >
                    <Pencil size={16} strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePreset(preset.id)}
                    className={`${actionBtn} hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
                    title={`Delete ${preset.label}`}
                    aria-label={`Delete ${preset.label}`}
                  >
                    <Trash2 size={16} strokeWidth={2.25} />
                  </button>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col w-full min-h-0 h-full justify-center">
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
          onClick={openCreate}
          className={`${appFabClass(isLeft)} z-[250] ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          title="Create custom timer"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      ) : null}

      <TimerSetupModal
        isOpen={isCustomModalOpen}
        onClose={closeSetupModal}
        onSave={handleSave}
        onStart={handleStart}
        isDarkMode={isDarkMode}
        theme={theme}
        title={editingPreset ? 'Edit Timer' : 'Custom Timer'}
        icon={TimerIcon}
        showSavePreset
        initialMin={editParts?.min ?? ''}
        initialSec={editParts?.sec ?? ''}
      />
    </div>
  );
}
