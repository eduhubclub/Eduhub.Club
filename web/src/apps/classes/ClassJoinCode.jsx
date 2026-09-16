import { TYPE } from '../../shared/typography';
import { normalizeJoinCode } from '../../data/auth/codes';

/** Visible class code on cards, class detail, and Classroom sign-in. */
export function ClassJoinCode({ joinCode, theme, size = 'card' }) {
  const code = normalizeJoinCode(joinCode);
  if (!code) return null;
  const large = size === 'lg';
  return (
    <div
      className={`rounded-xl border-[1.5px] ${large ? 'px-4 py-3' : 'px-2.5 py-2'} ${theme.colorOutline} ${theme.colorSurfaceVariant}`}
    >
      <p className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>Class code</p>
      <p
        className={`mt-0.5 font-mono tracking-[0.18em] ${large ? TYPE.titleLg : TYPE.titleSm} ${theme.colorOnSurface}`}
      >
        {code}
      </p>
    </div>
  );
}
