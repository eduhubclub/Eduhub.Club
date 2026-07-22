import { StudentAvatar } from '../../shared/StudentAvatar';

import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

export function GroupCard({
  title,
  students,
  isDarkMode,
  theme,
  draggedStudent,
  index,
  onDragOver,
  onDrop,
  onDragStart,
  headerAction,
}) {
  const isDropTarget =
    draggedStudent && draggedStudent.sourceIndex !== index;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className={`${APP_GRID_CARD} p-5 transition-all min-h-[150px] flex flex-col ${
        isDropTarget
          ? isDarkMode
            ? 'ring-2 ring-slate-700 bg-slate-800/30 border-slate-600'
            : 'ring-2 ring-slate-300 bg-slate-50/80 border-slate-300'
          : isDarkMode
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`flex items-center justify-between -mx-5 -mt-5 mb-4 px-5 py-3 rounded-t-2xl ${theme.colorPrimaryContainer}`}
      >
        <h3
          className={`${TYPE.titleMd} ${theme.colorOnPrimaryContainer}`}
        >
          {title}
        </h3>
        {headerAction}
      </div>
      <div className="space-y-1 flex-1">
        {students.map((student) => (
          <div
            key={student.id}
            draggable
            onDragStart={(e) => onDragStart(e, student, index)}
            className={`flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${
              isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
            }`}
          >
            <StudentAvatar student={student} theme={theme} size="sm" isDarkMode={isDarkMode} />
            <span
              className={`${TYPE.bodyMd} ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {student.name}
            </span>
          </div>
        ))}
        {students.length === 0 && (
          <div className={`h-full w-full flex items-center justify-center text-slate-400 italic ${TYPE.bodySm} py-4 print:hidden`}>
            Drop student here
          </div>
        )}
      </div>
    </div>
  );
}
