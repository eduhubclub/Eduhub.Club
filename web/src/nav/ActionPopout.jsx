import { TYPE } from '../shared/typography';

/** Floating action menu for nav items with type: 'popout'. */
export function ActionPopout({ popoutRef, item, popoutRect, isDarkMode, theme, onAction, onClose }) {
  if (!item?.actions || !popoutRect) return null;

  return (
    <div
      ref={popoutRef}
      className={`fixed z-[100] w-48 rounded-xl shadow-xl border overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
      style={{
        top: popoutRect.top,
        transform: 'translateY(-50%)',
        left: popoutRect.left,
        right: popoutRect.right,
      }}
    >
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${theme.colorPrimary} ${theme.border} ${theme.colorOnPrimary}`}
      >
        <span className={TYPE.labelMicro}>{item.name} Options</span>
      </div>

      <div className="py-2">
        {item.actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => {
              onAction?.(action);
              onClose();
            }}
            className={`w-full flex items-center px-4 py-2 ${TYPE.bodyMd} transition-colors ${
              action.color ||
              (isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')
            }`}
          >
            <action.icon
              size={16}
              className={`mr-3 ${
                action.color || (isDarkMode ? 'text-slate-500' : 'text-slate-400')
              }`}
            />
            {action.name}
          </button>
        ))}
      </div>
    </div>
  );
}
