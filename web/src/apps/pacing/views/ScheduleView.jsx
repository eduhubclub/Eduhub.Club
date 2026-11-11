import {
  availableMinutesByContent,
  listGrades,
  totalInstructionalMinutes,
} from '../../../data/pacing/schoolSeed';
import { setGradeId } from '../../../data/pacing/pacingStorage';
import { APP_GRID_CARD, APP_STATIC_BOARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

const KIND_STYLES = {
  instruction: '',
  break: 'opacity-70',
  transition: 'opacity-50',
};

/**
 * Day timeline + available minutes by content block (from TES seed).
 */
export function ScheduleView({ theme, store, school, grade }) {
  const grades = listGrades(school.id);
  const available = availableMinutesByContent(grade);
  const total = totalInstructionalMinutes(grade);

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div>
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Building schedule
            </p>
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Temporary TES seed — instructional minutes available for pacing.
            </p>
          </div>
          <label className="space-y-1">
            <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Grade / rotation
            </span>
            <select
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              value={store.gradeId}
              onChange={(e) => setGradeId(e.target.value)}
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          {total} instructional minutes / day · day ends {grade.endOfDay}
        </p>
      </div>

      <div
        className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface} mb-3`}>
          Available by content block
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((block) => (
            <div
              key={block.contentKey}
              className={`rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutline} ${theme.colorSurfaceVariant || ''}`}
            >
              <p className={`${TYPE.bodyMd} font-medium ${theme.colorOnSurface}`}>
                {block.label}
              </p>
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {block.minutes} min / day · {block.minutes * 5} min / week
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface} mb-3`}>
          Day timeline
        </p>
        <ul className="space-y-1.5">
          {grade.periods.map((period) => (
            <li
              key={period.id}
              className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutline} ${KIND_STYLES[period.kind] || ''}`}
            >
              <span
                className={`tabular-nums shrink-0 w-24 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
              >
                {period.start}–{period.end}
              </span>
              <span className={`flex-1 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                {period.label}
              </span>
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {period.minutes}m
              </span>
              {period.kind === 'instruction' ? (
                <span
                  className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-lg ${theme.colorPrimaryContainer || theme.colorPrimary} ${theme.colorOnPrimaryContainer || theme.colorOnPrimary}`}
                >
                  teach
                </span>
              ) : (
                <span
                  className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-lg ${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`}
                >
                  {period.kind}
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Schedule is read-only until District owns school schedules.
        </p>
      </div>
    </div>
  );
}
