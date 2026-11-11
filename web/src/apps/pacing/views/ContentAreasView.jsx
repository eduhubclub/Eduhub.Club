import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  availableMinutesByContent,
} from '../../../data/pacing/schoolSeed';
import {
  addPacingFromOnboarding,
  deletePacing,
} from '../../../data/pacing/pacingStorage';
import { flattenSlots } from '../../../data/pacing/pacingModel';
import { APP_GRID_CARD, APP_STATIC_BOARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { OnboardingModal } from '../components/OnboardingModal';
import { LessonSlotEditor } from '../components/LessonSlotEditor';

/**
 * Create and edit pacings attached to schedule content blocks.
 */
export function ContentAreasView({ theme, isDarkMode, store, grade }) {
  const toolBtn = toolBtnClass(isDarkMode);
  const blocks = availableMinutesByContent(grade);
  const [onboard, setOnboard] = useState(null);
  const [editSlot, setEditSlot] = useState(null);

  const byContent = useMemo(() => {
    const map = new Map();
    for (const block of blocks) map.set(block.contentKey, []);
    for (const pacing of store.pacings) {
      const list = map.get(pacing.contentKey) || [];
      list.push(pacing);
      map.set(pacing.contentKey, list);
    }
    return map;
  }, [blocks, store.pacings]);

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Content areas
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Pacings attach to schedule content blocks. Several pacings can share a
          block when needed.
        </p>
      </div>

      {blocks.map((block) => {
        const pacings = byContent.get(block.contentKey) || [];
        return (
          <div
            key={block.contentKey}
            className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {block.label}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  {block.minutes} min available / day
                </p>
              </div>
              <button
                type="button"
                className={`edu-control inline-flex items-center gap-1.5 rounded-xl px-3 py-2 ${TYPE.bodySm} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                onClick={() =>
                  setOnboard({
                    contentKey: block.contentKey,
                    contentLabel: block.label,
                    defaultMinutes: block.minutes,
                  })
                }
              >
                <Plus size={16} />
                Add pacing
              </button>
            </div>

            {pacings.length === 0 ? (
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                No pacings yet for this block.
              </p>
            ) : (
              pacings.map((pacing) => {
                const slots = flattenSlots(pacing);
                const fit =
                  pacing.averageLessonMinutes <= block.minutes
                    ? 'Fits daily block'
                    : `Avg ${pacing.averageLessonMinutes}m exceeds ${block.minutes}m block`;
                return (
                  <div
                    key={pacing.id}
                    className={`rounded-xl border-[1.5px] p-3 space-y-2 ${theme.colorOutline}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p
                          className={`${TYPE.bodyMd} font-medium ${theme.colorOnSurface}`}
                        >
                          {pacing.title}
                        </p>
                        <p
                          className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          {pacing.units.length} units · {slots.length} lessons ·
                          avg {pacing.averageLessonMinutes}m · {fit}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`${toolBtn} text-rose-500`}
                        title="Delete pacing"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete “${pacing.title}” and its calendar placements?`,
                            )
                          ) {
                            deletePacing(pacing.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <ul className="space-y-1 max-h-64 overflow-y-auto">
                      {slots.map(({ unitTitle, lesson }) => (
                        <li
                          key={lesson.id}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${theme.colorSurfaceVariant || ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={`${TYPE.bodySm} ${theme.colorOnSurface} truncate`}
                            >
                              {unitTitle} · {lesson.title}
                            </p>
                            {lesson.notes ? (
                              <p
                                className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant} truncate`}
                              >
                                {lesson.notes}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className={`edu-control p-1.5 rounded-lg ${theme.hoverBg || ''}`}
                            title="Edit lesson"
                            onClick={() =>
                              setEditSlot({ pacingId: pacing.id, lesson })
                            }
                          >
                            <Pencil size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      <OnboardingModal
        isOpen={Boolean(onboard)}
        onClose={() => setOnboard(null)}
        theme={theme}
        isDarkMode={isDarkMode}
        contentKey={onboard?.contentKey}
        contentLabel={onboard?.contentLabel}
        defaultMinutes={onboard?.defaultMinutes}
        onSubmit={(input) => addPacingFromOnboarding(input)}
      />

      <LessonSlotEditor
        key={editSlot?.lesson?.id || 'closed'}
        isOpen={Boolean(editSlot)}
        onClose={() => setEditSlot(null)}
        theme={theme}
        isDarkMode={isDarkMode}
        pacingId={editSlot?.pacingId}
        lesson={editSlot?.lesson}
      />
    </div>
  );
}
