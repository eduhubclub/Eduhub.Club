import { TYPE } from '../../../shared/typography';

/**
 * Kid-facing speech bubble for the buddy’s current prompt.
 * `tail`: `bottom` | `left` (buddy on left) | `right` (buddy on right).
 */
export function SpeechBubble({ theme, children, className = '', tail = 'bottom' }) {
  let tailClass = `absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b-[1.5px] border-r-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`;
  let padClass = '';
  if (tail === 'right') {
    tailClass = `absolute top-1/2 -right-2 h-4 w-4 -translate-y-1/2 rotate-45 border-r-[1.5px] border-t-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`;
    padClass = 'pr-2';
  } else if (tail === 'left') {
    tailClass = `absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rotate-45 border-b-[1.5px] border-l-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`;
    padClass = 'pl-2';
  }

  return (
    <div className={`relative ${padClass} ${className}`}>
      <div
        className={`rounded-2xl border-[1.5px] px-4 py-3 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
      >
        {children}
      </div>
      <div className={tailClass} aria-hidden />
    </div>
  );
}
