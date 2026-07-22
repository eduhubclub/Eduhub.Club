import { TYPE } from './typography';

/**
 * Canonical toolbar chip used under ButtonRow across apps.
 * Type: TYPE.labelMd. Pair with shared/ButtonRow.
 */
export function toolBtnClass(isDarkMode) {
  return `edu-control inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl ${TYPE.labelMd} transition-colors ${
    isDarkMode
      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
  }`;
}
