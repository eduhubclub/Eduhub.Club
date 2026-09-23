import { Pencil, PenLine } from 'lucide-react';
import { moodLabel } from '../../../data/headspace/moods';
import { AppBoard } from '../../../shared/AppBoard';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { StageToolLayout } from '../../../shared/StageToolLayout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { RockStage } from './RockStage';

/**
 * Rock home: portrait, write CTA, recent entries.
 */
export function PetRockHome({
  theme,
  isDarkMode,
  pet,
  entries = [],
  pendingRequest = null,
  onWrite,
  onEdit,
  onDeclineRequest,
}) {
  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <StageToolLayout
      theme={theme}
      toolbar={
        <>
          <button type="button" className={toolBtn} onClick={onEdit}>
            <Pencil size={16} aria-hidden />
            <ButtonRowLabel>Edit rock</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={`edu-control inline-flex h-9 items-center gap-1.5 rounded-xl px-3 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={onWrite}
          >
            <PenLine size={16} aria-hidden />
            <ButtonRowLabel>Write today</ButtonRowLabel>
          </button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{pet.name}</h2>
          <RockStage
            rockId={pet.rockId}
            eyes={pet.eyes}
            strokes={pet.strokes}
            seedKey={`home-${pet.updatedAt}`}
            className="max-h-full w-auto max-w-full"
          />
        </div>

        <div className="flex min-h-0 w-full flex-col gap-3 lg:w-80 lg:shrink-0">
          {pendingRequest?.status === 'pending' ? (
            <AppBoard mode="grid" pad="board" theme={theme}>
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                Teacher asked for a check-in
              </p>
              {pendingRequest.note ? (
                <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                  {pendingRequest.note}
                </p>
              ) : (
                <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                  Write a letter and send it when you’re ready — you’re in control.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  onClick={onWrite}
                >
                  Write &amp; send
                </button>
                <button type="button" className={toolBtn} onClick={onDeclineRequest}>
                  Not now
                </button>
              </div>
            </AppBoard>
          ) : null}

          <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Letters</p>
            {entries.length === 0 ? (
              <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
                No letters yet. Say hi to {pet.name}.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-xl border-[1.5px] p-3 ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline}`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
                        {entry.dateISO}
                      </span>
                      <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                        {moodLabel(entry.mood) || entry.mood}
                        {entry.status === 'shared' ? ' · sent' : ' · private'}
                      </span>
                    </div>
                    <p
                      className={`${TYPE.bodySm} mt-1 line-clamp-3 ${theme.colorOnSurface}`}
                    >
                      {entry.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AppBoard>
        </div>
      </div>
    </StageToolLayout>
  );
}
