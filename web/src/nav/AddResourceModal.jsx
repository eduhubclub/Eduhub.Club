import { Folder, FileText, Monitor, BookOpen, Star, Heart } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { ModalPrimaryButton } from '../shared/ModalPrimaryButton';
import { ModalIconPicker } from '../shared/ModalIconOption';
import { TYPE } from '../shared/typography';

export const RESOURCE_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'File', icon: FileText },
  { name: 'Monitor', icon: Monitor },
  { name: 'Book', icon: BookOpen },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
];

export function AddResourceModal({
  isOpen,
  isDarkMode,
  theme,
  newItemName,
  newItemDesc,
  newItemIcon,
  onNameChange,
  onDescChange,
  onIconChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title="Add New Resource"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl ${TYPE.labelLg} transition-colors ${
              isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} disabled={!newItemName.trim()} onClick={onSubmit}>
            Add Resource
          </ModalPrimaryButton>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="p-6 space-y-5"
      >
        <div>
          <label
            className={`block ${TYPE.labelMicro} mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Resource Name
          </label>
          <input
            type="text"
            autoFocus
            value={newItemName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Q3 Syllabus"
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white focus:border-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-400 focus:bg-white'
            }`}
          />
        </div>

        <div>
          <label
            className={`block ${TYPE.labelMicro} mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Description (Optional)
          </label>
          <input
            type="text"
            value={newItemDesc}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder="Brief description..."
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-colors ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white focus:border-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-400 focus:bg-white'
            }`}
          />
        </div>

        <div>
          <label
            className={`block ${TYPE.labelMicro} mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Icon
          </label>
          <ModalIconPicker
            options={RESOURCE_ICONS}
            value={newItemIcon}
            onChange={onIconChange}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </form>
    </Modal>
  );
}
