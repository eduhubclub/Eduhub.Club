import { useEffect, useState } from 'react';
import { bestOnColor } from '../../../shared/colorContrast';
import { portraitById } from '../../../data/writingBuddy/constants';
import { TYPE } from '../../../shared/typography';

/**
 * Round character portrait for the writing buddy.
 * Pass `imageUrl` for a custom upload; otherwise uses a built-in portrait.
 * Built-in character art has no fill: a thick ring, with the head above it.
 */

/** Ring box is 100 wide; frame is taller so the head has room above the ring. */
const POP_FRAME = {
  sm: { frame: 'h-[4.08rem] w-12', ring: 'border-[3px]' },
  md: { frame: 'h-[6.8rem] w-20', ring: 'border-4' },
  lg: { frame: 'h-[9.52rem] w-28', ring: 'border-[5px]' },
};

/**
 * Mask matches an img that is 118% as wide as the ring and as tall as the frame.
 * The circle stays inside the stroke. The ellipse is only the head, so the
 * hair can cross the ring while the shoulders stay inside it.
 */
const POP_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 136" preserveAspectRatio="none"><circle cx="59" cy="86" r="45" fill="white"/><ellipse cx="59" cy="34" rx="50" ry="32" fill="white"/></svg>`,
)}")`;

function PopOutPortrait({ src, size, theme }) {
  const spec = POP_FRAME[size] || POP_FRAME.md;
  return (
    <div className={`relative overflow-visible ${spec.frame}`} aria-hidden>
      <div
        className={`absolute bottom-0 left-0 aspect-square w-full rounded-full border-current ${spec.ring} ${
          theme?.colorOnSurface || 'text-slate-900'
        }`}
      />
      <img
        src={src}
        alt=""
        className="absolute bottom-0 left-1/2 h-full w-[118%] max-w-none -translate-x-1/2 object-cover object-top"
        style={{
          maskImage: POP_MASK,
          WebkitMaskImage: POP_MASK,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}

const WRITING_ART_CLASS = {
  sm: 'h-auto w-full max-w-[5.5rem] object-contain',
  md: 'h-auto w-full max-w-[7.5rem] object-contain',
  lg: 'h-auto w-full max-w-[14rem] object-contain',
};

/** Plays the writing loop a set number of times, then freezes on the still. */
function WritingBuddyArt({ animatedSrc, stillSrc, loopMs, loops, imgClassName }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(false);
    const ms = Math.max(1, Number(loopMs) || 1) * Math.max(1, Number(loops) || 1);
    const t = window.setTimeout(() => setPaused(true), ms);
    return () => window.clearTimeout(t);
  }, [animatedSrc, stillSrc, loopMs, loops]);

  return (
    <img
      key={paused ? 'still' : 'play'}
      src={paused ? stillSrc || animatedSrc : animatedSrc}
      alt=""
      className={imgClassName || WRITING_ART_CLASS.lg}
      aria-hidden
    />
  );
}

export function BuddyPortrait({
  portraitId,
  imageUrl = '',
  name,
  theme,
  size = 'md',
  /** `writing` swaps in the buddy’s writing loop when one exists. */
  pose = 'idle',
  className = '',
}) {
  const portrait = portraitById(portraitId);
  const custom = String(imageUrl || '').trim();
  const writingAnimated =
    pose === 'writing' ? String(portrait.writingImage || '').trim() : '';
  const writingStill =
    pose === 'writing'
      ? String(portrait.writingStill || portrait.writingImage || '').trim()
      : '';
  const writingArt = writingAnimated || writingStill;
  const builtInArt = String(portrait.image || '').trim();
  const on = bestOnColor(portrait.bg);
  const dim =
    size === 'lg'
      ? 'h-28 w-28 text-4xl'
      : size === 'sm'
        ? 'h-12 w-12 text-xl'
        : 'h-20 w-20 text-3xl';
  const writingLoops = Number(portrait.writingLoops) || 0;
  const writingClass = WRITING_ART_CLASS[size] || WRITING_ART_CLASS.md;

  let face = null;
  if (writingArt && !custom) {
    face =
      writingAnimated && writingLoops > 0 ? (
        <WritingBuddyArt
          animatedSrc={writingAnimated}
          stillSrc={writingStill || writingAnimated}
          loopMs={portrait.writingLoopMs || 4800}
          loops={writingLoops}
          imgClassName={writingClass}
        />
      ) : (
        <img
          src={writingArt}
          alt=""
          className={writingClass}
          aria-hidden
        />
      );
  } else if (!custom && builtInArt) {
    face = <PopOutPortrait src={builtInArt} size={size} theme={theme} />;
  } else {
    face = (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-black/10 shadow-sm ${dim}`}
        style={{ backgroundColor: portrait.bg, color: on.hex }}
        aria-hidden
      >
        {custom ? (
          <img src={custom} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="leading-none">{portrait.emoji}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {face}
      {name ? (
        <p
          className={`${TYPE.labelMd} text-center ${
            theme?.colorOnSurface || 'text-slate-800'
          }`}
        >
          {name}
        </p>
      ) : null}
    </div>
  );
}
