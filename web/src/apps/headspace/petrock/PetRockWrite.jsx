import { useState } from 'react';
import { HEADSPACE_MOODS, isValidMood } from '../../../data/headspace/moods';
import { AppBoard } from '../../../shared/AppBoard';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { RockStage } from './RockStage';

/**
 * Mood + free-write letter to the rock. Save private or send to teacher.
 */
export function PetRockWrite({
  theme,
  isDarkMode,
  pet,
  pendingRequest = null,
  onSubmit,
  onCancel,
}) {
  const [mood, setMood] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);
  const hasRequest = pendingRequest?.status === 'pending';

  function save(share) {
    if (!isValidMood(mood)) {
      setError('Pick how you’re feeling.');
      return;
    }
    if (!body.trim()) {
      setError('Write a letter to your rock.');
      return;
    }
    setError('');
    onSubmit?.({ mood, body: body.trim(), share });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col items-center gap-2 lg:w-56">
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{pet.name}</p>
        <RockStage
          rockId={pet.rockId}
          eyes={pet.eyes}
          strokes={pet.strokes}
          seedKey={`write-${pet.updatedAt}`}
          className="max-h-48 w-auto max-w-full lg:max-h-56"
        />
      </div>

      <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
        <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
          Write to {pet.name}
        </h2>
        {hasRequest ? (
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Your teacher asked for a check-in. You can send this letter or keep it
            private.
          </p>
        ) : (
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Your rock is listening. Only you decide what to share.
          </p>
        )}

        <p className={`${TYPE.labelMd} mt-4 ${theme.colorOnSurface}`}>How are you feeling?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {HEADSPACE_MOODS.map((m) => {
            const on = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={on}
                onClick={() => setMood(m.id)}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                  on
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                    : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <label className={`mt-4 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
          Dear {pet.name},
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={`edu-control mt-1 w-full resize-y rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            placeholder="What’s on your mind today?"
          />
        </label>

        {error ? (
          <p className={`${TYPE.bodySm} mt-2 text-red-600`} role="alert">
            {error}
          </p>
        ) : null}

        <ButtonRow className="mt-4">
          <button type="button" className={toolBtn} onClick={onCancel}>
            <ButtonRowLabel>Cancel</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={toolBtn}
            onClick={() => save(false)}
          >
            <ButtonRowLabel>Save private</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={`edu-control inline-flex h-9 items-center rounded-xl px-3 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => save(true)}
          >
            <ButtonRowLabel>Send to teacher</ButtonRowLabel>
          </button>
        </ButtonRow>
      </AppBoard>
    </div>
  );
}
