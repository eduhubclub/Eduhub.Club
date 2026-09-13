import { ImagePlus } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { WidgetShell } from './WidgetShell';

/**
 * Teacher-authored card: title, optional image, text, and assigned student.
 * Fills the pin cell so the board can fit the viewport.
 */
export function CustomWidget({ theme, isDarkMode, pin, roster }) {
  const title = String(pin?.props?.title || 'Custom').trim() || 'Custom';
  const text = String(pin?.props?.text || '').trim();
  const imageSrc = String(pin?.props?.imageSrc || '').trim();
  const studentId = String(pin?.props?.studentId || '').trim();
  const student =
    studentId && Array.isArray(roster)
      ? roster.find((s) => String(s.id) === studentId)
      : null;

  return (
    <WidgetShell theme={theme} title={title} icon={ImagePlus} pin={pin}>
      <div className="flex h-full min-h-0 flex-col gap-2">
        {imageSrc ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        {student ? (
          <div className="flex shrink-0 items-center gap-2 min-w-0">
            <StudentAvatar
              student={student}
              theme={theme}
              size="sm"
              isDarkMode={isDarkMode}
            />
            <p className={`${TYPE.titleSm} truncate ${theme.colorOnSurface}`}>
              {studentDisplayName(student)}
            </p>
          </div>
        ) : null}
        {text ? (
          <p
            className={`${TYPE.bodyMd} shrink-0 whitespace-pre-wrap ${theme.colorOnSurface}`}
          >
            {text}
          </p>
        ) : null}
        {!imageSrc && !text && !student ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Add a title, image, text, or student in Edit board.
          </p>
        ) : null}
      </div>
    </WidgetShell>
  );
}
