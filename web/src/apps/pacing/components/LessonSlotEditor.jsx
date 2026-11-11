import { useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { updateLessonSlot } from '../../../data/pacing/pacingStorage';

/**
 * Edit a lesson slot: title, notes, link, image URL, minutes.
 */
export function LessonSlotEditor({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  pacingId,
  lesson,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [title, setTitle] = useState(lesson?.title || '');
  const [notes, setNotes] = useState(lesson?.notes || '');
  const [linkUrl, setLinkUrl] = useState(lesson?.links?.[0]?.url || '');
  const [linkLabel, setLinkLabel] = useState(lesson?.links?.[0]?.label || 'Resource');
  const [imageUrl, setImageUrl] = useState(lesson?.imageUrl || '');
  const [averageMinutes, setAverageMinutes] = useState(
    String(lesson?.averageMinutes || 45),
  );

  if (!lesson) return null;

  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const save = (e) => {
    e.preventDefault();
    const links = linkUrl.trim()
      ? [
          {
            id: lesson.links?.[0]?.id || `lnk-${Date.now().toString(36)}`,
            label: linkLabel.trim() || 'Resource',
            url: linkUrl.trim(),
          },
        ]
      : [];
    updateLessonSlot(pacingId, lesson.id, {
      title: title.trim() || lesson.title,
      notes,
      links,
      imageUrl: imageUrl.trim(),
      averageMinutes: Math.max(1, Math.round(Number(averageMinutes) || 45)),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit lesson slot"
      isDarkMode={isDarkMode}
      theme={theme}
      maxWidth="max-w-xl"
    >
      <form onSubmit={save} className="space-y-3 p-5 sm:p-6">
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Title
          </span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Notes / details
          </span>
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Link label
            </span>
            <input
              className={fieldClass}
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Link URL
            </span>
            <input
              className={fieldClass}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Image URL
          </span>
          <input
            className={fieldClass}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Minutes
          </span>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={averageMinutes}
            onChange={(e) => setAverageMinutes(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={toolBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.bodyMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
