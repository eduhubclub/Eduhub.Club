import { TYPE } from '../../shared/typography';
import { studentDisplayName } from '../../data/students/displayName';

/**
 * Horizontal student chips for teacher whole-class Pet Rock / Inbox use.
 */
export function StudentPicker({
  roster = [],
  selectedId,
  onSelect,
  theme,
  label = 'Student',
}) {
  if (!roster.length) {
    return (
      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        No students in this class yet.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {roster.map((student) => {
          const id = String(student.id);
          const on = id === String(selectedId || '');
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect?.(id)}
              className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelSm} ${
                on
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                  : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
              }`}
            >
              {studentDisplayName(student)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
