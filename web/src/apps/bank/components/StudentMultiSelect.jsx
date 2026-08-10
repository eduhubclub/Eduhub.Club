import { useMemo, useState } from 'react';
import { TYPE } from '../../../shared/typography';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { APP_NESTED_CARD } from '../../../shared/layout';
import { studentDisplayName } from '../../../data/students/displayName';

/**
 * Multi-select roster chips for payday / behavior / job assign.
 */
export function StudentMultiSelect({
  roster,
  selectedIds,
  onChange,
  theme,
  isDarkMode,
}) {
  const selected = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);

  const toggle = (id) => {
    const next = new Set(selected);
    const key = String(id);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  const allIds = roster.map((s) => String(s.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          onClick={() => onChange(allIds)}
        >
          Select all
        </button>
        <button
          type="button"
          className={`edu-control rounded-xl px-3 py-1.5 ${TYPE.labelMd} ${
            isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
          }`}
          onClick={() => onChange([])}
        >
          Clear
        </button>
      </div>
      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
        {roster.map((student) => {
          const id = String(student.id);
          const on = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`edu-control inline-flex items-center gap-2 rounded-xl border-[1.5px] px-2.5 py-1.5 ${TYPE.labelMd} ${
                on
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                  : `${APP_NESTED_CARD} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
              }`}
            >
              <StudentAvatar student={student} theme={theme} size="xs" />
              <span className="max-w-[7rem] truncate">{studentDisplayName(student)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
