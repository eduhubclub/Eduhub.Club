import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BuddyPortrait } from './BuddyPortrait';
import { SpeechBubble } from './SpeechBubble';

/**
 * Compact write-step header: buddy · bubble · options (left-anchored).
 */
export function WriteChrome({
  theme,
  portraitId,
  portraitImage = '',
  buddyName,
  bubble,
  pose = 'idle',
  actions = null,
  below = null,
}) {
  return (
    <div className="shrink-0 space-y-2">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        <BuddyPortrait
          theme={theme}
          portraitId={portraitId}
          imageUrl={portraitImage}
          name={buddyName}
          size="md"
          pose={pose}
          className="shrink-0"
        />
        <SpeechBubble
          theme={theme}
          tail="left"
          className="min-w-0 max-w-[min(100%,14rem)] shrink sm:max-w-xs"
        >
          {bubble}
        </SpeechBubble>
        {actions ? (
          <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-start justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {below}
    </div>
  );
}

function arrowBtnClass(theme, primary) {
  return `edu-control flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl ${
    primary
      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
      : `border-[1.5px] ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
  } disabled:opacity-40`;
}

/**
 * Back / Next arrows flanking the writing body (textarea or revise board).
 */
export function WriteNavRow({
  theme,
  children,
  onBack,
  onNext,
  backDisabled = false,
  nextDisabled = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  className = '',
}) {
  return (
    <div className={`flex min-h-0 flex-1 items-stretch gap-2 sm:gap-3 ${className}`}>
      {onBack ? (
        <button
          type="button"
          className={arrowBtnClass(theme, false)}
          disabled={backDisabled}
          aria-label={backLabel}
          onClick={onBack}
        >
          <ChevronLeft size={22} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      {onNext ? (
        <button
          type="button"
          className={arrowBtnClass(theme, true)}
          disabled={nextDisabled}
          aria-label={nextLabel}
          onClick={onNext}
        >
          <ChevronRight size={22} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Full-width piece progress for the write stage bottom (bar only).
 */
export function WriteProgressBar({ theme, current, total }) {
  const t = Math.max(0, Number(total) || 0);
  const c = Math.min(Math.max(0, Number(current) || 0), t || 1);
  const pct = t > 0 ? Math.round((c / t) * 100) : 0;

  return (
    <div
      className={`h-2.5 w-full shrink-0 overflow-hidden rounded-full border-[1.5px] ${theme.colorOutline}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={t}
      aria-valuenow={c}
      aria-label={`Piece ${c} of ${t}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${theme.colorPrimary}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
