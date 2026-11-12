import { TYPE } from '../../shared/typography';

export function testFieldClass(theme) {
  return `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
}
