import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';

/** Configure small-group names and count. */
export function GroupSetupModal({
  isOpen,
  onClose,
  onSave,
  isDarkMode,
  theme,
  initialGroups,
}) {
  const [count, setCount] = useState(initialGroups.length || 4);
  const [names, setNames] = useState(initialGroups);

  useEffect(() => {
    if (!isOpen) return;
    const startCount = initialGroups.length || 4;
    setCount(startCount);
    setNames(
      initialGroups.length
        ? [...initialGroups]
        : ['Group 1', 'Group 2', 'Group 3', 'Group 4'],
    );
  }, [isOpen, initialGroups]);

  const handleCountChange = (e) => {
    let val = parseInt(e.target.value, 10) || 1;
    if (val > 12) val = 12;
    setCount(val);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < val) next.push(`Group ${next.length + 1}`);
      return next.slice(0, val);
    });
  };

  const handleNameChange = (index, val) => {
    setNames((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const fieldClass = `w-full px-4 py-2.5 rounded-xl border ${TYPE.bodyMd} outline-none transition-all shadow-sm ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOutline} ${theme.colorOnSurface}`
      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Setup Small Groups"
      theme={theme}
      isDarkMode={isDarkMode}
      maxWidth="max-w-sm"
      headerStart={
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
        >
          <Layers size={18} />
        </div>
      }
      footer={
        <ModalPrimaryButton theme={theme} onClick={() => onSave(names)}>
          Save Groups
        </ModalPrimaryButton>
      }
    >
      <div className="px-6 py-5 space-y-4 max-h-[50vh] overflow-y-auto">
        <div>
          <label
            className={`block ${TYPE.labelMicro} mb-2 ${theme.colorOnSurfaceVariant}`}
          >
            Number of groups (max 12)
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={count}
            onChange={handleCountChange}
            className={`${fieldClass} ${TYPE.titleMd} py-3`}
          />
        </div>
        <div className="space-y-3">
          <label
            className={`block ${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}
          >
            Group names
          </label>
          {names.map((name, index) => (
            <input
              key={index}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder={`Group ${index + 1}`}
              className={fieldClass}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
