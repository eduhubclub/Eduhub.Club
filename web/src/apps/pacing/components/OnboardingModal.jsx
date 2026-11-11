import { useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { toIsoDate } from '../../../data/pacing/pacingModel';

/**
 * Curriculum onboarding: title, average lesson time, units, lessons per unit.
 */
export function OnboardingModal({
  isOpen,
  onClose,
  onSubmit,
  theme,
  isDarkMode,
  contentKey,
  contentLabel,
  defaultMinutes,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [title, setTitle] = useState('');
  const [averageLessonMinutes, setAverageLessonMinutes] = useState(
    String(defaultMinutes || 45),
  );
  const [unitCount, setUnitCount] = useState('4');
  const [lessonsPerUnit, setLessonsPerUnit] = useState('5');
  const [startDate, setStartDate] = useState(toIsoDate(new Date()));

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const units = Math.max(1, Math.round(Number(unitCount) || 1));
    const per = Math.max(0, Math.round(Number(lessonsPerUnit) || 0));
    onSubmit({
      title: title.trim() || contentLabel || 'Curriculum',
      contentKey,
      averageLessonMinutes: Math.max(1, Math.round(Number(averageLessonMinutes) || 45)),
      unitLessonCounts: Array.from({ length: units }, () => per),
      startDate,
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New pacing · ${contentLabel || contentKey}`}
      isDarkMode={isDarkMode}
      theme={theme}
    >
      <form onSubmit={handleSubmit} className="space-y-3 p-5 sm:p-6">
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Title of curriculum
          </span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Arts & Letters Module 1"
            autoFocus
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Average lesson time (minutes)
          </span>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={averageLessonMinutes}
            onChange={(e) => setAverageLessonMinutes(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              How many units
            </span>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Lessons per unit
            </span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={lessonsPerUnit}
              onChange={(e) => setLessonsPerUnit(e.target.value)}
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Start date
          </span>
          <input
            type="date"
            className={fieldClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Creates empty lesson slots you can fill with links, notes, and details.
          Block has {defaultMinutes} min available on this schedule.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={toolBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.bodyMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Create framework
          </button>
        </div>
      </form>
    </Modal>
  );
}
