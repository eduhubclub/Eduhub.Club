import { TYPE } from '../../../shared/typography';
import { specialtiesInText } from './specialtyPunctuation';

/**
 * Lists keyboard shortcuts for specialty punctuation found in the passage.
 */
export function SpecialtyShortcutsHint({ text, theme, className = '' }) {
  const rows = specialtiesInText(text);
  if (!rows.length) return null;

  return (
    <div
      className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant} ${className}`.trim()}
      role="note"
    >
      <span className={`${theme.colorOnSurface} font-medium`}>Shortcuts: </span>
      {rows.map((row, i) => (
        <span key={row.char}>
          {i > 0 ? <span aria-hidden> · </span> : null}
          <kbd
            className={`rounded border-[1.5px] px-1.5 py-0.5 font-mono ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          >
            {row.shortcut}
          </kbd>
          <span>
            {' '}
            → {row.char} ({row.name})
          </span>
        </span>
      ))}
    </div>
  );
}
