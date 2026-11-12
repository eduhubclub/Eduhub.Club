import { useMemo, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { draftsForClass, removeDraft } from '../../../data/writingBuddy/storage';
import { studentDisplayName } from '../../../data/students/displayName';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { TYPE } from '../../../shared/typography';
import { BuddyPortrait } from '../components/BuddyPortrait';

/**
 * Saved / in-progress drafts for the selected class.
 */
export function SavedView({
  theme,
  isDarkMode,
  classId,
  roster,
  teacherPreviewId = '',
  teacherPreviewLabel = 'Teacher',
}) {
  const [tick, setTick] = useState(0);
  const drafts = useMemo(() => {
    void tick;
    return draftsForClass(classId).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [classId, tick]);

  const nameById = useMemo(() => {
    const map = new Map();
    for (const s of roster || []) {
      map.set(String(s.id), studentDisplayName(s));
    }
    if (teacherPreviewId) {
      map.set(String(teacherPreviewId), teacherPreviewLabel);
    }
    return map;
  }, [roster, teacherPreviewId, teacherPreviewLabel]);

  if (!drafts.length) {
    return (
      <EmptyState
        isDarkMode={isDarkMode}
        message="No saved drafts for this class yet. Finished and in-progress writing will show up here."
        illustration={<NotebookPen size={36} className="text-slate-400" />}
      />
    );
  }

  return (
    <ContentCardGrid>
      {drafts.map((d) => (
        <AppBoard key={d.id} mode="grid" pad="board" theme={theme}>
          <div className="flex items-start gap-3">
            <BuddyPortrait
              theme={theme}
              portraitId={d.portraitId}
              imageUrl={d.portraitImage || ''}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                {nameById.get(String(d.studentId)) || 'Student'}
              </p>
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                {d.topic || '(no topic)'} · {d.genre} · {d.length}
                {d.status === 'done' ? ' · done' : ' · in progress'}
              </p>
              <pre
                className={`mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl border-[1.5px] p-2 ${TYPE.bodySm} ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              >
                {d.draftText ||
                  Object.values(d.pieces || {})
                    .filter(Boolean)
                    .join('\n\n') ||
                  '(empty)'}
              </pre>
              <button
                type="button"
                className={`edu-control mt-3 rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                onClick={() => {
                  removeDraft(d.id);
                  setTick((n) => n + 1);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </AppBoard>
      ))}
    </ContentCardGrid>
  );
}
