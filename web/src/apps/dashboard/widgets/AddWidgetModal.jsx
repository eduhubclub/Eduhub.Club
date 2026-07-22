import { Modal } from '../../../shared/Modal';
import { TYPE } from '../../../shared/typography';
import { WidgetCatalogPicker } from './WidgetCatalogPicker';

/**
 * Pick teaching widgets from other apps. Grouped by app; unavailable tools are locked.
 */
export function AddWidgetModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  pinnedIds = [],
  onPin,
  onUnpin,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title="Add widget"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-lg"
      zIndex="z-[200]"
      footer={
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
            isDarkMode
              ? 'text-slate-300 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Done
        </button>
      }
    >
      <div className="px-6 py-4">
        <p
          className={`${TYPE.bodyMd} ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Select tools from other apps to pin on your Dashboard sidebar.
        </p>
        <div className="mt-5">
          <WidgetCatalogPicker
            theme={theme}
            isDarkMode={isDarkMode}
            pinnedIds={pinnedIds}
            onPin={onPin}
            onUnpin={onUnpin}
            idPrefix="widget-modal"
          />
        </div>
      </div>
    </Modal>
  );
}
