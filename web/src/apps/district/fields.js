import { TYPE } from '../../shared/typography';

export function districtFieldClass(theme) {
  return `edu-control w-full min-w-0 rounded-xl border-[1.5px] px-3 py-2 outline-none ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
}

export function districtTimeClass(theme) {
  return `edu-control rounded-xl border-[1.5px] px-2 py-2 outline-none ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
}

export function districtQuietButton(theme) {
  return `edu-control inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border-[1.5px] ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
}
